import { Link, Outlet } from '@tanstack/react-router'
import { BarChart3, BookOpen, Settings, Sun, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/common'
import { usePreferencesSync } from './theme'

const NAV = [
  { to: '/', key: 'today', icon: Sun },
  { to: '/bible', key: 'bible', icon: BookOpen },
  { to: '/stats', key: 'stats', icon: BarChart3 },
  { to: '/groups', key: 'groups', icon: Users },
  { to: '/settings', key: 'settings', icon: Settings },
] as const

export function AppLayout() {
  const { t } = useTranslation()
  usePreferencesSync()

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2"
      >
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16">
          <Link to="/" aria-label={t('nav.today')}>
            <Logo />
          </Link>
          <nav aria-label={t('nav.main')} className="hidden gap-1 sm:flex">
            {NAV.map(({ to, key, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === '/' }}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
              >
                <Icon className="size-4" /> {t(`nav.${key}`)}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {NAV.map(({ to, key, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === '/' }}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground data-[status=active]:text-primary"
          >
            <Icon className="size-5" />
            {t(`nav.${key}`)}
          </Link>
        ))}
      </nav>
    </div>
  )
}
