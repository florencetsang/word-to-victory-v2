import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/menus'
import { LANGUAGES } from '@/lib/i18n'

export function LanguageSwitcher({ onChange }: { onChange?: (code: string) => void }) {
  const { t, i18n } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('settings.language')}>
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => {
              void i18n.changeLanguage(l.code)
              onChange?.(l.code)
            }}
            aria-current={i18n.language === l.code}
            className={i18n.language === l.code ? 'font-semibold' : undefined}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
