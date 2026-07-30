import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Building2, MapPin, Phone, Mail, User, Hash, FileText,
  Landmark, CreditCard, ArrowLeft, Plus, Store, Users, Package,
  CheckCircle, XCircle,
} from 'lucide-react'
import { storeApi } from '../../api/index.js'
import toast from 'react-hot-toast'

const FLOOR_OPTIONS = [
  { value: 'LEVEL_1', label: 'Level 1 — Ground Floor' },
  { value: 'LEVEL_2', label: 'Level 2 — Upper Floor' },
]

export default function StoreDetailPanel({ storeId, onBack }) {
  const qc = useQueryClient()
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['store', storeId],
    queryFn: () => storeApi.getOne(storeId).then((r) => r.data),
  })

  const verifyMut = useMutation({
    mutationFn: (data) => storeApi.verify(storeId, data),
    onSuccess: () => {
      toast.success('Store verified and owner account created')
      qc.invalidateQueries(['store', storeId])
      qc.invalidateQueries(['stores'])
      qc.invalidateQueries(['pending-stores'])
      setShowVerifyModal(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Verification failed'),
  })

  const branchMut = useMutation({
    mutationFn: (data) => storeApi.createBranch(storeId, data),
    onSuccess: () => {
      toast.success('Branch created')
      qc.invalidateQueries(['store', storeId])
      setShowBranchForm(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create branch'),
  })

  const { data: staffData } = useQuery({
    queryKey: ['available-staff', data?.store?.primaryState],
    queryFn: () => storeApi.availableStaff({ role: 'manager', state: data?.store?.primaryState }).then((r) => r.data),
    enabled: !!data?.store?.primaryState && showBranchForm,
  })

  if (isLoading) return <div className="p-8 text-center text-text-m animate-pulse">Loading store details...</div>
  if (!data?.store) return <div className="p-8 text-center text-text-m">Store not found</div>

  const { store, branches } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-text-m hover:text-text-p transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Stores
        </button>
        {store.verificationStatus === 'PENDING' && (
          <button
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all"
          >
            <CheckCircle className="w-4 h-4" /> Verify Store
          </button>
        )}
      </div>

      <div className="bg-surface-l border border-border rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brass/10 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-brass" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-text-p">{store.businessName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  store.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                  store.verificationStatus === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {store.verificationStatus}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  store.commerceSegment === 'manufacturer' ? 'bg-blue-500/10 text-blue-400' :
                  store.commerceSegment === 'wholesaler' ? 'bg-purple-500/10 text-purple-400' :
                  store.commerceSegment === 'retailer' ? 'bg-emerald-500/10 text-emerald-400' :
                  store.commerceSegment === 'service_provider' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-cyan-500/10 text-cyan-400'
                }`}>
                  {store.commerceSegment?.replace('_', ' ')}
                </span>
                <span className="text-xs text-text-m flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {store.primaryState}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <InfoItem icon={<Mail className="w-4 h-4" />} label="Business Email" value={store.businessEmail} />
          <InfoItem icon={<Phone className="w-4 h-4" />} label="Phone" value={store.businessPhone || '—'} />
          <InfoItem icon={<Hash className="w-4 h-4" />} label="NIN" value={store.nin} />
          <InfoItem icon={<FileText className="w-4 h-4" />} label="CAC" value={store.cacNumber} />
          <InfoItem icon={<FileText className="w-4 h-4" />} label="TIN" value={store.tinNumber} />
          <InfoItem icon={<Landmark className="w-4 h-4" />} label="Bank" value={store.accountDetails?.bankName || '—'} />
          <InfoItem icon={<CreditCard className="w-4 h-4" />} label="Account" value={store.accountDetails?.accountNumber || '—'} />
          <InfoItem icon={<User className="w-4 h-4" />} label="Account Name" value={store.accountDetails?.accountName || '—'} />
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-mono text-text-m uppercase tracking-wider mb-1">Business Address</p>
          <p className="text-sm text-text-p">{store.businessAddress}</p>
        </div>
        <div className="mt-2">
          <p className="text-xs font-mono text-text-m uppercase tracking-wider mb-1">Owner Home Address</p>
          <p className="text-sm text-text-p">{store.homeAddress}</p>
        </div>
      </div>

      <div className="bg-surface-l border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-brass" />
            <h3 className="font-display font-bold text-text-p">Branches</h3>
            <span className="text-xs text-text-m bg-midnight px-2 py-0.5 rounded-full">{branches?.length || 0}</span>
          </div>
          {store.verificationStatus === 'VERIFIED' && (
            <button
              onClick={() => setShowBranchForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 border border-brass/30 rounded-lg text-brass text-xs font-medium hover:bg-brass/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Branch
            </button>
          )}
        </div>

        {branches?.length ? (
          <div className="space-y-3">
            {branches.map((branch) => (
              <div key={branch._id} className="bg-midnight/40 border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-text-p">{branch.branchName}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-h text-text-m">{branch.assignedState} · {branch.buildingFloor}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-text-m">
                    <Users className="w-3.5 h-3.5 text-text-d" />
                    <span>Manager: {branch.managerId?.name || <span className="text-amber-400">Not assigned</span>}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-m">
                    <Package className="w-3.5 h-3.5 text-text-d" />
                    <span>Stock Mgr: {branch.stockManagerId?.name || <span className="text-amber-400">Not assigned</span>}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-text-d text-sm border border-dashed border-border rounded-lg">
            No branches yet. {store.verificationStatus === 'VERIFIED' ? 'Add one above.' : 'Verify store first.'}
          </div>
        )}
      </div>

      {showVerifyModal && (
        <VerifyModal
          store={store}
          onClose={() => setShowVerifyModal(false)}
          onVerify={(pwd) => verifyMut.mutate({ initialPassword: pwd })}
          loading={verifyMut.isPending}
        />
      )}

      {showBranchForm && (
        <BranchFormModal
          storeState={store.primaryState}
          staff={staffData?.staff || []}
          onClose={() => setShowBranchForm(false)}
          onSubmit={(data) => branchMut.mutate(data)}
          loading={branchMut.isPending}
        />
      )}
    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="bg-midnight/30 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-text-d mb-1">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-text-p font-medium truncate">{value}</p>
    </div>
  )
}

function VerifyModal({ store, onClose, onVerify, loading }) {
  const [pwd, setPwd] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface-l border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display font-bold text-text-p mb-2">Verify Store</h3>
        <p className="text-sm text-text-m mb-4">
          This will create a business owner account for <span className="text-text-p font-medium">{store.businessEmail}</span>.
          Set a temporary password or leave blank for auto-generation.
        </p>
        <input
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Temporary password (optional)"
          className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-emerald-500 outline-none mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
          <button onClick={() => onVerify(pwd)} disabled={loading} className="btn btn-primary px-6 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20">
            {loading ? 'Verifying...' : 'Verify & Create Account'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function BranchFormModal({ storeState, staff, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({ branchName: '', assignedState: storeState, buildingFloor: 'LEVEL_1', managerId: '', stockManagerId: '' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface-l border border-border rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display font-bold text-text-p mb-4">Create New Branch</h3>
        <div className="space-y-4">
          <input
            value={form.branchName}
            onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))}
            placeholder="Branch name"
            className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.assignedState} onChange={(e) => setForm((p) => ({ ...p, assignedState: e.target.value }))} className="bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p">
              <option value="Abuja">Abuja</option>
              <option value="Kano">Kano</option>
              <option value="Kaduna">Kaduna</option>
            </select>
            <select value={form.buildingFloor} onChange={(e) => setForm((p) => ({ ...p, buildingFloor: e.target.value }))} className="bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p">
              {FLOOR_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-text-m uppercase tracking-wider mb-1.5 block">Assign Manager</label>
            <select value={form.managerId} onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))} className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p">
              <option value="">— Select Manager —</option>
              {staff.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-text-m uppercase tracking-wider mb-1.5 block">Assign Stock Manager</label>
            <select value={form.stockManagerId} onChange={(e) => setForm((p) => ({ ...p, stockManagerId: e.target.value }))} className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p">
              <option value="">— Select Stock Manager —</option>
              {staff.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost px-4">Cancel</button>
          <button onClick={() => onSubmit(form)} disabled={loading || !form.branchName} className="btn btn-primary px-6">
            {loading ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
