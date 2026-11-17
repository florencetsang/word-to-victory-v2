import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePersonalRecordId, useUserId } from '@/features/auth/auth'
import { toReadMap } from '@/features/tracker/api'
import { publicOrigin } from '@/lib/platform'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

/** Shares of my personal record (both public link and per-user). */
export function useMyShares() {
  const { data: recordId } = usePersonalRecordId()
  return useQuery({
    queryKey: ['my-shares', recordId],
    enabled: !!recordId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('record_shares')
        .select('id, shared_with_email, public_token, created_at')
        .eq('record_id', recordId!)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

function useShareMutation<T>(fn: (arg: T) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-shares'] }),
    onError: (e) => toast.error(errorMessage(e)),
  })
}

export const useShareWithEmail = () =>
  useShareMutation(async (email: string) => {
    const { error } = await supabase.rpc('share_with_email', { p_email: email })
    if (error) throw error
  })

export const useCreatePublicLink = () =>
  useShareMutation(async () => {
    const { error } = await supabase.rpc('create_public_link')
    if (error) throw error
  })

export const useRevokeShare = () =>
  useShareMutation(async (id: string) => {
    const { error } = await supabase.from('record_shares').delete().eq('id', id)
    if (error) throw error
  })

/** Records other people shared with me. */
export function useSharedWithMe() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['shared-with-me', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('record_shares')
        .select(
          'id, record_id, created_at, reading_records!inner(user_id, profiles!reading_records_user_id_fkey(display_name))',
        )
        .eq('shared_with_user_id', uid)
      if (error) throw error
      return data.map((s) => ({
        id: s.id,
        recordId: s.record_id,
        ownerName: s.reading_records.profiles?.display_name ?? '',
      }))
    },
  })
}

export const publicShareUrl = (token: string) => `${publicOrigin()}/s/${token}`

export function usePublicRecord(token: string) {
  return useQuery({
    queryKey: ['public-record', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_record', { p_token: token })
      if (error) throw error
      if (!data) return null
      const d = data as { display_name: string; reads: unknown }
      return { displayName: d.display_name, reads: toReadMap(d.reads) }
    },
  })
}

/** Owner name of a record I can read (shared with me or a co-member's). */
export function useRecordOwner(recordId: string) {
  return useQuery({
    queryKey: ['record-owner', recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_records')
        .select('user_id, profiles!reading_records_user_id_fkey(display_name)')
        .eq('id', recordId)
        .maybeSingle()
      if (error) throw error
      return data ? { userId: data.user_id, name: data.profiles?.display_name ?? '' } : null
    },
  })
}
