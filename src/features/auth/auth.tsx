import type { Session } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, type Tables } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ session: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [state, setState] = useState<AuthState>({ session: null, loading: true })

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setState({ session: data.session, loading: false }))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, loading: false })
      if (event === 'SIGNED_OUT') qc.clear()
    })
    return () => data.subscription.unsubscribe()
  }, [qc])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export function useUserId(): string {
  const { session } = useAuth()
  if (!session) throw new Error('useUserId requires an authenticated session')
  return session.user.id
}

export type Profile = Tables<'profiles'>

export function useProfile() {
  const { session } = useAuth()
  const uid = session?.user.id
  return useQuery({
    queryKey: ['profile', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid!).single()
      if (error) throw error
      return data
    },
  })
}

/** The signed-in user's personal reading record id. */
export function usePersonalRecordId() {
  const { session } = useAuth()
  const uid = session?.user.id
  return useQuery({
    queryKey: ['personal-record', uid],
    enabled: !!uid,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('reading_records').select('id').eq('user_id', uid!).single()
      if (error) throw error
      return data.id
    },
  })
}
