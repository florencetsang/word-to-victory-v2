import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { BOOKS_BY_CODE, chapterKey, type ChapterRef } from '@/domain/bible'
import type { ReadEntry, ReadMap } from '@/domain/progress'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

type RawRead = [code: string, chapter: number, readBy: string | null, readAt: string]

export const toReadMap = (raw: unknown): Map<string, ReadEntry> =>
  new Map(
    ((raw ?? []) as RawRead[]).map(([code, chapter, readBy, readAt]) => [
      chapterKey(code, chapter),
      { code, chapter, readBy, readAt },
    ]),
  )

export const readsKey = (recordId: string) => ['reads', recordId] as const

export function useReads(recordId: string | undefined) {
  return useQuery({
    queryKey: readsKey(recordId ?? ''),
    enabled: !!recordId,
    queryFn: async (): Promise<ReadMap> => {
      const { data, error } = await supabase.rpc('record_reads', { p_record: recordId! })
      if (error) throw error
      return toReadMap(data)
    },
  })
}

const invalidateRecord = (qc: ReturnType<typeof useQueryClient>, recordId: string) => {
  void qc.invalidateQueries({ queryKey: readsKey(recordId) })
  void qc.invalidateQueries({ queryKey: ['activity', recordId] })
  void qc.invalidateQueries({ queryKey: ['feed', recordId] })
  void qc.invalidateQueries({ queryKey: ['group-progress'] })
}

/**
 * Marks/unmarks a set of chapters with an optimistic cache update.
 * `read: true` inserts (ignoring ones already read), `read: false` deletes.
 */
export function useSetChapters(recordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ chapters, read }: { chapters: ChapterRef[]; read: boolean }) => {
      if (chapters.length === 0) return
      if (read) {
        const { error } = await supabase.from('chapter_reads').upsert(
          chapters.map((c) => ({ record_id: recordId, book_code: c.code, chapter: c.chapter })),
          { ignoreDuplicates: true, onConflict: 'record_id,book_code,chapter' },
        )
        if (error) throw error
        return
      }
      const byBook = new Map<string, ChapterRef[]>()
      for (const c of chapters) byBook.set(c.code, [...(byBook.get(c.code) ?? []), c])
      for (const [code, refs] of byBook) {
        const all = refs.length === BOOKS_BY_CODE.get(code)?.chapters
        let q = supabase.from('chapter_reads').delete().eq('record_id', recordId).eq('book_code', code)
        if (!all)
          q = q.in(
            'chapter',
            refs.map((r) => r.chapter),
          )
        const { error } = await q
        if (error) throw error
      }
    },
    onMutate: async ({ chapters, read }) => {
      await qc.cancelQueries({ queryKey: readsKey(recordId) })
      const prev = qc.getQueryData<ReadMap>(readsKey(recordId))
      const next = new Map(prev)
      const now = new Date().toISOString()
      for (const c of chapters) {
        const k = chapterKey(c.code, c.chapter)
        if (read) {
          if (!next.has(k)) next.set(k, { code: c.code, chapter: c.chapter, readBy: null, readAt: now })
        } else next.delete(k)
      }
      qc.setQueryData(readsKey(recordId), next)
      return { prev }
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(readsKey(recordId), ctx.prev)
      toast.error(errorMessage(e))
    },
    onSettled: () => invalidateRecord(qc, recordId),
  })
}

/** Live updates for records edited by several people (shared groups). */
export function useRealtimeReads(recordId: string | undefined, enabled = true) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!recordId || !enabled) return
    const refresh = () => invalidateRecord(qc, recordId)
    // DELETE events can't be filtered server-side; they only carry the primary key, so match it here.
    const channel = supabase
      .channel(`reads:${recordId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chapter_reads', filter: `record_id=eq.${recordId}` },
        refresh,
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chapter_reads' }, (payload) => {
        if ((payload.old as { record_id?: string }).record_id === recordId) refresh()
      })
      .subscribe()
    return () => void supabase.removeChannel(channel)
  }, [recordId, enabled, qc])
}
