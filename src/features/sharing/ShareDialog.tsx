import { Copy, Globe, Link2Off, Mail, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input, Label } from '@/components/ui/primitives'
import { publicShareUrl, useCreatePublicLink, useMyShares, useRevokeShare, useShareWithEmail } from './api'

export async function copyToClipboard(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(message)
  } catch {
    toast.error(text)
  }
}

export function ShareDialog({ trigger }: { trigger: React.ReactNode }) {
  const { t } = useTranslation()
  const { data: shares } = useMyShares()
  const createLink = useCreatePublicLink()
  const shareEmail = useShareWithEmail()
  const revoke = useRevokeShare()
  const [email, setEmail] = useState('')

  const publicShare = shares?.find((s) => s.public_token)
  const people = shares?.filter((s) => !s.public_token) ?? []

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={t('share.title')} description={t('share.description')}>
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-sans text-sm font-semibold">
              <Globe className="size-4" /> {t('share.publicLink')}
            </h3>
            {publicShare ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={publicShareUrl(publicShare.public_token!)}
                    aria-label={t('share.publicLink')}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t('share.copy')}
                    onClick={() => copyToClipboard(publicShareUrl(publicShare.public_token!), t('share.copied'))}
                  >
                    <Copy />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => revoke.mutate(publicShare.id)}
                >
                  <Link2Off /> {t('share.revokeLink')}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t('share.publicHint')}</p>
                <Button variant="outline" onClick={() => createLink.mutate()} disabled={createLink.isPending}>
                  <Globe /> {t('share.createLink')}
                </Button>
              </>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-sans text-sm font-semibold">
              <Mail className="size-4" /> {t('share.withPeople')}
            </h3>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                shareEmail.mutate(email, { onSuccess: () => setEmail('') })
              }}
            >
              <Label htmlFor="share-email" className="sr-only">
                {t('login.email')}
              </Label>
              <Input
                id="share-email"
                type="email"
                required
                placeholder={t('share.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" disabled={shareEmail.isPending}>
                {t('share.invite')}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">{t('share.peopleHint')}</p>
            {people.length > 0 && (
              <ul className="divide-y rounded-md border">
                {people.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="truncate">{s.shared_with_email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('share.stopSharing')}
                      onClick={() => revoke.mutate(s.id)}
                    >
                      <UserMinus />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
