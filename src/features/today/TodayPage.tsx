import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Flame, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/common'
import { ProgressRing } from '@/components/ProgressRing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, Skeleton } from '@/components/ui/primitives'
import { allChapters, bookName, chapterKey, type ChapterRef } from '@/domain/bible'
import { bibleComLink } from '@/domain/bible-versions'
import { today as getToday } from '@/domain/dates'
import { summarize, type ReadMap } from '@/domain/progress'
import { computeStreaks } from '@/domain/streaks'
import { usePersonalRecordId, useProfile } from '@/features/auth/auth'
import { useDeletePlan, usePlans } from '@/features/plans/api'
import { CreatePlanDialog } from '@/features/plans/CreatePlanDialog'
import { PlanCard } from '@/features/plans/PlanCard'
import { LegacyImportBanner } from '@/features/settings/LegacyImportBanner'
import { useRecord } from '@/features/tracker/useRecord'

/** The chapter after the most recently read one, or the first unread chapter. */
export function nextChapter(reads: ReadMap): ChapterRef | null {
  const all = allChapters()
  let latest: { at: string; idx: number } | null = null
  all.forEach((c, idx) => {
    const e = reads.get(chapterKey(c.code, c.chapter))
    if (e && (!latest || e.readAt > latest.at)) latest = { at: e.readAt, idx }
  })
  const from = latest ? (latest as { idx: number }).idx + 1 : 0
  for (let i = 0; i < all.length; i++) {
    const c = all[(from + i) % all.length]
    if (!reads.has(chapterKey(c.code, c.chapter))) return c
  }
  return null
}

export function TodayPage() {
  const { t, i18n } = useTranslation()
  const { data: profile } = useProfile()
  const { data: recordId } = usePersonalRecordId()
  const { reads, activity, setChapters, versionId } = useRecord(recordId)
  const { data: plans } = usePlans(recordId)
  const deletePlan = useDeletePlan(recordId ?? '')

  if (!reads.data || !recordId) return <Skeleton className="h-96" />

  const s = summarize(reads.data)
  const streak = activity.data ? computeStreaks(activity.data.keys(), getToday()).current : 0
  const next = nextChapter(reads.data)
  const hour = new Date().getHours()
  const greeting = t(hour < 12 ? 'today.morning' : hour < 18 ? 'today.afternoon' : 'today.evening')

  return (
    <div className="space-y-6">
      <LegacyImportBanner recordId={recordId} />
      <section className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary-foreground/5" />
          <CardContent className="relative space-y-4 p-6 sm:p-8">
            <p className="text-primary-foreground/70">
              {new Date().toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              {greeting}
              {profile?.display_name ? `, ${profile.display_name}` : ''}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-sm">
                <Flame className="size-4 text-accent" /> {t('today.streak', { count: streak })}
              </span>
              <span className="text-sm text-primary-foreground/80">
                {t('stats.chaptersRead', { read: s.overall.read, total: s.overall.total })}
              </span>
            </div>
            {next && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="accent" asChild>
                  <a href={bibleComLink(next.code, next.chapter, versionId)} target="_blank" rel="noreferrer">
                    <BookOpen /> {t('today.continue', { ref: `${bookName(next.code, i18n.language)} ${next.chapter}` })}
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => setChapters?.([next], true)}
                >
                  {t('today.markRead')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center p-6">
          <ProgressRing percent={s.overall.percent} size={160} sublabel={t('stats.ofBible')} />
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('plans.title')}</h2>
          {plans && plans.length > 0 && <CreatePlanDialog recordId={recordId} />}
        </div>
        {plans?.length === 0 ? (
          <EmptyState icon={<Target />} title={t('plans.empty')}>
            <p className="max-w-sm text-sm text-muted-foreground">{t('plans.emptyHint')}</p>
            <CreatePlanDialog recordId={recordId} />
          </EmptyState>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {plans?.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                reads={reads.data!}
                versionId={versionId}
                onSetChapters={setChapters}
                onDelete={() => deletePlan.mutate(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      <Link to="/bible" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        {t('today.openTracker')} <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}
