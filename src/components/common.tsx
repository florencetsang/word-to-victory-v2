import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-serif text-lg font-semibold', className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path d="M8 9.5c3-1.2 5.6-1 8 .8v13c-2.4-1.8-5-2-8-.8z" className="fill-primary-foreground" />
        <path d="M24 9.5c-3-1.2-5.6-1-8 .8v13c2.4-1.8 5-2 8-.8z" className="fill-primary-foreground opacity-80" />
        <path d="M21 5.5l1.8 3.2-1.8 3.2-1.8-3.2z" className="fill-accent" />
      </svg>
      <span>Word to Victory</span>
    </span>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      {icon && <div className="text-muted-foreground [&_svg]:size-10">{icon}</div>}
      <p className="font-serif text-lg">{title}</p>
      {children}
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-live="polite">
      <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  )
}
