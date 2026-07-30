import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { waiverApi, userApi } from '../../api/index.js'
import toast from 'react-hot-toast'

export default function CEOQuotaPanel() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    coordinatorId: '', totalSlots: 10, budgetKobo: 0, note: '', expiresInDays: 30,
  })

  const { data: quotasData } = useQuery({
    queryKey: ['waivers-quotas'],
    queryFn: () => waiverApi.getQuotas().then((r) => r.data),
  })

  const { data: coordinatorsData } = useQuery({
    queryKey: ['coordinators'],
    queryFn: () => userApi.list({ role: 'developer_coordinator', limit: 100 }).then((r) => r.data),
    enabled: showForm,
  })

  const allocateMut = useMutation({
    mutationFn: (data) => waiverApi.allocateQuota(data),
    onSuccess: () => {
      toast.success('Quota allocated')
      setShowForm(false)
      qc.invalidateQueries(['waivers-quotas'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const coordinators = coordinatorsData?.users || []
  const quotas = quotasData?.quotas || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-text-p">Waiver Quotas</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90"
        >
          <Plus className="w-4 h-4" /> Allocate Quota
        </button>
      </div>

      {showForm && (
        <div className="bg-surface-l border border-border rounded-xl p-5 space-y-4">
          <h4 className="font-medium text-text-p">Allocate to Coordinator</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-mono text-text-m mb-1.5">Coordinator</label>
              <select
                value={form.coordinatorId}
                onChange={(e) => setForm((p) => ({ ...p, coordinatorId: e.target.value }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
              >
                <option value="">Select coordinator...</option>
                {coordinators.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} — {c.assignedState}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-text-m mb-1.5">Slots</label>
              <input
                type="number"
                min={1}
                value={form.totalSlots}
                onChange={(e) => setForm((p) => ({ ...p, totalSlots: Number(e.target.value) }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-m mb-1.5">Budget (₦)</label>
              <input
                type="number"
                min={0}
                value={form.budgetKobo / 100}
                onChange={(e) => setForm((p) => ({ ...p, budgetKobo: Number(e.target.value) * 100 }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-m mb-1.5">Expires (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.expiresInDays}
                onChange={(e) => setForm((p) => ({ ...p, expiresInDays: Number(e.target.value) }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-mono text-text-m mb-1.5">Note</label>
              <input
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p"
                placeholder="Optional note for coordinator"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="btn btn-ghost px-4">Cancel</button>
            <button
              onClick={() => allocateMut.mutate(form)}
              disabled={!form.coordinatorId || allocateMut.isPending}
              className="btn btn-primary px-6"
            >
              {allocateMut.isPending ? 'Allocating...' : 'Allocate'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {quotas.map((q) => (
          <div key={q._id} className="bg-surface-l border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-brass/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-brass" />
              </div>
              <div>
                <p className="font-medium text-text-p">{q.coordinatorId?.name}</p>
                <p className="text-xs text-text-m">{q.coordinatorId?.email} · {q.coordinatorId?.assignedState}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Slots</p>
                <p className="font-bold text-text-p">{q.usedSlots}/{q.totalSlots}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Budget</p>
                <p className="font-bold text-text-p">₦{((q.budgetKobo || 0) / 100).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Expires</p>
                <p className="font-bold text-text-p">{new Date(q.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
