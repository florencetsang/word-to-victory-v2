import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useProfile } from '@/features/auth/auth'
import { isNative } from '@/lib/platform'

export type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'w2v.theme'

export const getStoredTheme = (): Theme => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'

export function applyTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#12132a' : '#faf6ee')
  // Style.Dark means light status-bar text, for a dark background.
  if (isNative()) void StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
}

/** Keeps theme + language in sync with the signed-in user's profile and the OS colour scheme. */
export function usePreferencesSync() {
  const { data: profile } = useProfile()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!profile) return
    applyTheme(profile.theme as Theme)
    if (i18n.language !== profile.locale) void i18n.changeLanguage(profile.locale)
  }, [profile, i18n])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => getStoredTheme() === 'system' && applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
}
