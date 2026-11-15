import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUserId } from '@/features/auth/auth'
import { supabase, type GroupMode } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

export function useGroups() {
  const uid = useUserId()
  return useQuery({
    queryKey: ['groups', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, mode, owner_id, created_at, group_members(count)')
        .order('created_at')
      if (error) throw error
      return data.map((g) => ({ ...g, memberCount: g.group_members[0]?.count ?? 0 }))
    },
  })
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, mode, owner_id, invite_code, reading_records(id)')
        .eq('id', groupId)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const rec = data.reading_records as unknown as { id: string } | { id: string }[] | null
      return { ...data, recordId: (Array.isArray(rec) ? rec[0]?.id : rec?.id) ?? null }
    },
  })
}

export function useGroupProgress(groupId: string) {
  return useQuery({
    queryKey: ['group-progress', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('group_progress', { p_group: groupId })
      if (error) throw error
      return data
    },
  })
}

function useGroupMutation<T, R = unknown>(fn: (arg: T) => Promise<R>, onSuccess?: (r: R) => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ['groups'] })
      void qc.invalidateQueries({ queryKey: ['group'] })
      void qc.invalidateQueries({ queryKey: ['group-progress'] })
      onSuccess?.(r)
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
}

export const useCreateGroup = (onCreated: (id: string) => void) =>
  useGroupMutation(async ({ name, mode }: { name: string; mode: GroupMode }) => {
    const { data, error } = await supabase.rpc('create_group', { p_name: name, p_mode: mode })
    if (error) throw error
    return data
  }, onCreated)

export const useJoinGroup = (onJoined: (id: string) => void) =>
  useGroupMutation(async (code: string) => {
    const { data, error } = await supabase.rpc('join_group', { p_code: code })
    if (error) throw error
    return data
  }, onJoined)

export const useRegenerateInvite = () =>
  useGroupMutation(async (groupId: string) => {
    const { error } = await supabase.rpc('regenerate_invite', { p_group: groupId })
    if (error) throw error
  })

export const useRemoveMember = () =>
  useGroupMutation(async ({ groupId, userId }: { groupId: string; userId: string }) => {
    const { error } = await supabase.rpc('remove_member', { p_group: groupId, p_user: userId })
    if (error) throw error
  })

export const useLeaveGroup = (onLeft: () => void) => {
  const uid = useUserId()
  return useGroupMutation(async (groupId: string) => {
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', uid)
    if (error) throw error
  }, onLeft)
}

export const useDeleteGroup = (onDeleted: () => void) =>
  useGroupMutation(async (groupId: string) => {
    const { error } = await supabase.from('groups').delete().eq('id', groupId)
    if (error) throw error
  }, onDeleted)

export const useRenameGroup = () =>
  useGroupMutation(async ({ groupId, name }: { groupId: string; name: string }) => {
    const { error } = await supabase.from('groups').update({ name }).eq('id', groupId)
    if (error) throw error
  })

export function useGroupPreview(code: string) {
  return useQuery({
    queryKey: ['group-preview', code],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('group_preview', { p_code: code })
      if (error) throw error
      return data[0] ?? null
    },
  })
}

export const inviteUrl = (code: string) => `${window.location.origin}/join/${code}`
