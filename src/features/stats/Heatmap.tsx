import { useTranslation } from 'react-i18next'
import { addDays, dayOfWeek, type Day } from '@/domain/dates'
import { cn } from '@/lib/utils'

const level = (n: number) => (n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4)
const LEVEL_CLASS = ['bg-muted', 'bg-primary/25', 'bg-primary/50', 'bg-primary/75', 'bg-primary']

/** GitHub-style calendar of chapters read per day for the last `weeks` weeks. */
export function Heatmap({
  activity,
  today,
  weeks = 26,
}: {
  activity: ReadonlyMap<string, number>
  today: Day
  weeks?: number
}) {
  const { t, i18n } = useTranslation()
  const start = addDays(today, -(weeks - 1) * 7 - dayOfWeek(today))
  const columns: Day[][] = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
  )
  const fmt = new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' })

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex gap-[3px]" role="img" aria-label={t('stats.heatmapLabel', { weeks })}>
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((d) => {
              const n = activity.get(d) ?? 0
              const future = d > today
              return (
                <div
                  key={d}
                  title={
                    future ? undefined : t('stats.heatmapCell', { count: n, date: fmt.format(new Date(`${d}T00:00`)) })
                  }
                  className={cn('size-3 rounded-[3px]', future ? 'bg-transparent' : LEVEL_CLASS[level(n)])}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
        {t('stats.less')}
        {LEVEL_CLASS.map((c) => (
          <span key={c} className={cn('size-3 rounded-[3px]', c)} />
        ))}
        {t('stats.more')}
      </div>
    </div>
  )
}
