import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase, type Tables } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

export type PlanEnrollment = Tables<'plan_enrollments'>

export function usePlans(recordId: string | undefined) {
  return useQuery({
    queryKey: ['plans', recordId],
    enabled: !!recordId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_enrollments')
        .select('*')
        .eq('record_id', recordId!)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

export function useCreatePlan(recordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: {
      name: string
      template_key: string | null
      books: string[]
      days: number
      start_date: string
    }) => {
      const { error } = await supabase.from('plan_enrollments').insert({ ...p, record_id: recordId })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', recordId] }),
    onError: (e) => toast.error(errorMessage(e)),
  })
}

export function useDeletePlan(recordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plan_enrollments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', recordId] }),
    onError: (e) => toast.error(errorMessage(e)),
  })
}
