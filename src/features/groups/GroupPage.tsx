import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  Activity,
  ChevronRight,
  Copy,
  Crown,
  LogOut,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState, PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/menus'
import { Card, Input, Label, ProgressBar, Skeleton } from '@/components/ui/primitives'
import { bookName, TOTAL_CHAPTERS } from '@/domain/bible'
import { useUserId } from '@/features/auth/auth'
import { useDeletePlan, usePlans } from '@/features/plans/api'
import { CreatePlanDialog } from '@/features/plans/CreatePlanDialog'
import { PlanCard } from '@/features/plans/PlanCard'
import { copyToClipboard } from '@/features/sharing/ShareDialog'
import { useFeed } from '@/features/stats/api'
import { StatsView } from '@/features/stats/StatsView'
import { useRealtimeReads } from '@/features/tracker/api'
import { TrackerSkeleton } from '@/features/tracker/BiblePage'
import { Tracker } from '@/features/tracker/Tracker'
import { useRecord } from '@/features/tracker/useRecord'
import {
  inviteUrl,
  useDeleteGroup,
  useGroup,
  useGroupProgress,
  useLeaveGroup,
  useRegenerateInvite,
  useRemoveMember,
  useRenameGroup,
} from './api'
import { ModeBadge } from './GroupsPage'

type Group = NonNullable<ReturnType<typeof useGroup>['data']>
type Member = NonNullable<ReturnType<typeof useGroupProgress>['data']>[number]

