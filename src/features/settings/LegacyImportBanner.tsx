import { useQueryClient } from '@tanstack/react-query'
import { History, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/primitives'
import { clearLegacyProgress, readLegacyProgress } from '@/domain/legacy'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

const DISMISS_KEY = 'w2v.legacyImportDismissed'

/** Offers to import progress saved by the original Bible Track app in this browser's localStorage. */
export function LegacyImportBanner({ recordId }: { recordId: string }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [legacy, setLegacy] = useState(() =>
    localStorage.getItem(DISMISS_KEY) ? [] : readLegacyProgress(localStorage),
  )
  const [busy, setBusy] = useState(false)
  if (legacy.length === 0) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setLegacy([])
  }

  const importNow = async () => {
    setBusy(true)
    const { data, error } = await supabase.rpc('import_chapters', {
      p_record: recordId,
      p_chapters: legacy.map((c) => [c.code, c.chapter]),
    })
    setBusy(false)
    if (error) return toast.error(errorMessage(error))
    clearLegacyProgress(localStorage)
    setLegacy([])
    toast.success(t('import.done', { count: data }))
    void qc.invalidateQueries({ queryKey: ['reads', recordId] })
  }

  return (
    <Card
      className="flex flex-wrap items-center gap-4 border-accent/60 bg-accent/10 p-4"
      role="region"
      aria-label={t('import.title')}
    >
      <History className="size-6 text-accent" />
      <div className="min-w-48 flex-1">
        <p className="font-medium">{t('import.title')}</p>
        <p className="text-sm text-muted-foreground">{t('import.description', { count: legacy.length })}</p>
      </div>
      <Button variant="accent" onClick={importNow} disabled={busy}>
        {t('import.action')}
      </Button>
      <Button variant="ghost" size="icon" onClick={dismiss} aria-label={t('import.dismiss')}>
        <X />
      </Button>
    </Card>
  )
}
