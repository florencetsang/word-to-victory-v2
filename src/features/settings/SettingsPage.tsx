import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Monitor, Moon, RotateCcw, Share2, Sun, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Segmented } from '@/components/ui/menus'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  NativeSelect,
  Skeleton,
} from '@/components/ui/primitives'
import { applyTheme, type Theme } from '@/app/theme'
import { BIBLE_VERSIONS } from '@/domain/bible-versions'
import { useAuth, usePersonalRecordId, useProfile, type Profile } from '@/features/auth/auth'
import { ShareDialog } from '@/features/sharing/ShareDialog'
import { LANGUAGES } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

type ProfileUpdate = Partial<Pick<Profile, 'display_name' | 'locale' | 'bible_version_id' | 'theme'>>

function useUpdateProfile() {
  const qc = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: async (patch: ProfileUpdate) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', session!.user.id)
      if (error) throw error
    },
    onMutate: (patch) => {
      qc.setQueryData<Profile>(['profile', session?.user.id], (p) => (p ? { ...p, ...patch } : p))
    },
    onError: (e) => toast.error(errorMessage(e)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { session } = useAuth()
  const { data: profile } = useProfile()
  const { data: recordId } = usePersonalRecordId()
  const update = useUpdateProfile()

  if (!profile) return <Skeleton className="h-96" />

  const signOut = async () => {
    await supabase.auth.signOut()
    void navigate({ to: '/login' })
  }

  return (
    <>
      <PageHeader title={t('nav.settings')} description={session?.user.email} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DisplayNameForm
              key={profile.display_name}
              initial={profile.display_name}
              onSave={(display_name) =>
                update.mutate({ display_name }, { onSuccess: () => toast.success(t('common.saved')) })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.preferences')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.language')}</Label>
              <NativeSelect
                id="language"
                value={profile.locale}
                onChange={(e) => {
                  void i18n.changeLanguage(e.target.value)
                  update.mutate({ locale: e.target.value })
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">{t('settings.bibleVersion')}</Label>
              <NativeSelect
                id="version"
                value={profile.bible_version_id}
                onChange={(e) => update.mutate({ bible_version_id: Number(e.target.value) })}
              >
                {BIBLE_VERSIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">{t('settings.bibleVersionHint')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.theme')}</Label>
              <div>
                <Segmented<Theme>
                  label={t('settings.theme')}
                  value={profile.theme as Theme}
                  onChange={(v) => {
                    applyTheme(v)
                    update.mutate({ theme: v })
                  }}
                  options={[
                    {
                      value: 'system',
                      label: (
                        <>
                          <Monitor /> {t('settings.system')}
                        </>
                      ),
                    },
                    {
                      value: 'light',
                      label: (
                        <>
                          <Sun /> {t('settings.light')}
                        </>
                      ),
                    },
                    {
                      value: 'dark',
                      label: (
                        <>
                          <Moon /> {t('settings.dark')}
                        </>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('share.title')}</CardTitle>
            <CardDescription>{t('share.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ShareDialog
              trigger={
                <Button variant="outline">
                  <Share2 /> {t('share.manage')}
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.account')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={signOut}>
              <LogOut /> {t('settings.signOut')}
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline">
                  <RotateCcw /> {t('settings.reset')}
                </Button>
              }
              title={t('settings.resetConfirm')}
              description={t('settings.resetDescription')}
              confirmLabel={t('settings.reset')}
              destructive
              onConfirm={async () => {
                const { error } = await supabase.rpc('reset_record', { p_record: recordId! })
                if (error) return void toast.error(errorMessage(error))
                await qc.invalidateQueries()
                toast.success(t('settings.resetDone'))
              }}
            />
            <ConfirmDialog
              trigger={
                <Button variant="destructive">
                  <Trash2 /> {t('settings.deleteAccount')}
                </Button>
              }
              title={t('settings.deleteConfirm')}
              description={t('settings.deleteDescription')}
              confirmLabel={t('settings.deleteAccount')}
              destructive
              onConfirm={async () => {
                const { error } = await supabase.rpc('delete_account')
                if (error) return void toast.error(errorMessage(error))
                await supabase.auth.signOut()
                void navigate({ to: '/login' })
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function DisplayNameForm({ initial, onSave }: { initial: string; onSave: (name: string) => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial)
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(name.trim())
      }}
    >
      <Label htmlFor="display-name">{t('settings.displayName')}</Label>
      <div className="flex gap-2">
        <Input id="display-name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={name.trim() === initial || !name.trim()}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
