import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Eye, Plus, UserPlus, Users, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Badge, Card, Input, Label, Skeleton } from '@/components/ui/primitives'
import { useSharedWithMe } from '@/features/sharing/api'
import type { GroupMode } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useCreateGroup, useGroups } from './api'

export function ModeBadge({ mode }: { mode: GroupMode }) {
  const { t } = useTranslation()
  return <Badge variant={mode === 'shared' ? 'accent' : 'default'}>{t(`groups.mode.${mode}`)}</Badge>
}

function CreateGroupDialog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [mode, setMode] = useState<GroupMode>('shared')
  const create = useCreateGroup((id) => void navigate({ to: '/groups/$groupId', params: { groupId: id } }))
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t('groups.create')}
        </Button>
      </DialogTrigger>
      <DialogContent title={t('groups.create')} description={t('groups.createDescription')}>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate({ name: name.trim(), mode })
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="group-name">{t('groups.name')}</Label>
            <Input id="group-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{t('groups.modeLabel')}</legend>
            {(['shared', 'individual'] as const).map((m) => (
              <label
                key={m}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-md border p-3',
                  mode === m && 'border-primary bg-primary/5',
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  className="mt-1 accent-[var(--primary)]"
                />
                <span>
                  <span className="block font-medium">{t(`groups.mode.${m}`)}</span>
                  <span className="block text-sm text-muted-foreground">{t(`groups.modeHint.${m}`)}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <p className="text-xs text-muted-foreground">{t('groups.modePermanent')}</p>
          <Button type="submit" className="w-full" disabled={!name.trim() || create.isPending}>
            {t('groups.create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function JoinByCodeDialog() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus /> {t('groups.joinWithCode')}
        </Button>
      </DialogTrigger>
      <DialogContent title={t('groups.joinWithCode')}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void navigate({ to: '/join/$code', params: { code: code.trim().toUpperCase() } })
          }}
        >
          <Input
            aria-label={t('groups.inviteCode')}
            placeholder="ABCD1234"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono uppercase"
          />
          <Button type="submit">{t('groups.continue')}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GroupsPage() {
  const { t } = useTranslation()
  const groups = useGroups()
  const shared = useSharedWithMe()

  return (
    <>
      <PageHeader
        title={t('nav.groups')}
        description={t('groups.description')}
        actions={
          <>
            <JoinByCodeDialog />
            <CreateGroupDialog />
          </>
        }
      />
      <div className="space-y-8">
        <section className="space-y-3">
          {groups.isLoading ? (
            <Skeleton className="h-24" />
          ) : groups.data?.length === 0 ? (
            <EmptyState icon={<UsersRound />} title={t('groups.empty')}>
              <p className="max-w-sm text-sm text-muted-foreground">{t('groups.emptyHint')}</p>
            </EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.data?.map((g) => (
                <Link key={g.id} to="/groups/$groupId" params={{ groupId: g.id }}>
                  <Card className="flex items-center gap-4 p-4 transition-colors hover:border-primary">
                    <div className="grid size-12 place-items-center rounded-full bg-primary/10 font-serif text-lg text-primary">
                      {g.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-serif text-lg font-semibold">{g.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <ModeBadge mode={g.mode} />
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" /> {g.memberCount}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {shared.data && shared.data.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">{t('share.sharedWithMe')}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shared.data.map((s) => (
                <Link key={s.id} to="/records/$recordId" params={{ recordId: s.recordId }}>
                  <Card className="flex items-center gap-3 p-4 transition-colors hover:border-primary">
                    <Eye className="size-5 text-muted-foreground" />
                    <span className="flex-1 truncate font-medium">{t('share.recordOf', { name: s.ownerName })}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
