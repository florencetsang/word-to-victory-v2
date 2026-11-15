import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, Skeleton } from '@/components/ui/primitives'
import { useGroupPreview, useJoinGroup } from './api'
import { ModeBadge } from './GroupsPage'

export function JoinPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { code } = useParams({ strict: false }) as { code: string }
  const preview = useGroupPreview(code)
  const goToGroup = (id: string) => void navigate({ to: '/groups/$groupId', params: { groupId: id }, replace: true })
  const join = useJoinGroup(goToGroup)

  useEffect(() => {
    if (preview.data?.is_member) goToGroup(preview.data.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.data])

  if (preview.isLoading) return <Skeleton className="mx-auto h-64 max-w-md" />
  if (!preview.data)
    return (
      <EmptyState icon={<Users />} title={t('groups.invalidInvite')}>
        <Button asChild variant="outline">
          <Link to="/groups">{t('nav.groups')}</Link>
        </Button>
      </EmptyState>
    )

  const g = preview.data
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-5 p-8 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 font-serif text-2xl text-primary">
          {g.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('groups.invitedBy', { name: g.owner_name })}</p>
          <h1 className="text-3xl font-semibold">{g.name}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ModeBadge mode={g.mode} /> · {t('groups.memberCount', { count: g.member_count })}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t(`groups.modeHint.${g.mode}`)}</p>
        <Button size="lg" className="w-full" onClick={() => join.mutate(code)} disabled={join.isPending}>
          {t('groups.join')}
        </Button>
      </CardContent>
    </Card>
  )
}
