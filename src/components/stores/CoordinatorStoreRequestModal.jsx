import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building2, Send, Plus, Trash2, User, Package, Truck } from 'lucide-react'
import { storeApi } from '../../api/index.js'
import { STATE_OPTIONS } from '../../config/regions.js'
import toast from 'react-hot-toast'

const SEGMENTS = [
  { value: 'wholesaler', label: '📦 Wholesaler' },
  { value: 'retailer', label: '🛒 Retailer' },
  { value: 'service_provider', label: '🔧 Service Provider' },
  { value: 'logistics', label: '🚚 Logistics' },
]

const FLOOR_OPTIONS = [
  { value: 'LEVEL_1', label: 'Level 1' },
  { value: 'LEVEL_2', label: 'Level 2' },
]

export default function CoordinatorStoreRequestModal({ isOpen, onClose, coordinatorState }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    commerceSegment: 'wholesaler',
    primaryState: coordinatorState || STATE_OPTIONS[1].value,
    nin: '',
    cacNumber: '',
    tinNumber: '',
    businessAddress: '',
    homeAddress: '',
    accountDetails: { bankName: '', accountNumber: '', accountName: '' },
    staffSlots: [],
  })

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const setAccount = (key) => (e) => setForm((p) => ({
    ...p,
    accountDetails: { ...p.accountDetails, [key]: e.target.value },
  }))

  const addStaffSlot = () => {
    const isLogistics = form.commerceSegment === 'logistics'
    setForm((p) => ({
      ...p,
      staffSlots: [
        ...p.staffSlots,
        {
          role: isLogistics ? 'delivery' : 'manager',
          fullName: '',
          email: '',
          phone: '',
          assignedState: coordinatorState || STATE_OPTIONS[1].value,
          buildingFloor: 'LEVEL_1',
        },
      ],
    }))
  }

  const removeStaffSlot = (idx) => {
    setForm((p) => ({ ...p, staffSlots: p.staffSlots.filter((_, i) => i !== idx) }))
  }

  const updateStaffSlot = (idx, key, value) => {
    setForm((p) => {
      const slots = [...p.staffSlots]
      slots[idx] = { ...slots[idx], [key]: value }
      return { ...p, staffSlots: slots }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await storeApi.submitRequest(form)
      setDone(true)
      toast.success('Store request submitted to CEO for approval')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setDone(false)
    setForm({
      businessName: '',
      businessEmail: '',
      businessPhone: '',
      commerceSegment: 'wholesaler',
      primaryState: coordinatorState || STATE_OPTIONS[1].value,
      nin: '',
      cacNumber: '',
      tinNumber: '',
      businessAddress: '',
      homeAddress: '',
      accountDetails: { bankName: '', accountNumber: '', accountName: '' },
      staffSlots: [],
    })
    onClose()
  }

  const isLogistics = form.commerceSegment === 'logistics'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={reset}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-2xl bg-surface-l border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-brass" />
              </div>
              <div>
                <h3 className="font-display font-bold text-text-p">Onboard New Store</h3>
                <p className="text-xs text-text-m">Submit to CEO for verification</p>
              </div>
            </div>
            <button onClick={reset} className="p-2 hover:bg-surface-h rounded-lg transition-colors">
              <X className="w-5 h-5 text-text-m" />
            </button>
          </div>

          {done ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="font-display text-xl font-bold text-text-p mb-2">Request Submitted!</h4>
              <p className="text-sm text-text-m mb-6">
                The CEO will review and approve. You will be notified once the store is active.
              </p>
              <button onClick={reset} className="btn btn-primary px-8">Done</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-6 py-3 border-b border-border shrink-0 bg-midnight/30">
                {[
                  { n: 1, l: 'Business Info' },
                  { n: 2, l: 'KYC Documents' },
                  { n: 3, l: 'Staff Assignment' },
                ].map((s) => (
                  <div key={s.n} className={`flex items-center gap-2 text-xs font-mono ${step >= s.n ? 'text-brass' : 'text-text-d'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${step >= s.n ? 'border-brass bg-brass/10' : 'border-border bg-surface-h'}`}>
                      {s.n}
                    </span>
                    {s.l}
                    {s.n < 3 && <span className="text-border mx-1">→</span>}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Business Name</label>
                      <input
                        required
                        value={form.businessName}
                        onChange={set('businessName')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="e.g. Alhaji Musa Enterprises"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Business Email</label>
                      <input
                        required
                        type="email"
                        value={form.businessEmail}
                        onChange={set('businessEmail')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Phone</label>
                      <input
                        value={form.businessPhone}
                        onChange={set('businessPhone')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Commerce Segment</label>
                      <select
                        required
                        value={form.commerceSegment}
                        onChange={set('commerceSegment')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      >
                        {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Primary State</label>
                      <select
                        required
                        value={form.primaryState}
                        onChange={set('primaryState')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      >
                        {STATE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Business Address</label>
                      <textarea
                        required
                        value={form.businessAddress}
                        onChange={set('businessAddress')}
                        rows={2}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none resize-none"
                      />
                    </div>
                    <div className="flex justify-end col-span-2">
                      <button type="button" onClick={() => setStep(2)} className="btn btn-primary px-6">Next: KYC →</button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">NIN (Owner)</label>
                      <input
                        required
                        value={form.nin}
                        onChange={set('nin')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">CAC Number</label>
                      <input
                        required
                        value={form.cacNumber}
                        onChange={set('cacNumber')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">TIN Number</label>
                      <input
                        required
                        value={form.tinNumber}
                        onChange={set('tinNumber')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Home Address</label>
                      <textarea
                        required
                        value={form.homeAddress}
                        onChange={set('homeAddress')}
                        rows={2}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none resize-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Bank Details</label>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          value={form.accountDetails.bankName}
                          onChange={setAccount('bankName')}
                          placeholder="Bank Name"
                          className="bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        />
                        <input
                          value={form.accountDetails.accountNumber}
                          onChange={setAccount('accountNumber')}
                          placeholder="Account Number"
                          className="bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        />
                        <input
                          value={form.accountDetails.accountName}
                          onChange={setAccount('accountName')}
                          placeholder="Account Name"
                          className="bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <button type="button" onClick={() => setStep(1)} className="btn btn-ghost px-4">← Back</button>
                      <button type="button" onClick={() => setStep(3)} className="btn btn-primary px-6">Next: Staff →</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono text-text-m uppercase">
                        {isLogistics ? 'Dispatch Riders' : 'Branch Managers & Stock Managers'}
                      </p>
                      <button
                        type="button"
                        onClick={addStaffSlot}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 border border-brass/30 rounded-lg text-brass text-xs font-medium hover:bg-brass/20"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add {isLogistics ? 'Rider' : 'Staff'}
                      </button>
                    </div>

                    {form.staffSlots.length === 0 && (
                      <div className="p-4 text-center border border-dashed border-border rounded-lg text-text-m text-sm">
                        {isLogistics ? 'Add at least one Dispatch Rider' : 'Add at least one Branch Manager and one Stock Manager'}
                      </div>
                    )}

                    {form.staffSlots.map((slot, idx) => (
                      <div key={idx} className="bg-midnight/30 border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {slot.role === 'manager' && <User className="w-4 h-4 text-brass" />}
                            {slot.role === 'stock_manager' && <Package className="w-4 h-4 text-purple-400" />}
                            {slot.role === 'delivery' && <Truck className="w-4 h-4 text-cyan-400" />}
                            <span className="text-sm font-medium text-text-p capitalize">{slot.role.replace('_', ' ')}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStaffSlot(idx)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-text-d hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {!isLogistics && (
                            <div>
                              <label className="block text-[10px] font-mono text-text-d mb-1 uppercase">Role</label>
                              <select
                                value={slot.role}
                                onChange={(e) => updateStaffSlot(idx, 'role', e.target.value)}
                                className="w-full bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p focus:border-brass outline-none"
                              >
                                <option value="manager">Branch Manager</option>
                                <option value="stock_manager">Stock Manager</option>
                              </select>
                            </div>
                          )}
                          <div className={isLogistics ? 'col-span-2' : ''}>
                            <label className="block text-[10px] font-mono text-text-d mb-1 uppercase">Full Name</label>
                            <input
                              required
                              value={slot.fullName}
                              onChange={(e) => updateStaffSlot(idx, 'fullName', e.target.value)}
                              className="w-full bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p focus:border-brass outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-text-d mb-1 uppercase">Email</label>
                            <input
                              required
                              type="email"
                              value={slot.email}
                              onChange={(e) => updateStaffSlot(idx, 'email', e.target.value)}
                              className="w-full bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p focus:border-brass outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-text-d mb-1 uppercase">Phone</label>
                            <input
                              value={slot.phone}
                              onChange={(e) => updateStaffSlot(idx, 'phone', e.target.value)}
                              className="w-full bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p focus:border-brass outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-text-d mb-1 uppercase">State</label>
                            <select
                              value={slot.assignedState}
                              onChange={(e) => updateStaffSlot(idx, 'assignedState', e.target.value)}
                              className="w-full bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p focus:border-brass outline-none"
                            >
                              {STATE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-text-d mb-1 uppercase">Floor</label>
                            <select
                              value={slot.buildingFloor}
                              onChange={(e) => updateStaffSlot(idx, 'buildingFloor', e.target.value)}
                              className="w-full bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p focus:border-brass outline-none"
                            >
                              {FLOOR_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between pt-2">
                      <button type="button" onClick={() => setStep(2)} className="btn btn-ghost px-4">← Back</button>
                      <button type="submit" disabled={loading || form.staffSlots.length === 0} className="btn btn-primary px-8 flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        {loading ? 'Submitting...' : 'Submit to CEO'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
