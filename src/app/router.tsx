import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Link,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/common'
import { Button } from '@/components/ui/button'
import { LoginPage } from '@/features/auth/LoginPage'
import { TodayPage } from '@/features/today/TodayPage'
import { supabase } from '@/lib/supabase'
import { AppLayout } from './AppLayout'

function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="p-8">
      <EmptyState title={t('common.notFound')}>
        <Button asChild variant="outline">
          <Link to="/">{t('common.home')}</Link>
        </Button>
      </EmptyState>
    </div>
  )
}

const rootRoute = createRootRoute({ component: Outlet, notFoundComponent: NotFound })

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s.redirect === 'string' ? { redirect: s.redirect } : {},
  component: LoginPage,
})

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/s/$token',
  component: lazyRouteComponent(() => import('@/features/sharing/RecordPages'), 'PublicRecordPage'),
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
})

const todayRoute = createRoute({ getParentRoute: () => appRoute, path: '/', component: TodayPage })
const bibleRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/bible',
  component: lazyRouteComponent(() => import('@/features/tracker/BiblePage'), 'BiblePage'),
})
const statsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/stats',
  component: lazyRouteComponent(() => import('@/features/stats/StatsPage'), 'StatsPage'),
})
const groupsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/groups',
  component: lazyRouteComponent(() => import('@/features/groups/GroupsPage'), 'GroupsPage'),
})
const groupRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/groups/$groupId',
  component: lazyRouteComponent(() => import('@/features/groups/GroupPage'), 'GroupPage'),
})
const joinRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/join/$code',
  component: lazyRouteComponent(() => import('@/features/groups/JoinPage'), 'JoinPage'),
})
const recordRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/records/$recordId',
  component: lazyRouteComponent(() => import('@/features/sharing/RecordPages'), 'RecordPage'),
})
const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/settings',
  component: lazyRouteComponent(() => import('@/features/settings/SettingsPage'), 'SettingsPage'),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  publicRoute,
  appRoute.addChildren([
    todayRoute,
    bibleRoute,
    statsRoute,
    groupsRoute,
    groupRoute,
    joinRoute,
    recordRoute,
    settingsRoute,
  ]),
])

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
