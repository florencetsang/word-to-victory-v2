import { Share2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/primitives'
import { chapterKey } from '@/domain/bible'
import { summarize } from '@/domain/progress'
import { usePersonalRecordId } from '@/features/auth/auth'
import { usePlans } from '@/features/plans/api'
import { usePlanStatusList } from '@/features/today/usePlanToday'
import { ShareDialog } from '@/features/sharing/ShareDialog'
import { Tracker } from './Tracker'
import { useRecord } from './useRecord'

export function TrackerSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-36" />
      ))}
    </div>
  )
}

export function BiblePage() {
  const { t } = useTranslation()
  const { data: recordId } = usePersonalRecordId()
  const { reads, setChapters, versionId } = useRecord(recordId)
  const { data: plans } = usePlans(recordId)
  const todays = usePlanStatusList(plans, reads.data)
  const highlight = useMemo(
    () => new Set(todays.flatMap((s) => s.today.map((r) => chapterKey(r.code, r.chapter)))),
    [todays],
  )
  const overall = reads.data ? summarize(reads.data).overall : null

  return (
    <>
      <PageHeader
        title={t('nav.bible')}
        description={overall ? t('stats.chaptersRead', { read: overall.read, total: overall.total }) : undefined}
        actions={
          <ShareDialog
            trigger={
              <Button variant="outline">
                <Share2 /> {t('share.share')}
              </Button>
            }
          />
        }
      />
      {reads.data ? (
        <Tracker reads={reads.data} onSetChapters={setChapters} versionId={versionId} highlight={highlight} />
      ) : (
        <TrackerSkeleton />
      )}
    </>
  )
}
