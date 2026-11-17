import { Capacitor } from '@capacitor/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { authRedirectUrl, deepLinkTarget, publicOrigin } from './platform'

const SITE = 'https://wordtovictory.app'

describe('deepLinkTarget', () => {
  it('reads the auth code and destination from the magic-link callback', () => {
    expect(deepLinkTarget('com.wordtovictory.app://auth/callback?next=%2Fjoin%2Fabc&code=xyz', SITE)).toEqual({
      path: '/join/abc',
      code: 'xyz',
      errorCode: undefined,
    })
  })

  it('reports callback errors, including ones in the fragment', () => {
    expect(deepLinkTarget('com.wordtovictory.app://auth/callback?next=%2F#error_code=otp_expired', SITE)).toEqual({
      path: '/',
      code: undefined,
      errorCode: 'otp_expired',
    })
  })

  it('does not follow an off-site destination', () => {
    expect(deepLinkTarget('com.wordtovictory.app://auth/callback?next=%2F%2Fevil.com', SITE)?.path).toBe('/')
    expect(deepLinkTarget('com.wordtovictory.app://auth/callback?next=https%3A%2F%2Fevil.com', SITE)?.path).toBe('/')
  })

  it('maps Universal/App Links on the public site to in-app paths', () => {
    expect(deepLinkTarget(`${SITE}/join/abc123?x=1`, SITE)).toEqual({ path: '/join/abc123?x=1' })
    expect(deepLinkTarget(`${SITE}/s/tok`, `${SITE}/`)).toEqual({ path: '/s/tok' })
  })

  it('ignores links that are not ours', () => {
    expect(deepLinkTarget('https://example.com/join/abc', SITE)).toBeNull()
    expect(deepLinkTarget(`${SITE}/join/abc`, undefined)).toBeNull()
    expect(deepLinkTarget('com.wordtovictory.app://other', SITE)).toBeNull()
    expect(deepLinkTarget('not a url', SITE)).toBeNull()
  })
})

describe('link origins', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('uses the current origin on the web', () => {
    expect(publicOrigin()).toBe(window.location.origin)
    expect(authRedirectUrl('/join/abc')).toBe(`${window.location.origin}/join/abc`)
  })

  it('uses the public site and the app scheme in the native app', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true)
    vi.stubEnv('VITE_PUBLIC_SITE_URL', `${SITE}/`)
    expect(publicOrigin()).toBe(SITE)
    expect(authRedirectUrl('/join/abc')).toBe('com.wordtovictory.app://auth/callback?next=%2Fjoin%2Fabc')
  })
})
