import { SocialLogin } from '@capgo/capacitor-social-login'
import { supabase } from '@/lib/supabase'

let ready: Promise<void> | null = null

function initialize() {
  ready ??= SocialLogin.initialize({
    google: {
      webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
      iOSClientId: import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID,
      // Makes the ID token's audience the web client, which Supabase is configured with.
      iOSServerClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
      mode: 'online',
    },
    apple: {},
  })
  return ready
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Signs in with the system Google or Apple sheet and hands the ID token to Supabase.
 * The provider gets the hashed nonce and Supabase the raw one, which it hashes to compare.
 */
export async function nativeSignIn(provider: 'google' | 'apple') {
  await initialize()
  const nonce = crypto.randomUUID()
  const hashedNonce = await sha256Hex(nonce)
  const { result } =
    provider === 'google'
      ? await SocialLogin.login({ provider, options: { nonce: hashedNonce } })
      : await SocialLogin.login({ provider, options: { nonce: hashedNonce, scopes: ['email', 'name'] } })
  const token = 'idToken' in result ? result.idToken : null
  if (!token) throw new Error(`${provider} sign-in did not return an ID token`)
  const { error } = await supabase.auth.signInWithIdToken({ provider, token, nonce })
  if (error) throw error
}

/** True when the user closed the sign-in sheet; that isn't worth showing an error for. */
export const isCancelled = (err: unknown) => /cancel/i.test(err instanceof Error ? err.message : String(err))
