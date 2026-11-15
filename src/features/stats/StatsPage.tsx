import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/common'
import { Skeleton } from '@/components/ui/primitives'
import { usePersonalRecordId } from '@/features/auth/auth'
import { useRecord } from '@/features/tracker/useRecord'
import { StatsView } from './StatsView'

export function StatsPage() {
  const { t } = useTranslation()
  const { data: recordId } = usePersonalRecordId()
  const { reads, activity } = useRecord(recordId)
  return (
    <>
      <PageHeader title={t('nav.stats')} />
      {reads.data ? <StatsView reads={reads.data} activity={activity.data} /> : <Skeleton className="h-96" />}
    </>
  )
}
