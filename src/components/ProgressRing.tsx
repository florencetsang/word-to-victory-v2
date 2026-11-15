import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ProgressRing({
  percent,
  size = 180,
  stroke = 14,
  label,
  sublabel,
  className,
}: {
  percent: number
  size?: number
  stroke?: number
  label?: ReactNode
  sublabel?: ReactNode
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, percent))
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          className={cn('transition-[stroke-dashoffset] duration-700', p >= 100 ? 'stroke-accent' : 'stroke-primary')}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="font-serif text-3xl font-semibold tabular-nums">{label ?? `${p.toFixed(1)}%`}</div>
        {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  )
}
