import { useMemo } from 'react'
import { today as getToday } from '@/domain/dates'
import { buildSchedule, planStatus, type PlanStatus } from '@/domain/plans'
import type { ReadMap } from '@/domain/progress'
import type { PlanEnrollment } from '@/features/plans/api'

/** Status of every active plan, for highlighting today's chapters. */
export function usePlanStatusList(plans: PlanEnrollment[] | undefined, reads: ReadMap | undefined): PlanStatus[] {
  return useMemo(() => {
    if (!plans || !reads) return []
    const today = getToday()
    return plans.map((p) => planStatus(buildSchedule(p.books, p.days), p.start_date, today, (k) => reads.has(k)))
  }, [plans, reads])
}
