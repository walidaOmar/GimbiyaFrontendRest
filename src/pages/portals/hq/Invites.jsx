import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Copy } from 'lucide-react'
import { inviteApi } from '../../../api/v21.js'
import { useAuthStore } from '../../../store/authStore.js'
import { STATE_OPTIONS, getRegionLabel } from '../../../config/regions.js'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { Card, Badge, Button, Input, Select } from '../../../components/ui/index.jsx'

const ROLE_LABEL = {
  developer_coordinator: 'State Coordinator',
  affiliate: 'Affiliate Officer',
  support: 'Gimbiya Desk (support)',
  auditor: 'Auditor',
}
const HQ_ROLES = ['developer_coordinator', 'affiliate', 'support', 'auditor']
const STATUS_COLOR = { PENDING: 'amber', ACCEPTED: 'green', REVOKED: 'red', EXPIRED: 'muted' }

export default function Invites() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isCoordinator = user?.role === 'developer_coordinator'
  const roles = isCoordinator ? ['affiliate'] : HQ_ROLES

  const [form, setForm] = useState({ email: '', name: '', role: roles[0], assignedState: STATE_OPTIONS[0].value })
  const [lastLink, setLastLink] = useState(null)

  const list = useQuery({ queryKey: ['invites'], queryFn: () => inviteApi.list().then((response) => response.data) })

  const create = useMutation({
    mutationFn: (body) => inviteApi.create(body),
    onSuccess: ({ data }) => {
      setLastLink(data)
      setForm((currentForm) => ({ ...currentForm, email: '', name: '' }))
      toast.success(data.emailSent ? 'Invitation emailed' : 'Invitation created. The email did not send, so share the link yourself.')
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not create invitation'),
  })

  const revoke = useMutation({
    mutationFn: (id) => inviteApi.revoke(id),
    onSuccess: () => { toast.success('Invitation revoked'); queryClient.invalidateQueries({ queryKey: ['invites'] }) },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not revoke'),
  })

  const needsNode = !isCoordinator && !['support', 'auditor'].includes(form.role)
  const submit = (event) => {
    event.preventDefault()
    create.mutate({ email: form.email, name: form.name, role: form.role, assignedState: needsNode ? form.assignedState : undefined })
  }
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copied')
    } catch {
      toast.error('Copy failed. Select the link and copy it.')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={isCoordinator ? 'Regional operations' : 'Group HQ'}
        title="Invitations"
        description={isCoordinator
          ? `Invite affiliate officers into ${getRegionLabel(user?.assignedState)}. Each link works once and expires in 72 hours.`
          : 'Invite coordinators, affiliate officers, desk staff and auditors. Each link works once and expires in 72 hours.'}
      />

      <Card className="mb-5">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <Input label="Email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Input label="Name (optional)" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Select label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}
            options={roles.map((role) => ({ value: role, label: ROLE_LABEL[role] }))} />
          {needsNode && (
            <Select label="Market" value={form.assignedState} onChange={(event) => setForm({ ...form, assignedState: event.target.value })} options={STATE_OPTIONS} />
          )}
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={create.isPending}>Send invitation</Button>
          </div>
        </form>

        {lastLink && (
          <div className="mt-4 rounded-btn border border-brass/30 bg-brass/5 p-3 text-sm">
            <p className="text-text-m mb-1">Invitation link (shown once, you can also send it on WhatsApp):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate text-xs">{lastLink.inviteUrl}</code>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(lastLink.inviteUrl)}><Copy className="w-3 h-3" /> Copy</button>
            </div>
          </div>
        )}
      </Card>

      <QueryState query={list} isEmpty={(data) => !data?.invites?.length} empty={{ title: 'No invitations yet' }}>
        {(data) => (
          <div className="space-y-2">
            {data.invites.map((invite) => (
              <Card key={invite._id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{invite.name || invite.email}</p>
                  <p className="text-xs text-text-m truncate">
                    {invite.email} · {ROLE_LABEL[invite.role] || invite.role} · {invite.assignedState === 'Global' ? 'All markets' : getRegionLabel(invite.assignedState)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={STATUS_COLOR[invite.displayStatus] || 'muted'}>{invite.displayStatus}</Badge>
                  {invite.displayStatus === 'PENDING' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => revoke.mutate(invite._id)}>Revoke</button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  )
}
