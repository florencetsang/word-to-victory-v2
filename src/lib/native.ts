import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { router } from '@/app/router'
import { deepLinkTarget, isNative } from './platform'
import { supabase } from './supabase'

let lastUrl: string | null = null

async function openDeepLink(rawUrl: string) {
  // An auth code can only be exchanged once, so ignore a repeated delivery of the same URL.
  if (rawUrl === lastUrl) return
  lastUrl = rawUrl
  const target = deepLinkTarget(rawUrl, import.meta.env.VITE_PUBLIC_SITE_URL)
  if (!target) return
  let error = target.errorCode
  if (target.code) {
    const res = await supabase.auth.exchangeCodeForSession(target.code)
    if (res.error) error = res.error.code ?? res.error.message
  }
  if (error) {
    // LoginPage reads error_code from the nested redirect and shows a friendly message.
    const redirect = new URL(target.path, 'https://app.invalid')
    redirect.searchParams.set('error_code', error)
    await router.navigate({ to: '/login', search: { redirect: redirect.pathname + redirect.search }, replace: true })
    return
  }
  await router.navigate({ href: target.path })
}

/** Wires up native-only behaviour. Does nothing in the browser. */
export async function initNative() {
  if (!isNative()) return

  // Capacitor keeps the URL that launched the app until this listener is attached.
  void App.addListener('appUrlOpen', ({ url }) => void openDeepLink(url))
  // Android hardware back button: go back in the app, or close it from the first screen.
  void App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else void App.exitApp()
  })

  await SplashScreen.hide()
}
