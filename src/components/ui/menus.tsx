import { DropdownMenu as M, Tabs as T, ToggleGroup as TG } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

export const DropdownMenu = M.Root
export const DropdownMenuTrigger = M.Trigger

export function DropdownMenuContent({ className, ...props }: React.ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        sideOffset={6}
        align="end"
        className={cn('z-50 min-w-48 rounded-md border bg-card p-1 shadow-lg', className)}
        {...props}
      />
    </M.Portal>
  )
}

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof M.Item> & { destructive?: boolean }) {
  return (
    <M.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none data-[highlighted]:bg-muted [&_svg]:size-4',
        destructive && 'text-destructive',
        className,
      )}
      {...props}
    />
  )
}

export const DropdownMenuSeparator = () => <M.Separator className="my-1 h-px bg-border" />
export const DropdownMenuLabel = ({ className, ...p }: React.ComponentProps<typeof M.Label>) => (
  <M.Label className={cn('px-2 py-1.5 text-xs text-muted-foreground', className)} {...p} />
)

export const Tabs = T.Root
export const TabsContent = T.Content

export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return <T.List className={cn('inline-flex rounded-lg bg-muted p-1 gap-1', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors cursor-pointer',
        'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function Segmented<V extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: V
  onChange: (v: V) => void
  options: { value: V; label: React.ReactNode }[]
  label: string
}) {
  return (
    <TG.Root
      type="single"
      value={value}
      aria-label={label}
      onValueChange={(v) => v && onChange(v as V)}
      className="inline-flex rounded-lg bg-muted p-1 gap-1"
    >
      {options.map((o) => (
        <TG.Item
          key={o.value}
          value={o.value}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground cursor-pointer data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm [&_svg]:size-4"
        >
          {o.label}
        </TG.Item>
      ))}
    </TG.Root>
  )
}
