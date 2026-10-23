import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, KeyRound } from 'lucide-react'
import { serviceCatalogApi, cartV2Api } from '../../../api/index.js'
import { orderApi } from '../../../api/v21.js'
import { PageHeader, QueryState, Tabs } from '../../../components/ui/Polish.jsx'
import { Card, Badge, Button, Input, Modal, Select } from '../../../components/ui/index.jsx'
import { useAuthStore } from '../../../store/authStore.js'
import { formatNaira } from '../../../utils/index.js'

const CATEGORIES = ['tailoring', 'repair', 'logistics', 'technical', 'creative', 'cleaning', 'installation', 'events', 'other'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))
const MODELS = [['FIXED', 'Fixed price'], ['HOURLY', 'Per hour'], ['PER_UNIT', 'Per item'], ['QUOTE', 'Quote required'], ['INSPECTION', 'Inspection first']].map(([value, label]) => ({ value, label }))
const EMPTY = { serviceType: '', category: 'other', pricingModel: 'FIXED', priceNaira: '', estimatedDurationHours: '', serviceArea: '', descriptionText: '' }
const STATUS_COLOR = { PENDING: 'amber', PAID: 'blue', CONFIRMED: 'purple', DELIVERED: 'green' }
const msg = (e, f) => e?.response?.data?.message || f

export default function ServicesManager() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState('services')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [codes, setCodes] = useState({})

  const offerings = useQuery({ queryKey: ['my-offerings'], queryFn: () => serviceCatalogApi.myOfferings().then((r) => r.data.data) })
  const jobs = useQuery({ queryKey: ['my-jobs'], queryFn: () => orderApi.myJobs().then((r) => r.data.data), refetchInterval: 15000 })
  const serviceJobs = (jobs.data || []).filter((j) => j.groupType === 'SERVICE')

  const create = useMutation({
    mutationFn: () => serviceCatalogApi.createOffering({
      serviceType: form.serviceType.trim(), category: form.category, pricingModel: form.pricingModel, priceKobo: Math.round(Number(form.priceNaira) * 100),
      estimatedDurationHours: form.estimatedDurationHours ? Number(form.estimatedDurationHours) : undefined, serviceArea: form.serviceArea, descriptionText: form.descriptionText, assignedState: user.assignedState,
    }),
    onSuccess: () => { toast.success('Service published'); setOpen(false); setForm(EMPTY); qc.invalidateQueries({ queryKey: ['my-offerings'] }) },
    onError: (e) => toast.error(msg(e, 'Could not publish')),
  })
  const toggle = useMutation({
    mutationFn: (o) => serviceCatalogApi.updateOffering(o._id, { isActive: !o.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-offerings'] }), onError: (e) => toast.error(msg(e, 'Could not update')),
  })
  const confirm = useMutation({
    mutationFn: (id) => cartV2Api.confirmFulfillmentGroup(id),
    onSuccess: () => { toast.success('Job accepted'); qc.invalidateQueries({ queryKey: ['my-jobs'] }) }, onError: (e) => toast.error(msg(e, 'Could not accept')),
  })
  const complete = useMutation({
    mutationFn: (id) => orderApi.completeService(id, codes[id]),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries({ queryKey: ['my-jobs'] }); qc.invalidateQueries({ queryKey: ['wallet'] }) }, onError: (e) => toast.error(msg(e, 'Wrong code')),
  })

  return (
    <div>
      <PageHeader eyebrow="Service provider" title="My services" description="Publish what you offer. Customers add your service to their order, pay into escrow, and you are paid when they give you their 4-digit code after the job."
        actions={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>Add service</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'services', label: 'Listings', count: offerings.data?.length }, { id: 'jobs', label: 'Jobs', count: serviceJobs.filter((j) => j.status !== 'DELIVERED').length }]} />

      {tab === 'services' && <QueryState query={offerings} isEmpty={(d) => !d?.length} empty={{ title: 'No services yet', description: 'Add your first service so customers can find you.' }}>
        {(list) => <div className="grid md:grid-cols-2 gap-3">{list.map((o) => (
          <Card key={o._id} className="space-y-1">
            <div className="flex items-center justify-between"><h3 className="font-semibold text-text-p">{o.serviceType}</h3><Badge color={o.isActive ? 'green' : 'muted'}>{o.isActive ? 'Live' : 'Hidden'}</Badge></div>
            <p className="text-xs text-text-m">{o.category} · {MODELS.find((m) => m.value === o.pricingModel)?.label}{o.serviceArea ? ` · ${o.serviceArea}` : ''}</p>
            <p className="font-bold text-brass">{formatNaira(o.priceKobo)}</p>
            <Button size="sm" variant="ghost" onClick={() => toggle.mutate(o)}>{o.isActive ? 'Hide' : 'Show'}</Button>
          </Card>))}</div>}
      </QueryState>}

      {tab === 'jobs' && <QueryState query={jobs} isEmpty={() => !serviceJobs.length} empty={{ title: 'No service jobs yet' }}>
        {() => <div className="space-y-3">{serviceJobs.map((j) => (
          <Card key={j.fulfillmentGroupId} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-sm font-medium text-text-p">{j.items.map((i) => i.serviceType).join(', ')}</p><p className="text-xs text-text-m">Order {j.orderRef} · {j.shippingAddress}</p></div>
              <div className="flex items-center gap-2"><span className="text-sm text-brass">You earn {formatNaira(j.youEarnKobo)}</span><Badge color={STATUS_COLOR[j.status] || 'muted'}>{j.status}</Badge></div>
            </div>
            {j.status === 'PAID' && <Button size="sm" loading={confirm.isPending} onClick={() => confirm.mutate(j.fulfillmentGroupId)}>Accept this job</Button>}
            {j.status === 'PENDING' && <p className="text-xs text-text-m">Waiting for the customer to pay.</p>}
            {j.status === 'CONFIRMED' && <div className="flex flex-wrap items-end gap-2">
              <Input label="Customer's 4-digit code (after the job is done)" inputMode="numeric" maxLength={4} value={codes[j.fulfillmentGroupId] || ''} onChange={(e) => setCodes({ ...codes, [j.fulfillmentGroupId]: e.target.value.replace(/\D/g, '') })} icon={KeyRound} />
              <Button loading={complete.isPending} disabled={(codes[j.fulfillmentGroupId] || '').length !== 4} onClick={() => complete.mutate(j.fulfillmentGroupId)}>Complete and get paid</Button>
            </div>}
          </Card>))}</div>}
      </QueryState>}

      <Modal open={open} onClose={() => setOpen(false)} title="Add a service" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); create.mutate() }}>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Service name *" required value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES} />
            <Select label="How you charge" value={form.pricingModel} onChange={(e) => setForm({ ...form, pricingModel: e.target.value })} options={MODELS} />
            <Input label="Price (₦) *" type="number" min="1" required value={form.priceNaira} onChange={(e) => setForm({ ...form, priceNaira: e.target.value })} hint="Services are paid to you in full." />
            <Input label="Usual duration (hours)" type="number" min="0" value={form.estimatedDurationHours} onChange={(e) => setForm({ ...form, estimatedDurationHours: e.target.value })} />
            <Input label="Area you cover" value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} placeholder="e.g. Kano city" />
          </div>
          <div><label className="input-label">Description</label><textarea className="input w-full resize-none" rows={2} value={form.descriptionText} onChange={(e) => setForm({ ...form, descriptionText: e.target.value })} /></div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={create.isPending}>Publish</Button></div>
        </form>
      </Modal>
    </div>
  )
}
