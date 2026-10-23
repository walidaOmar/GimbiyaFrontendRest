import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Copy } from 'lucide-react'
import { inviteApi, inviteExtraApi } from '../../../api/v21.js'
import { useAuthStore } from '../../../store/authStore.js'
import { STATE_OPTIONS, getRegionLabel } from '../../../config/regions.js'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { Card, Badge, Button, Input, Select } from '../../../components/ui/index.jsx'

const ROLE_LABEL = {
  developer_coordinator: 'State Coordinator', affiliate: 'Affiliate Officer', support: 'Gimbiya Desk (support)', auditor: 'Auditor',
  business_owner: 'Business Owner', manager: 'Branch Manager', stock_manager: 'Stock Manager', delivery: 'Rider',
}
const STATUS_COLOR = { PENDING: 'amber', ACCEPTED: 'green', REVOKED: 'red', EXPIRED: 'muted' }
const GLOBAL_ROLES = ['support', 'auditor']
const STAFF = ['manager', 'stock_manager']

export default function Invites() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isHQ = ['super_admin', 'ceo'].includes(user?.role)

  const options = useQuery({ queryKey: ['invite-options'], queryFn: () => inviteExtraApi.options().then((r) => r.data.data) })
  const list = useQuery({ queryKey: ['invites'], queryFn: () => inviteApi.list().then((r) => r.data) })
  const [form, setForm] = useState({ email: '', name: '', role: '', assignedState: STATE_OPTIONS[0].value, businessType: '', businessName: '', storeId: '', affiliateId: '' })
  const [lastLink, setLastLink] = useState(null)

  const opts = options.data
  const role = form.role || opts?.roles?.[0]?.value || ''
  const businessType = form.businessType || opts?.businessTypes?.[0]?.value || ''
  const fixedNode = opts?.fixedNode
  const needsNode = !fixedNode && !GLOBAL_ROLES.includes(role) && !STAFF.includes(role) && !(user?.role === 'business_owner')

  const create = useMutation({
    mutationFn: (body) => inviteApi.create(body),
    onSuccess: ({ data }) => {
      setLastLink(data)
      setForm((f) => ({ ...f, email: '', name: '', businessName: '' }))
      toast.success(data.emailSent ? 'Invitation emailed' : 'Invitation created. The email did not send, so share the link yourself.')
      qc.invalidateQueries({ queryKey: ['invites'] }); qc.invalidateQueries({ queryKey: ['my-plan'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not create invitation'),
  })
  const revoke = useMutation({
    mutationFn: (id) => inviteApi.revoke(id),
    onSuccess: () => { toast.success('Invitation revoked'); qc.invalidateQueries({ queryKey: ['invites'] }) },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not revoke'),
  })

  const submit = (e) => {
    e.preventDefault()
    const body = { email: form.email, name: form.name, role }
    if (needsNode) body.assignedState = form.assignedState
    if (role === 'business_owner') { body.businessType = businessType; body.businessName = form.businessName; if (form.affiliateId) body.affiliateId = form.affiliateId }
    if (STAFF.includes(role) && user?.role !== 'business_owner') body.storeId = form.storeId || opts?.stores?.[0]?.value
    create.mutate(body)
  }
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast.success('Link copied') } catch { toast.error('Copy failed. Select the link and copy it.') } }

  return (
    <div>
      <PageHeader eyebrow={isHQ ? 'Group HQ' : 'Invitations'} title="Invitations"
        description="Each link works once and expires in 72 hours. Merchants are credited to the affiliate who invites them, and HQ approves every new store before it can sell." />
      <QueryState query={options} rows={2}>
        {() => (
          <Card className="mb-5">
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Name (optional)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Select label="Role" value={role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={opts.roles} />
              {needsNode && <Select label="Market" value={form.assignedState} onChange={(e) => setForm({ ...form, assignedState: e.target.value })} options={STATE_OPTIONS} />}
              {fixedNode && <p className="text-xs text-text-m self-end pb-3">Market: {getRegionLabel(fixedNode)} (your own)</p>}
              {role === 'business_owner' && <>
                <Select label="Type of business" value={businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} options={opts.businessTypes} />
                <Input label="Business name" required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
                {opts.affiliates.length > 0 && <Select label="Credit to affiliate (optional)" value={form.affiliateId} onChange={(e) => setForm({ ...form, affiliateId: e.target.value })} options={[{ value: '', label: 'No affiliate' }, ...opts.affiliates]} />}
              </>}
              {STAFF.includes(role) && user?.role !== 'business_owner' && (
                <Select label="Store" value={form.storeId || opts.stores[0]?.value || ''} onChange={(e) => setForm({ ...form, storeId: e.target.value })} options={opts.stores} />
              )}
              <div className="md:col-span-2 flex justify-end"><Button type="submit" loading={create.isPending}>Send invitation</Button></div>
            </form>
            {lastLink && (
              <div className="mt-4 rounded-btn border border-brass/30 bg-brass/5 p-3 text-sm">
                <p className="text-text-m mb-1">Invitation link (shown once, you can also send it on WhatsApp):</p>
                <div className="flex items-center gap-2"><code className="flex-1 truncate text-xs">{lastLink.inviteUrl}</code>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(lastLink.inviteUrl)}><Copy className="w-3 h-3" /> Copy</button></div>
              </div>
            )}
          </Card>
        )}
      </QueryState>

      <QueryState query={list} isEmpty={(d) => !d?.invites?.length} empty={{ title: 'No invitations yet' }}>
        {(d) => (
          <div className="space-y-2">
            {d.invites.map((invite) => (
              <Card key={invite._id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{invite.businessName || invite.name || invite.email}</p>
                  <p className="text-xs text-text-m truncate">{invite.email} · {ROLE_LABEL[invite.role] || invite.role}{invite.businessType ? ` (${invite.businessType.replace('_', ' ')})` : ''} · {invite.assignedState === 'Global' ? 'All markets' : getRegionLabel(invite.assignedState)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={STATUS_COLOR[invite.displayStatus] || 'muted'}>{invite.displayStatus}</Badge>
                  {invite.displayStatus === 'PENDING' && <button className="btn btn-ghost btn-sm" onClick={() => revoke.mutate(invite._id)}>Revoke</button>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  )
}
