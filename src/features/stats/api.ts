import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const tz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

/** Map of local day (`YYYY-MM-DD`) → distinct chapters read that day. */
export function useActivity(recordId: string | undefined) {
  return useQuery({
    queryKey: ['activity', recordId],
    enabled: !!recordId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('record_activity', { p_record: recordId!, p_tz: tz() })
      if (error) throw error
      return new Map(data.map((d) => [d.day, d.chapters]))
    },
  })
}

export function useFeed(recordId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['feed', recordId],
    enabled: !!recordId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('record_feed', { p_record: recordId!, p_limit: 30 })
      if (error) throw error
      return data
    },
  })
}
