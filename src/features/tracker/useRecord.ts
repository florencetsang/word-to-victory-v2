import { useCallback } from 'react'
import { useProfile } from '@/features/auth/auth'
import type { ChapterRef } from '@/domain/bible'
import { useActivity } from '@/features/stats/api'
import { useReads, useSetChapters } from './api'

/** Everything a page needs to show and edit one reading record. */
export function useRecord(recordId: string | undefined, { editable = true } = {}) {
  const reads = useReads(recordId)
  const activity = useActivity(recordId)
  const { data: profile } = useProfile()
  const mutation = useSetChapters(recordId ?? '')
  const { mutate } = mutation
  const setChapters = useCallback((chapters: ChapterRef[], read: boolean) => mutate({ chapters, read }), [mutate])
  return {
    reads,
    activity,
    versionId: profile?.bible_version_id,
    setChapters: editable && recordId ? setChapters : undefined,
  }
}
