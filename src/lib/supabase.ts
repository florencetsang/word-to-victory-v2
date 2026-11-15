import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local.')
}

export const supabase = createClient<Database>(url, key, {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
})

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type GroupMode = Database['public']['Enums']['group_mode']

export const enabledOAuthProviders = (import.meta.env.VITE_AUTH_PROVIDERS ?? '')
  .split(',')
  .map((s: string) => s.trim())
  .filter((p: string): p is 'google' | 'apple' => p === 'google' || p === 'apple')
