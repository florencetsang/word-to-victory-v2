import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Segmented } from '@/components/ui/menus'
import { Input, Label } from '@/components/ui/primitives'
import { allChapters, BOOKS, bookName } from '@/domain/bible'
import { today } from '@/domain/dates'
import { BUILT_IN_PLANS } from '@/domain/plans'
import { cn } from '@/lib/utils'
import { useCreatePlan } from './api'

export function CreatePlanDialog({ recordId, trigger }: { recordId: string; trigger?: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('zh') ? 'zh-Hant' : 'en'
  const create = useCreatePlan(recordId)
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<'template' | 'custom'>('template')
  const [templateKey, setTemplateKey] = useState(BUILT_IN_PLANS[0].key)
  const [name, setName] = useState('')
  const [books, setBooks] = useState<string[]>([])
  const [days, setDays] = useState(30)
  const [start, setStart] = useState(today())

  const chapterCount = allChapters(books).length
  const valid = kind === 'template' || (name.trim() && books.length > 0 && days >= 1 && days <= 3650)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const tpl = BUILT_IN_PLANS.find((p) => p.key === templateKey)!
    await create.mutateAsync(
      kind === 'template'
        ? { name: tpl.name.en, template_key: tpl.key, books: [...tpl.books], days: tpl.days, start_date: start }
        : { name: name.trim(), template_key: null, books, days: Math.min(days, chapterCount), start_date: start },
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> {t('plans.new')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent title={t('plans.new')} description={t('plans.newDescription')}>
        <form onSubmit={submit} className="space-y-5">
          <Segmented
            label={t('plans.kind')}
            value={kind}
            onChange={setKind}
            options={[
              { value: 'template', label: t('plans.builtIn') },
              { value: 'custom', label: t('plans.custom') },
            ]}
          />
          {kind === 'template' ? (
            <fieldset className="grid gap-2">
              <legend className="sr-only">{t('plans.builtIn')}</legend>
              {BUILT_IN_PLANS.map((p) => (
                <label
                  key={p.key}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-md border p-3',
                    templateKey === p.key && 'border-primary bg-primary/5',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="template"
                      value={p.key}
                      checked={templateKey === p.key}
                      onChange={() => setTemplateKey(p.key)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="font-medium">{p.name[lang]}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('plans.chaptersPerDay', { n: (allChapters(p.books).length / p.days).toFixed(1) })}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">{t('plans.name')}</Label>
                <Input id="plan-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('plans.books')}</Label>
                  <span className="text-xs text-muted-foreground">
                    {t('plans.selectedChapters', { count: chapterCount })}
                  </span>
                </div>
                <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-2">
                  {BOOKS.map((b) => {
                    const on = books.includes(b.code)
                    return (
                      <button
                        key={b.code}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setBooks(on ? books.filter((c) => c !== b.code) : [...books, b.code])}
                        className={cn(
                          'cursor-pointer rounded-full border px-2.5 py-1 text-xs',
                          on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary',
                        )}
                      >
                        {bookName(b.code, lang)}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-days">{t('plans.days')}</Label>
                <Input
                  id="plan-days"
                  type="number"
                  min={1}
                  max={3650}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="plan-start">{t('plans.startDate')}</Label>
            <Input id="plan-start" type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={!valid || create.isPending}>
            {t('plans.start')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
