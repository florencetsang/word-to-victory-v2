import { useNavigate, useSearch } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, Input, Label } from '@/components/ui/primitives'
import { LanguageSwitcher } from '@/features/settings/LanguageSwitcher'
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

export function LoginPage() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string }
  const redirect = search.redirect && /^\/(?![/\\])/.test(search.redirect) ? search.redirect : '/'
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) void navigate({ to: redirect, replace: true })
  }, [session, navigate, redirect])

  const redirectTo = `${window.location.origin}${redirect}`

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    setBusy(false)
    if (error) setError(errorMessage(error))
    else setSent(true)
  }

  const oauth = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
    if (error) setError(errorMessage(error))
  }

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <div className="absolute right-4 top-4">
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
                <div role="status" className="space-y-2 text-center">
                  <Mail className="mx-auto size-10 text-primary" />
                  <p className="font-medium">{t('login.checkEmail')}</p>
                  <p className="text-sm text-muted-foreground">{t('login.sentTo', { email })}</p>
                  <Button variant="link" onClick={() => setSent(false)}>
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
              {enabledOAuthProviders.length > 0 && !sent && (
                <>
                  <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    {t('login.or')}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  {enabledOAuthProviders.includes('google') && (
                    <Button variant="outline" className="w-full" onClick={() => oauth('google')}>
                      <GoogleIcon /> {t('login.google')}
                    </Button>
                  )}
                  {enabledOAuthProviders.includes('apple') && (
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
