import { BookCheck, CalendarDays, Flame, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgressRing } from '@/components/ProgressRing'
import { Card, CardContent, CardHeader, CardTitle, ProgressBar, Skeleton } from '@/components/ui/primitives'
import { BOOKS, bookName } from '@/domain/bible'
import { addDays, today as getToday } from '@/domain/dates'
import { summarize, type ReadMap } from '@/domain/progress'
import { computeStreaks } from '@/domain/streaks'
import { Heatmap } from './Heatmap'

export function StatTile({ icon, label, value }: { icon: ReactNode; label: ReactNode; value: ReactNode }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary [&_svg]:size-5">
        {icon}
      </div>
      <div>
        <div className="font-serif text-2xl font-semibold tabular-nums leading-none">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  )
}

export function StatsView({ reads, activity }: { reads: ReadMap; activity?: ReadonlyMap<string, number> }) {
  const { t, i18n } = useTranslation()
  const s = summarize(reads)
  const today = getToday()
  const streaks = activity ? computeStreaks(activity.keys(), today) : null
  const sumSince = (days: number) => {
    if (!activity) return 0
    const from = addDays(today, -days + 1)
    let n = 0
    for (const [d, c] of activity) if (d >= from && d <= today) n += c
    return n
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card className="flex flex-col items-center justify-center gap-3 p-6">
          <ProgressRing percent={s.overall.percent} sublabel={t('stats.ofBible')} />
          <p className="text-sm text-muted-foreground">
            {t('stats.chaptersRead', { read: s.overall.read, total: s.overall.total })}
          </p>
        </Card>
        <div className="grid content-start gap-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatTile
              icon={<Flame />}
              label={t('stats.currentStreak')}
              value={streaks ? t('stats.days', { count: streaks.current }) : '–'}
            />
            <StatTile
              icon={<Trophy />}
              label={t('stats.longestStreak')}
              value={streaks ? t('stats.days', { count: streaks.longest }) : '–'}
            />
            <StatTile icon={<CalendarDays />} label={t('stats.last7')} value={sumSince(7)} />
            <StatTile icon={<BookCheck />} label={t('stats.booksCompleted')} value={`${s.booksCompleted}/66`} />
          </div>
          <Card>
            <CardContent className="space-y-4 pt-5">
              {(['OT', 'NT'] as const).map((tm) => (
                <div key={tm} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t(tm === 'OT' ? 'tracker.otFull' : 'tracker.ntFull')}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.testament[tm].read}/{s.testament[tm].total} · {s.testament[tm].percent.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar value={s.testament[tm].percent} className="h-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('stats.activity')}</CardTitle>
        </CardHeader>
        <CardContent>
          {activity ? <Heatmap activity={activity} today={today} /> : <Skeleton className="h-28" />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('stats.byBook')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {BOOKS.map((b) => {
            const p = s.books[b.code]
            return (
              <div key={b.code} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="truncate">{bookName(b.code, i18n.language)}</span>
                <ProgressBar value={p.percent} tone={p.percent === 100 ? 'accent' : 'primary'} />
                <span className="text-right tabular-nums text-muted-foreground">{Math.round(p.percent)}%</span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
