import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { revenueApi } from '../../../api/v21.js'
import { getRegionLabel } from '../../../config/regions.js'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { Card, Button, Badge } from '../../../components/ui/index.jsx'

const SPLIT_PARTS = [['affiliate', 'Affiliate'], ['platform', 'Platform'], ['merchant', 'Merchant'], ['rider', 'Rider']]
const sum = (obj) => SPLIT_PARTS.reduce((total, [key]) => total + (Number(obj?.[key]) || 0), 0)

function NumberField({ label, value, onChange, suffix, step = '0.1', disabled = false }) {
  return (
    <label className="block">
      <span className="input-label">{label}</span>
      <div className="relative">
        <input type="number" step={step} min="0" disabled={disabled} className="input pr-10" value={value} onChange={(event) => onChange(event.target.value)} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-m">{suffix}</span>}
      </div>
    </label>
  )
}

function toForm(config) {
  return {
    nodes: { ...config.nodeCommissionPct },
    level2: config.level2CommissionPct,
    wholesale: config.wholesaleCommissionPct,
    fee: config.platformFeePct,
    referred: { ...config.splitReferred },
    organic: { ...config.splitOrganic },
    proNaira: config.subscription.proKobo / 100,
    legendaryNaira: config.subscription.legendaryKobo / 100,
    reason: '',
  }
}

export default function HQRevenue() {
  const queryClient = useQueryClient()
  const current = useQuery({ queryKey: ['revenue-current'], queryFn: () => revenueApi.current().then((response) => response.data) })
  const history = useQuery({ queryKey: ['revenue-history'], queryFn: () => revenueApi.history().then((response) => response.data) })
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (current.data?.config) setForm(toForm(current.data.config))
  }, [current.data])

  const publish = useMutation({
    mutationFn: (body) => revenueApi.publish(body),
    onSuccess: (response) => {
      toast.success(response.data.message)
      queryClient.invalidateQueries({ queryKey: ['revenue-current'] })
      queryClient.invalidateQueries({ queryKey: ['revenue-history'] })
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not publish'),
  })

  const set = (patch) => setForm((currentForm) => ({ ...currentForm, ...patch }))
  const referredOk = form && Math.abs(sum(form.referred) - 100) < 0.001
  const organicOk = form && Math.abs(sum(form.organic) - 100) < 0.001
  const canPublish = form && referredOk && organicOk && form.reason.trim().length >= 5

  const submit = () => publish.mutate({
    nodeCommissionPct: Object.fromEntries(Object.entries(form.nodes).map(([key, value]) => [key, Number(value)])),
    level2CommissionPct: Number(form.level2),
    wholesaleCommissionPct: Number(form.wholesale),
    platformFeePct: Number(form.fee),
    splitReferred: Object.fromEntries(SPLIT_PARTS.map(([key]) => [key, Number(form.referred[key])])),
    splitOrganic: Object.fromEntries(SPLIT_PARTS.map(([key]) => [key, Number(form.organic[key])])),
    subscription: { basicKobo: 0, proKobo: Math.round(Number(form.proNaira) * 100), legendaryKobo: Math.round(Number(form.legendaryNaira) * 100) },
    reason: form.reason,
  })

  return (
    <div>
      <PageHeader
        eyebrow="Group HQ"
        title="Revenue Architecture"
        description="HQ controls what the platform earns. Every change is saved as a new version with your name and reason; old versions are never edited."
        actions={current.data?.config && <Badge color="brass">Live: v{current.data.config.version}</Badge>}
      />

      <Card className="mb-5 border-brass/30 text-sm text-text-m">
        Commission rates (node, Level 2, wholesale) apply to <b>new orders immediately</b>. The 1.5% platform fee, the commission pool
        splits and the subscription prices are saved here as the agreed policy, but are <b>not yet applied to payouts</b>.
      </Card>

      <QueryState query={current} rows={4}>
        {() => !form ? null : (
          <div className="space-y-5">
            <Card>
              <p className="section-label mb-3">Commission by node (Level 1 floors)</p>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.keys(form.nodes).map((node) => (
                  <NumberField key={node} label={getRegionLabel(node)} suffix="%" value={form.nodes[node]}
                    onChange={(value) => set({ nodes: { ...form.nodes, [node]: value } })} />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                <NumberField label="Level 2 floors (all nodes)" suffix="%" value={form.level2} onChange={(value) => set({ level2: value })} />
                <NumberField label="Wholesale" suffix="%" value={form.wholesale} onChange={(value) => set({ wholesale: value })} />
                <NumberField label="Platform transaction fee" suffix="%" value={form.fee} onChange={(value) => set({ fee: value })} />
              </div>
            </Card>

            {[
              ['referred', 'Commission pool split: referred sale', referredOk],
              ['organic', 'Commission pool split: organic sale', organicOk],
            ].map(([key, title, ok]) => (
              <Card key={key}>
                <div className="flex items-center justify-between mb-3">
                  <p className="section-label">{title}</p>
                  <Badge color={ok ? 'green' : 'red'}>Total {sum(form[key])}%</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  {SPLIT_PARTS.map(([part, label]) => (
                    <NumberField key={part} label={label} suffix="%" step="1" value={form[key][part]}
                      onChange={(value) => set({ [key]: { ...form[key], [part]: value } })} />
                  ))}
                </div>
                {!ok && <p className="text-xs text-danger mt-2">The four parts must add up to exactly 100.</p>}
              </Card>
            ))}

            <Card>
              <p className="section-label mb-3">Merchant subscriptions (per year)</p>
              <div className="grid gap-4 md:grid-cols-3">
                <NumberField label="Basic" suffix="₦" step="1" value={0} onChange={() => {}} disabled />
                <NumberField label="Pro" suffix="₦" step="1000" value={form.proNaira} onChange={(value) => set({ proNaira: value })} />
                <NumberField label="Legendary" suffix="₦" step="1000" value={form.legendaryNaira} onChange={(value) => set({ legendaryNaira: value })} />
              </div>
            </Card>

            <Card>
              <label className="block">
                <span className="input-label">Reason for this change (required, kept in the history)</span>
                <input className="input" value={form.reason} onChange={(event) => set({ reason: event.target.value })} placeholder="e.g. Kano pilot rate review" />
              </label>
              <div className="mt-4 flex justify-end">
                <Button loading={publish.isPending} disabled={!canPublish} onClick={submit}>Publish new version</Button>
              </div>
            </Card>
          </div>
        )}
      </QueryState>

      <h2 className="font-display text-lg font-bold mt-8 mb-3">History</h2>
      <QueryState query={history} isEmpty={(data) => !data?.history?.length} empty={{ title: 'No versions yet' }}>
        {(data) => (
          <div className="space-y-2">
            {data.history.map((entry) => (
              <Card key={entry._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span><b>v{entry.version}</b> · {entry.reason}</span>
                <span className="text-text-m text-xs">{entry.changedBy?.name || 'System'} · {new Date(entry.createdAt).toLocaleString()}</span>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  )
}
