import { Capacitor } from '@capacitor/core'

export const NATIVE_SCHEME = 'com.wordtovictory.app'

export const isNative = () => Capacitor.isNativePlatform()

export const nativePlatform = () => Capacitor.getPlatform() as 'ios' | 'android' | 'web'

/**
 * The origin for links shared with other people (invites, public records).
 * Inside the native app `window.location.origin` is `capacitor://localhost` (or
 * `https://localhost` on Android), so the public website URL is used there.
 */
export function publicOrigin(): string {
  if (!isNative()) return window.location.origin
  const site = import.meta.env.VITE_PUBLIC_SITE_URL
  if (!site) throw new Error('Missing VITE_PUBLIC_SITE_URL. The native app needs it for invite and share links.')
  return new URL(site).origin
}

/** Where a magic link should return to after sign-in. */
export function authRedirectUrl(path: string): string {
  if (!isNative()) return `${window.location.origin}${path}`
  return `${NATIVE_SCHEME}://auth/callback?next=${encodeURIComponent(path)}`
}

/**
 * Maps a URL that opened the app (deep link) to an in-app path, or null if it isn't ours.
 * Handles the magic-link callback scheme and Universal/App Links on the public site.
 */
export function deepLinkTarget(
  rawUrl: string,
  siteUrl: string | undefined,
): { path: string; code?: string; errorCode?: string } | null {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  if (url.protocol === `${NATIVE_SCHEME}:`) {
    if (url.host !== 'auth') return null
    const params = new URLSearchParams(url.hash.slice(1))
    url.searchParams.forEach((v, k) => params.set(k, v))
    const next = params.get('next') ?? '/'
    const path = /^\/(?![/\\])/.test(next) ? next : '/'
    return { path, code: params.get('code') ?? undefined, errorCode: params.get('error_code') ?? undefined }
  }
  if (!siteUrl || url.origin !== new URL(siteUrl).origin) return null
  return { path: url.pathname + url.search }
}
