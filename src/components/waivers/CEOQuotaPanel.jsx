import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { waiverApi, userApi } from '../../api/index.js'
import { waiverProductsApi } from '../../api/v21.js'
import { getRegionLabel } from '../../config/regions.js'
import { Modal } from '../ui/index.jsx'
import ProductPicker from './ProductPicker.jsx'
import toast from 'react-hot-toast'

export default function CEOQuotaPanel() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    coordinatorId: '', totalSlots: 10, budgetKobo: 0, note: '', expiresInDays: 30,
  })
  const [scope, setScope] = useState('selected')
  const [pickerNode, setPickerNode] = useState('Ado bayero mall')
  const [picked, setPicked] = useState([])
  const [editing, setEditing] = useState(null)
  const [editNode, setEditNode] = useState('Ado bayero mall')
  const [editPicked, setEditPicked] = useState([])

  const { data: quotasData } = useQuery({
    queryKey: ['waivers-quotas'],
    queryFn: () => waiverApi.getQuotas().then((response) => response.data),
  })

  const { data: coordinatorsData } = useQuery({
    queryKey: ['coordinators'],
    queryFn: () => userApi.list({ role: 'developer_coordinator', limit: 100 }).then((response) => response.data),
    enabled: showForm,
  })

  const allocateMut = useMutation({
    mutationFn: (data) => waiverApi.allocateQuota(data),
    onSuccess: () => {
      toast.success('Quota allocated')
      setShowForm(false)
      setPicked([])
      queryClient.invalidateQueries({ queryKey: ['waivers-quotas'] })
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  })

  const saveProductsMut = useMutation({
    mutationFn: ({ id, ids }) => waiverProductsApi.setProducts(id, ids),
    onSuccess: () => {
      toast.success('Product list updated. Coupons already issued keep their old list.')
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['waivers-quotas'] })
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  })

  const coordinators = coordinatorsData?.users || []
  const quotas = quotasData?.quotas || []

  const pickCoordinator = (id) => {
    setForm((previous) => ({ ...previous, coordinatorId: id }))
    const coordinator = coordinators.find((user) => user._id === id)
    if (coordinator?.assignedState && coordinator.assignedState !== 'Global') {
      setPickerNode(coordinator.assignedState)
      setPicked([])
    }
  }

  const allocate = () => {
    if (scope === 'selected' && picked.length === 0) {
      toast.error('Pick at least one product, or choose "All products".')
      return
    }
    allocateMut.mutate({ ...form, eligibleProductIds: scope === 'selected' ? picked.map((product) => product._id) : [] })
  }

  const openEdit = (quota) => {
    setEditing(quota)
    setEditNode(quota.coordinatorId?.assignedState && quota.coordinatorId.assignedState !== 'Global' ? quota.coordinatorId.assignedState : 'Ado bayero mall')
    setEditPicked((quota.eligibleProductIds || []).map((product) => ({ _id: product._id, name: product.name })))
  }

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
                onChange={(event) => pickCoordinator(event.target.value)}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
              >
                <option value="">Select coordinator...</option>
                {coordinators.map((coordinator) => (
                  <option key={coordinator._id} value={coordinator._id}>{coordinator.name} — {getRegionLabel(coordinator.assignedState)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-text-m mb-1.5">Slots</label>
              <input type="number" min={1} value={form.totalSlots}
                onChange={(event) => setForm((previous) => ({ ...previous, totalSlots: Number(event.target.value) }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p" />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-m mb-1.5">Budget (₦)</label>
              <input type="number" min={0} value={form.budgetKobo / 100}
                onChange={(event) => setForm((previous) => ({ ...previous, budgetKobo: Number(event.target.value) * 100 }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p" />
            </div>
            <div>
              <label className="block text-xs font-mono text-text-m mb-1.5">Expires (days)</label>
              <input type="number" min={1} max={365} value={form.expiresInDays}
                onChange={(event) => setForm((previous) => ({ ...previous, expiresInDays: Number(event.target.value) }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-mono text-text-m mb-1.5">Note</label>
              <input value={form.note} onChange={(event) => setForm((previous) => ({ ...previous, note: event.target.value }))}
                className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p"
                placeholder="Optional note for coordinator" />
            </div>

            <div className="col-span-2 space-y-3">
              <label className="block text-xs font-mono text-text-m">Products this waiver can cover</label>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={scope === 'selected'} onChange={() => setScope('selected')} /> Selected products only</label>
                <label className="flex items-center gap-2"><input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} /> All products</label>
              </div>
              {scope === 'selected' && (
                <ProductPicker node={pickerNode} onNodeChange={setPickerNode} selected={picked} onChange={setPicked} />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="btn btn-ghost px-4">Cancel</button>
            <button onClick={allocate} disabled={!form.coordinatorId || allocateMut.isPending} className="btn btn-primary px-6">
              {allocateMut.isPending ? 'Allocating...' : 'Allocate'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {quotas.map((quota) => (
          <div key={quota._id} className="bg-surface-l border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-brass/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-brass" />
              </div>
              <div>
                <p className="font-medium text-text-p">{quota.coordinatorId?.name}</p>
                <p className="text-xs text-text-m">{quota.coordinatorId?.email} · {getRegionLabel(quota.coordinatorId?.assignedState)}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Slots</p>
                <p className="font-bold text-text-p">{quota.usedSlots}/{quota.totalSlots}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Budget</p>
                <p className="font-bold text-text-p">₦{((quota.budgetKobo || 0) / 100).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Expires</p>
                <p className="font-bold text-text-p">{new Date(quota.expiresAt).toLocaleDateString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Products</p>
                <button className="font-bold text-brass underline-offset-2 hover:underline" onClick={() => openEdit(quota)}>
                  {quota.eligibleProductIds?.length ? `${quota.eligibleProductIds.length} selected` : 'All'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Products covered by this quota" size="lg">
        <p className="text-xs text-text-m mb-3">Leave the list empty to allow every product. Coupons already issued keep the list they were issued with.</p>
        <ProductPicker node={editNode} onNodeChange={setEditNode} selected={editPicked} onChange={setEditPicked} />
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-ghost px-4" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn btn-primary px-6" disabled={saveProductsMut.isPending}
            onClick={() => saveProductsMut.mutate({ id: editing._id, ids: editPicked.map((product) => product._id) })}>
            {saveProductsMut.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
