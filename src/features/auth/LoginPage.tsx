import { useNavigate, useSearch } from '@tanstack/react-router'
import { KeyRound, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, Input, Label } from '@/components/ui/primitives'
import { LanguageSwitcher } from '@/features/settings/LanguageSwitcher'
import { authRedirectUrl, isNative, nativePlatform } from '@/lib/platform'
import { enabledOAuthProviders, supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'
import { useAuth } from './auth'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z" />
    <path
      fill="#34A853"
      d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"
    />
    <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 9.9z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
  </svg>
)

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="fill-current">
    <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8s2 .8 3.4.8 2.2-1.3 3-2.5c1-1.4 1.4-2.8 1.4-2.8s-2.5-1-2.5-4.2zM13.9 4.9c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
  </svg>
)

/** Removes auth callback params so they aren't replayed after sign-in. */
function cleanRedirect(raw: string | undefined) {
  if (!raw || !/^\/(?![/\\])/.test(raw)) return '/'
  const url = new URL(raw, window.location.origin)
  for (const k of ['code', 'error', 'error_code', 'error_description']) url.searchParams.delete(k)
  return url.pathname + url.search
}

/** Turns a failed magic-link callback into a user-facing message key. */
function callbackErrorKey(err: { name?: string; message?: string; code?: string } | null): string | null {
  if (!err) return null
  const text = `${err.name ?? ''} ${err.code ?? ''} ${err.message ?? ''}`.toLowerCase()
  if (text.includes('verifier')) return 'login.errorOtherBrowser'
  if (text.includes('expired') || text.includes('invalid')) return 'login.errorExpired'
  return 'login.errorGeneric'
}

export function LoginPage() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string }
  const redirect = cleanRedirect(search.redirect)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) void navigate({ to: redirect, replace: true })
  }, [session, navigate, redirect])

  // Surface failures from a magic-link callback instead of silently showing the form again.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search)
    const nested = search.redirect ? new URL(search.redirect, window.location.origin).searchParams : null
    const urlError = params.get('error_code') ?? nested?.get('error_code')
    if (urlError) return setError(t(callbackErrorKey({ code: urlError })!))
    const hadCode = Boolean(params.get('code') || nested?.get('code'))
    void supabase.auth.initialize().then(({ error }) => {
      // supabase-js ignores a callback code when this browser has no PKCE verifier, i.e. the link
      // was opened in a different browser or an email app's built-in viewer.
      const key = callbackErrorKey(error) ?? (hadCode ? 'login.errorOtherBrowser' : null)
      if (key) setError(t(key))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const redirectTo = authRedirectUrl(redirect)
  // Sign in with Apple has no native sheet on Android; those users can use Google or email.
  const providers = enabledOAuthProviders.filter(
    (p: 'google' | 'apple') => !(p === 'apple' && nativePlatform() === 'android'),
  )

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    setBusy(false)
    if (error) setError(errorMessage(error))
    else setSent(true)
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setError(t('login.errorCode'))
  }

  const oauth = async (provider: 'google' | 'apple') => {
    setError(null)
    if (isNative()) {
      // The stores reject web sign-in inside the app, so use the system Google/Apple sheet.
      const { nativeSignIn, isCancelled } = await import('./nativeAuth')
      try {
        await nativeSignIn(provider)
      } catch (err) {
        if (!isCancelled(err)) setError(errorMessage(err))
      }
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
    if (error) setError(errorMessage(error))
  }

  return (
    <div className="relative grid min-h-dvh pt-[env(safe-area-inset-top)] lg:grid-cols-2">
      <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))]">
        <LanguageSwitcher />
      </div>
      <aside className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Logo className="[&_rect]:fill-primary-foreground [&_path:not(:last-child)]:fill-primary" />
        <blockquote className="max-w-md space-y-3">
          <p className="font-serif text-3xl leading-snug">{t('login.verse')}</p>
          <footer className="text-primary-foreground/70">{t('login.verseRef')}</footer>
        </blockquote>
        <p className="text-sm text-primary-foreground/70">{t('login.tagline')}</p>
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <Logo className="lg:hidden" />
            <h1 className="text-3xl font-semibold">{t('login.title')}</h1>
            <p className="text-muted-foreground">{t('login.subtitle')}</p>
          </div>
          <Card>
            <CardContent className="space-y-4 pt-5">
              {sent ? (
                <div role="status" className="space-y-4 text-center">
                  <Mail className="mx-auto size-10 text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium">{t('login.checkEmail')}</p>
                    <p className="text-sm text-muted-foreground">{t('login.sentTo', { email })}</p>
                  </div>
                  <form onSubmit={verifyCode} className="space-y-2 text-left">
                    <Label htmlFor="otp">{t('login.codeLabel')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="otp"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6,10}"
                        maxLength={10}
                        placeholder="123456"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        className="font-mono tracking-widest"
                      />
                      <Button type="submit" disabled={busy || code.length < 6}>
                        <KeyRound /> {t('login.verify')}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('login.codeHint')}</p>
                  </form>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSent(false)
                      setCode('')
                      setError(null)
                    }}
                  >
                    {t('login.useDifferentEmail')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={sendLink} className="space-y-3">
                  <Label htmlFor="email">{t('login.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" className="w-full" disabled={busy}>
                    <Mail /> {t('login.sendLink')}
                  </Button>
                </form>
              )}
              {providers.length > 0 && !sent && (
                <>
                  <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    {t('login.or')}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  {providers.includes('google') && (
                    <Button variant="outline" className="w-full" onClick={() => oauth('google')}>
                      <GoogleIcon /> {t('login.google')}
                    </Button>
                  )}
                  {providers.includes('apple') && (
                    <Button variant="outline" className="w-full" onClick={() => oauth('apple')}>
                      <AppleIcon /> {t('login.apple')}
                    </Button>
                  )}
                </>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
