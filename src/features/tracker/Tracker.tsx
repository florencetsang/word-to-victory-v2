import { BookOpen, Check, ChevronDown, ExternalLink, MoreHorizontal, Search, Square } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Segmented,
} from '@/components/ui/menus'
import { Card, Input, ProgressBar } from '@/components/ui/primitives'
import { BOOKS, bookName, chapterKey, type Book, type ChapterRef, type Testament } from '@/domain/bible'
import { bibleComLink } from '@/domain/bible-versions'
import type { ReadMap } from '@/domain/progress'
import { cn } from '@/lib/utils'

export interface TrackerProps {
  reads: ReadMap
  /** Omit for a read-only view. */
  onSetChapters?: (chapters: ChapterRef[], read: boolean) => void
  versionId?: number | null
  /** user id → display name; when given, chips show who read each chapter. */
  attribution?: ReadonlyMap<string, string>
  /** Chapter keys to emphasize (e.g. today's plan). */
  highlight?: ReadonlySet<string>
}

type Filter = 'all' | Testament
type TapMode = 'mark' | 'open'

export function Tracker({ reads, onSetChapters, versionId, attribution, highlight }: TrackerProps) {
  const { t, i18n } = useTranslation()
  const readOnly = !onSetChapters
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [tapMode, setTapMode] = useState<TapMode>(readOnly ? 'open' : 'mark')
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())

  const books = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BOOKS.filter(
      (b) =>
        (filter === 'all' || b.testament === filter) &&
        (!q || b.name.en.toLowerCase().includes(q) || b.name['zh-Hant'].includes(q) || b.code.toLowerCase() === q),
    )
  }, [filter, query])

  const allCollapsed = books.every((b) => collapsed.has(b.code))

  return (
    <div className="space-y-4">
      <div className="z-20 sm:sticky -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur sm:top-[calc(4rem+env(safe-area-inset-top))]">
        <Segmented<Filter>
          label={t('tracker.filter')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('tracker.all') },
            { value: 'OT', label: t('tracker.ot') },
            { value: 'NT', label: t('tracker.nt') },
          ]}
        />
        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={t('tracker.search')}
            placeholder={t('tracker.search')}
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {!readOnly && (
          <Segmented<TapMode>
            label={t('tracker.tapMode')}
            value={tapMode}
            onChange={setTapMode}
            options={[
              {
                value: 'mark',
                label: (
                  <>
                    <Check /> {t('tracker.modeMark')}
                  </>
                ),
              },
              {
                value: 'open',
                label: (
                  <>
                    <BookOpen /> {t('tracker.modeOpen')}
                  </>
                ),
              },
            ]}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(books.map((b) => b.code)))}
        >
          {allCollapsed ? t('tracker.expandAll') : t('tracker.collapseAll')}
        </Button>
      </div>

      {books.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{t('tracker.noBooks')}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {books.map((b) => (
            <BookCard
              key={b.code}
              book={b}
              lang={i18n.language}
              mask={readMask(reads, b)}
              highlightMask={highlight ? readMask(highlight, b) : ''}
              reads={reads}
              collapsed={collapsed.has(b.code)}
              onToggleCollapsed={() =>
                setCollapsed((s) => {
                  const n = new Set(s)
                  if (n.has(b.code)) n.delete(b.code)
                  else n.add(b.code)
                  return n
                })
              }
              tapMode={readOnly ? 'open' : tapMode}
              onSetChapters={onSetChapters}
              versionId={versionId}
              attribution={attribution}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const readMask = (set: { has(k: string): boolean }, b: Book) => {
  let s = ''
  for (let c = 1; c <= b.chapters; c++) s += set.has(chapterKey(b.code, c)) ? '1' : '0'
  return s
}

interface BookCardProps {
  book: Book
  lang: string
  /** '1'/'0' per chapter — used for cheap memoization. */
  mask: string
  highlightMask: string
  reads: ReadMap
  collapsed: boolean
  onToggleCollapsed: () => void
  tapMode: TapMode
  onSetChapters?: TrackerProps['onSetChapters']
  versionId?: number | null
  attribution?: ReadonlyMap<string, string>
}

const BookCard = memo(
  function BookCard({
    book,
    lang,
    mask,
    highlightMask,
    reads,
    collapsed,
    onToggleCollapsed,
    tapMode,
    onSetChapters,
    versionId,
    attribution,
  }: BookCardProps) {
    const { t } = useTranslation()
    const [confirm, setConfirm] = useState<'read' | 'unread' | null>(null)
    const read = [...mask].filter((c) => c === '1').length
    const complete = read === book.chapters
    const name = bookName(book.code, lang)
    const chapters: ChapterRef[] = Array.from({ length: book.chapters }, (_, i) => ({
      code: book.code,
      chapter: i + 1,
    }))
    const nextUnread = mask.indexOf('0') + 1 || 1
    const panelId = `book-${book.code}`

    return (
      <Card className={cn('overflow-hidden', complete && 'border-accent/60')}>
        <div className="flex items-center gap-2 p-3 pl-4">
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
            aria-expanded={!collapsed}
            aria-controls={panelId}
            onClick={onToggleCollapsed}
          >
            <ChevronDown className={cn('size-4 shrink-0 transition-transform', collapsed && '-rotate-90')} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-serif text-base font-semibold">{name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {read}/{book.chapters}
                </span>
              </div>
              <ProgressBar
                value={(read / book.chapters) * 100}
                tone={complete ? 'accent' : 'primary'}
                className="mt-1.5 h-1.5"
              />
            </div>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('tracker.bookActions', { book: name })}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <a href={bibleComLink(book.code, nextUnread, versionId)} target="_blank" rel="noreferrer">
                  <ExternalLink /> {t('tracker.openNext', { chapter: nextUnread })}
                </a>
              </DropdownMenuItem>
              {onSetChapters && (
                <>
                  <DropdownMenuItem onSelect={() => setConfirm('read')} disabled={complete}>
                    <Check /> {t('tracker.markBookRead')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setConfirm('unread')} disabled={read === 0} destructive>
                    <Square /> {t('tracker.markBookUnread')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {onSetChapters && (
            <ConfirmDialog
              open={confirm !== null}
              onOpenChange={(o) => !o && setConfirm(null)}
              title={t(confirm === 'unread' ? 'tracker.markBookUnreadConfirm' : 'tracker.markBookReadConfirm', {
                book: name,
              })}
              confirmLabel={t(confirm === 'unread' ? 'tracker.markBookUnread' : 'tracker.markBookRead')}
              destructive={confirm === 'unread'}
              onConfirm={() => onSetChapters(chapters, confirm === 'read')}
            />
          )}
        </div>
        {!collapsed && (
          <div
            id={panelId}
            className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5 border-t bg-background/40 p-3"
          >
            {chapters.map(({ chapter }) => {
              const isRead = mask[chapter - 1] === '1'
              const entry = isRead ? reads.get(chapterKey(book.code, chapter)) : undefined
              const who = entry?.readBy && attribution?.get(entry.readBy)
              const label = [
                `${name} ${chapter}`,
                isRead ? t('tracker.read') : t('tracker.unread'),
                who ? t('tracker.readBy', { name: who, date: new Date(entry!.readAt).toLocaleDateString(lang) }) : '',
              ]
                .filter(Boolean)
                .join(' · ')
              const cls = cn(
                'grid h-9 place-items-center rounded-md border text-sm tabular-nums transition-colors cursor-pointer select-none',
                isRead
                  ? complete
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:border-primary/60 hover:bg-primary/5',
                highlightMask[chapter - 1] === '1' && 'ring-2 ring-accent ring-offset-1 ring-offset-background',
              )
              return tapMode === 'open' ? (
                <a
                  key={chapter}
                  className={cls}
                  href={bibleComLink(book.code, chapter, versionId)}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  aria-label={label}
                >
                  {chapter}
                </a>
              ) : (
                <button
                  key={chapter}
                  type="button"
                  className={cls}
                  aria-pressed={isRead}
                  title={label}
                  aria-label={label}
                  onClick={() => onSetChapters?.([{ code: book.code, chapter }], !isRead)}
                >
                  {chapter}
                </button>
              )
            })}
          </div>
        )}
      </Card>
    )
  },
  (a, b) =>
    a.mask === b.mask &&
    a.highlightMask === b.highlightMask &&
    a.collapsed === b.collapsed &&
    a.tapMode === b.tapMode &&
    a.lang === b.lang &&
    a.versionId === b.versionId &&
    a.onSetChapters === b.onSetChapters &&
    a.attribution === b.attribution &&
    // attribution tooltips depend on the read entries themselves
    (!a.attribution || a.reads === b.reads),
)
