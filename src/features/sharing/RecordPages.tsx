import { Link, useParams } from '@tanstack/react-router'
import { Eye, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState, Logo, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Badge, Skeleton } from '@/components/ui/primitives'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/menus'
import type { ReadMap } from '@/domain/progress'
import { useAuth } from '@/features/auth/auth'
import { LanguageSwitcher } from '@/features/settings/LanguageSwitcher'
import { StatsView } from '@/features/stats/StatsView'
import { Tracker } from '@/features/tracker/Tracker'
import { TrackerSkeleton } from '@/features/tracker/BiblePage'
import { useRecord } from '@/features/tracker/useRecord'
import { usePublicRecord, useRecordOwner } from './api'

function ReadOnlyRecord({
  reads,
  activity,
  versionId,
}: {
  reads: ReadMap
  activity?: ReadonlyMap<string, number>
  versionId?: number | null
}) {
  const { t } = useTranslation()
  return (
    <Tabs defaultValue="bible" className="space-y-4">
      <TabsList>
        <TabsTrigger value="bible">{t('nav.bible')}</TabsTrigger>
        <TabsTrigger value="stats">{t('nav.stats')}</TabsTrigger>
      </TabsList>
      <TabsContent value="bible">
        <Tracker reads={reads} versionId={versionId} />
      </TabsContent>
      <TabsContent value="stats">
        <StatsView reads={reads} activity={activity} />
      </TabsContent>
    </Tabs>
  )
}

/** `/records/$recordId` — someone else's record I'm allowed to view. */
export function RecordPage() {
  const { t } = useTranslation()
  const { recordId } = useParams({ strict: false }) as { recordId: string }
  const owner = useRecordOwner(recordId)
  const { reads, activity, versionId } = useRecord(recordId, { editable: false })

  if (owner.isLoading) return <Skeleton className="h-96" />
  if (!owner.data)
    return (
      <EmptyState icon={<Lock />} title={t('share.noAccess')}>
        <Button asChild variant="outline">
          <Link to="/">{t('common.home')}</Link>
        </Button>
      </EmptyState>
    )
  return (
    <>
      <PageHeader
        title={t('share.recordOf', { name: owner.data.name })}
        actions={
          <Badge variant="outline" className="gap-1">
            <Eye className="size-3" /> {t('share.readOnly')}
          </Badge>
        }
      />
      {reads.data ? (
        <ReadOnlyRecord reads={reads.data} activity={activity.data} versionId={versionId} />
      ) : (
        <TrackerSkeleton />
      )}
    </>
  )
}

/** `/s/$token` — public, no sign-in needed. */
export function PublicRecordPage() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const { token } = useParams({ strict: false }) as { token: string }
  const rec = usePublicRecord(token)
  return (
    <div className="min-h-dvh">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild size="sm">
              <Link to={session ? '/' : '/login'}>{session ? t('common.openApp') : t('share.startYourOwn')}</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {rec.isLoading ? (
          <TrackerSkeleton />
        ) : !rec.data ? (
          <EmptyState icon={<Lock />} title={t('share.linkInvalid')} />
        ) : (
          <>
            <PageHeader
              title={t('share.recordOf', { name: rec.data.displayName })}
              actions={
                <Badge variant="outline" className="gap-1">
                  <Eye className="size-3" /> {t('share.readOnly')}
                </Badge>
              }
            />
            <ReadOnlyRecord reads={rec.data.reads} />
          </>
        )}
      </main>
    </div>
  )
}