function InviteDialog({ group, isOwner }: { group: Group; isOwner: boolean }) {
  const { t } = useTranslation()
  const regenerate = useRegenerateInvite()
  const url = inviteUrl(group.invite_code)
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> {t('groups.invite')}
        </Button>
      </DialogTrigger>
      <DialogContent title={t('groups.invite')} description={t('groups.inviteDescription')}>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <div className="text-xs uppercase text-muted-foreground">{t('groups.inviteCode')}</div>
            <div className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em]" data-testid="invite-code">
              {group.invite_code}
            </div>
          </div>
          <div className="flex gap-2">
            <Input readOnly value={url} aria-label={t('groups.inviteLink')} />
            <Button
              variant="outline"
              size="icon"
              aria-label={t('share.copy')}
              onClick={() => copyToClipboard(url, t('share.copied'))}
            >
              <Copy />
            </Button>
          </div>
          {isOwner && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  <RefreshCw /> {t('groups.regenerate')}
                </Button>
              }
              title={t('groups.regenerateConfirm')}
              description={t('groups.regenerateDescription')}
              confirmLabel={t('groups.regenerate')}
              onConfirm={() => regenerate.mutateAsync(group.id)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GroupMenu({ group, isOwner }: { group: Group; isOwner: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const goHome = () => void navigate({ to: '/groups' })
  const leave = useLeaveGroup(goHome)
  const del = useDeleteGroup(goHome)
  const rename = useRenameGroup()
  const [dialog, setDialog] = useState<'rename' | 'leave' | 'delete' | null>(null)
  const [name, setName] = useState(group.name)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t('groups.settings')}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {isOwner ? (
            <>
              <DropdownMenuItem onSelect={() => setDialog('rename')}>
                <Pencil /> {t('groups.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem destructive onSelect={() => setDialog('delete')}>
                <Trash2 /> {t('groups.delete')}
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem destructive onSelect={() => setDialog('leave')}>
              <LogOut /> {t('groups.leave')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={dialog === 'rename'} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent title={t('groups.rename')}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              rename.mutate({ groupId: group.id, name: name.trim() }, { onSuccess: () => setDialog(null) })
            }}
          >
            <Label htmlFor="rename">{t('groups.name')}</Label>
            <Input id="rename" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" disabled={!name.trim()}>
              {t('common.save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={dialog === 'leave' || dialog === 'delete'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={t(dialog === 'delete' ? 'groups.deleteConfirm' : 'groups.leaveConfirm', { name: group.name })}
        description={dialog === 'delete' ? t('groups.deleteDescription') : undefined}
        confirmLabel={t(dialog === 'delete' ? 'groups.delete' : 'groups.leave')}
        destructive
        onConfirm={() => (dialog === 'delete' ? del.mutateAsync(group.id) : leave.mutateAsync(group.id))}
      />
    </>
  )
}

const linkRow = 'flex min-w-0 flex-1 items-center gap-3 p-4 hover:bg-muted/50'

function MemberList({
  group,
  members,
  isOwner,
  mode,
}: {
  group: Group
  members: Member[]
  isOwner: boolean
  mode: 'shared' | 'individual'
}) {
  const { t } = useTranslation()
  const uid = useUserId()
  const remove = useRemoveMember()
  const sorted = mode === 'individual' ? [...members].sort((a, b) => b.chapters_read - a.chapters_read) : members
  return (
    <Card>
      <ul className="divide-y">
        {sorted.map((m) => {
          const pct = (m.chapters_read / TOTAL_CHAPTERS) * 100
          const content = (
            <>
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-serif text-primary">
                {(m.display_name || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{m.display_name || t('groups.anonymous')}</span>
                  {m.user_id === uid && <span className="text-xs text-muted-foreground">({t('groups.you')})</span>}
                  {m.role === 'owner' && <Crown className="size-3.5 text-accent" aria-label={t('groups.owner')} />}
                </div>
                {mode === 'individual' ? (
                  <div className="flex items-center gap-3">
                    <ProgressBar value={pct} className="flex-1" />
                    <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">
                      {m.chapters_read} · {pct.toFixed(1)}%
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('groups.markedCount', { count: m.chapters_read })}</p>
                )}
              </div>
            </>
          )
          return (
            <li key={m.user_id} className="flex items-center gap-2 pr-2">
              {mode === 'individual' && m.record_id ? (
                m.user_id === uid ? (
                  <Link to="/bible" className={linkRow}>
                    {content}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ) : (
                  <Link to="/records/$recordId" params={{ recordId: m.record_id }} className={linkRow}>
                    {content}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                )
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3 p-4">{content}</div>
              )}
              {isOwner && m.role !== 'owner' && (
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="icon" aria-label={t('groups.removeMember', { name: m.display_name })}>
                      <UserMinus />
                    </Button>
                  }
                  title={t('groups.removeMemberConfirm', { name: m.display_name, group: group.name })}
                  confirmLabel={t('groups.remove')}
                  destructive
                  onConfirm={() => remove.mutateAsync({ groupId: group.id, userId: m.user_id })}
                />
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function ActivityFeed({ recordId }: { recordId: string }) {
  const { t, i18n } = useTranslation()
  const feed = useFeed(recordId)
  const fmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })
  if (!feed.data) return <Skeleton className="h-40" />
  if (feed.data.length === 0) return <EmptyState icon={<Activity />} title={t('groups.noActivity')} />
  return (
    <Card>
      <ul className="divide-y">
        {feed.data.map((e, i) => (
          <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              {t(e.action === 'read' ? 'groups.feedRead' : 'groups.feedUnread', {
                name: e.display_name || t('groups.anonymous'),
                ref: `${bookName(e.book_code, i18n.language)} ${e.chapter}`,
              })}
            </span>
            <time className="shrink-0 text-xs text-muted-foreground" dateTime={e.at}>
              {fmt.format(new Date(e.at))}
            </time>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function SharedGroupBody({ group, members, isOwner }: { group: Group; members: Member[]; isOwner: boolean }) {
  const { t } = useTranslation()
  const recordId = group.recordId!
  const { reads, activity, setChapters, versionId } = useRecord(recordId)
  const { data: plans } = usePlans(recordId)
  const deletePlan = useDeletePlan(recordId)
  useRealtimeReads(recordId)
  const attribution = useMemo(() => new Map(members.map((m) => [m.user_id, m.display_name])), [members])

  return (
    <Tabs defaultValue="bible" className="space-y-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="bible">{t('nav.bible')}</TabsTrigger>
        <TabsTrigger value="stats">{t('nav.stats')}</TabsTrigger>
        <TabsTrigger value="plans">{t('plans.title')}</TabsTrigger>
        <TabsTrigger value="members">{t('groups.members')}</TabsTrigger>
        <TabsTrigger value="activity">{t('groups.activity')}</TabsTrigger>
      </TabsList>
      <TabsContent value="bible">
        {reads.data ? (
          <Tracker reads={reads.data} onSetChapters={setChapters} versionId={versionId} attribution={attribution} />
        ) : (
          <TrackerSkeleton />
        )}
      </TabsContent>
      <TabsContent value="stats">{reads.data && <StatsView reads={reads.data} activity={activity.data} />}</TabsContent>
      <TabsContent value="plans" className="space-y-4">
        <CreatePlanDialog recordId={recordId} />
        <div className="grid gap-4 lg:grid-cols-2">
          {reads.data &&
            plans?.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                reads={reads.data}
                versionId={versionId}
                onSetChapters={setChapters}
                onDelete={() => deletePlan.mutate(p.id)}
              />
            ))}
        </div>
      </TabsContent>
      <TabsContent value="members">
        <MemberList group={group} members={members} isOwner={isOwner} mode="shared" />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityFeed recordId={recordId} />
      </TabsContent>
    </Tabs>
  )
}

function IndividualGroupBody({ group, members, isOwner }: { group: Group; members: Member[]; isOwner: boolean }) {
  const { t } = useTranslation()
  const total = members.reduce((s, m) => s + m.chapters_read, 0)
  const avg = members.length ? (total / members.length / TOTAL_CHAPTERS) * 100 : 0
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="font-serif text-2xl font-semibold tabular-nums">{members.length}</div>
          <div className="text-xs text-muted-foreground">{t('groups.members')}</div>
        </Card>
        <Card className="p-4">
          <div className="font-serif text-2xl font-semibold tabular-nums">{total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{t('groups.totalChapters')}</div>
        </Card>
        <Card className="p-4">
          <div className="font-serif text-2xl font-semibold tabular-nums">{avg.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">{t('groups.averageProgress')}</div>
        </Card>
      </div>
      <MemberList group={group} members={members} isOwner={isOwner} mode="individual" />
    </div>
  )
}

export function GroupPage() {
  const { t } = useTranslation()
  const { groupId } = useParams({ strict: false }) as { groupId: string }
  const uid = useUserId()
  const group = useGroup(groupId)
  const members = useGroupProgress(groupId)

  if (group.isLoading || members.isLoading) return <Skeleton className="h-96" />
  if (!group.data)
    return (
      <EmptyState title={t('groups.notFound')}>
        <Button asChild variant="outline">
          <Link to="/groups">{t('nav.groups')}</Link>
        </Button>
      </EmptyState>
    )

  const g = group.data
  const isOwner = g.owner_id === uid
  return (
    <>
      <PageHeader
        title={g.name}
        description={
          <span className="flex items-center gap-2">
            <ModeBadge mode={g.mode} />
            {members.data && <span>{t('groups.memberCount', { count: members.data.length })}</span>}
          </span>
        }
        actions={
          <>
            <InviteDialog group={g} isOwner={isOwner} />
            <GroupMenu group={g} isOwner={isOwner} />
          </>
        }
      />
      {g.mode === 'shared' ? (
        <SharedGroupBody group={g} members={members.data ?? []} isOwner={isOwner} />
      ) : (
        <IndividualGroupBody group={g} members={members.data ?? []} isOwner={isOwner} />
      )}
    </>
  )
}
