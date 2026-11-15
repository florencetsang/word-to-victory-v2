import { CalendarCheck, CheckCheck, ExternalLink, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Badge, Card, CardContent, CardHeader, CardTitle, ProgressBar } from '@/components/ui/primitives'
import { bookName, chapterKey, type ChapterRef } from '@/domain/bible'
import { bibleComLink } from '@/domain/bible-versions'
import { today as getToday } from '@/domain/dates'
import { buildSchedule, getTemplate, planStatus } from '@/domain/plans'
import type { ReadMap } from '@/domain/progress'
import type { PlanEnrollment } from './api'

/** Compresses consecutive chapters: GEN 1–3, EXO 1. */
export function formatRefs(refs: ChapterRef[], lang: string) {
  const parts: string[] = []
  let i = 0
  while (i < refs.length) {
    let j = i
    while (j + 1 < refs.length && refs[j + 1].code === refs[i].code && refs[j + 1].chapter === refs[j].chapter + 1) j++
    const name = bookName(refs[i].code, lang)
    parts.push(i === j ? `${name} ${refs[i].chapter}` : `${name} ${refs[i].chapter}–${refs[j].chapter}`)
    i = j + 1
  }
  return parts.join(', ')
}

export function usePlanStatus(plan: PlanEnrollment, reads: ReadMap) {
  const schedule = useMemo(() => buildSchedule(plan.books, plan.days), [plan.books, plan.days])
  return planStatus(schedule, plan.start_date, getToday(), (k) => reads.has(k))
}

export function planDisplayName(plan: PlanEnrollment, lang: string) {
  const tpl = plan.template_key ? getTemplate(plan.template_key) : undefined
  return tpl ? tpl.name[lang.startsWith('zh') ? 'zh-Hant' : 'en'] : plan.name
}

export function PlanCard({
  plan,
  reads,
  versionId,
  onSetChapters,
  onDelete,
}: {
  plan: PlanEnrollment
  reads: ReadMap
  versionId?: number | null
  onSetChapters?: (chapters: ChapterRef[], read: boolean) => void
  onDelete?: () => void
}) {
  const { t, i18n } = useTranslation()
  const st = usePlanStatus(plan, reads)
  const lang = i18n.language
  const started = st.dayIndex >= 0
  const ended = st.dayIndex >= st.totalDays

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{planDisplayName(plan, lang)}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {st.finished
              ? t('plans.finished')
              : !started
                ? t('plans.startsOn', { date: plan.start_date })
                : ended
                  ? t('plans.ended', { date: st.endDate })
                  : t('plans.dayOf', { day: st.dayIndex + 1, total: st.totalDays })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {st.behind.length > 0 ? (
            <Badge variant="accent">{t('plans.behind', { count: st.behind.length })}</Badge>
          ) : (
            started && !st.finished && <Badge>{t('plans.onTrack')}</Badge>
          )}
          {onDelete && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon" aria-label={t('plans.remove')}>
                  <Trash2 />
                </Button>
              }
              title={t('plans.removeConfirm')}
              description={t('plans.removeDescription')}
              confirmLabel={t('plans.remove')}
              destructive
              onConfirm={onDelete}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <ProgressBar value={(st.readInPlan / st.totalInPlan) * 100} tone={st.finished ? 'accent' : 'primary'} />
          <p className="text-xs tabular-nums text-muted-foreground">
            {t('stats.chaptersRead', { read: st.readInPlan, total: st.totalInPlan })}
          </p>
        </div>
        {st.today.length > 0 && (
          <div className="rounded-md bg-muted/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <CalendarCheck className="size-4 text-primary" /> {t('plans.todaysReading')}
            </div>
            <ul className="flex flex-wrap gap-2">
              {st.today.map((r) => {
                const done = reads.has(chapterKey(r.code, r.chapter))
                return (
                  <li key={chapterKey(r.code, r.chapter)}>
                    <a
                      href={bibleComLink(r.code, r.chapter, versionId)}
                      target="_blank"
                      rel="noreferrer"
                      className={
                        done
                          ? 'inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground'
                          : 'inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm hover:border-primary'
                      }
                    >
                      {bookName(r.code, lang)} {r.chapter}
                      <ExternalLink className="size-3 opacity-70" />
                    </a>
                  </li>
                )
              })}
            </ul>
            {onSetChapters && (
              <Button
                className="mt-3"
                size="sm"
                variant={st.todayDone ? 'secondary' : 'default'}
                disabled={st.todayDone}
                onClick={() => onSetChapters(st.today, true)}
              >
                <CheckCheck /> {st.todayDone ? t('plans.todayDone') : t('plans.markToday')}
              </Button>
            )}
          </div>
        )}
        {st.behind.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">{t('plans.catchUp')}</summary>
            <p className="mt-2">
              {formatRefs(st.behind.slice(0, 60), lang)}
              {st.behind.length > 60 ? ' …' : ''}
            </p>
            {onSetChapters && (
              <Button className="mt-2" size="sm" variant="outline" onClick={() => onSetChapters(st.behind, true)}>
                {t('plans.markCaughtUp')}
              </Button>
            )}
          </details>
        )}
      </CardContent>
    </Card>
  )
}
