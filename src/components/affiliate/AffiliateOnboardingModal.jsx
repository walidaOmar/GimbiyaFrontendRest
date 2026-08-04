import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Send, CheckCircle, Store, ShoppingBag, Truck } from 'lucide-react'
import { onboardingApi } from '../../api/index.js'
import toast from 'react-hot-toast'

const ROLE_OPTIONS = [
  { value: 'buyer', label: '🛒 Buyer', icon: ShoppingBag, segment: null },
  { value: 'business_owner', label: '🏪 Retailer', icon: Store, segment: 'retailer' },
  { value: 'business_owner', label: '🚚 Logistics', icon: Truck, segment: 'logistics' },
]

const STATE_OPTIONS = [
  { value: 'Abuja', label: 'Abuja' },
  { value: 'Kano', label: 'Kano' },
  { value: 'Kaduna', label: 'Kaduna' },
]

const ID_OPTIONS = [
  { value: 'nin', label: 'National ID (NIN)' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'passport', label: 'International Passport' },
  { value: 'cac', label: 'CAC Certificate' },
]

export default function AffiliateOnboardingModal({ isOpen, onClose, userState }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)

  const [form, setForm] = useState({
    prospectName: '',
    prospectEmail: '',
    prospectPhone: '',
    proposedState: userState || 'Kano',
    govIdType: 'nin',
    govIdNumber: '',
    idDocumentUrl: '',
  })

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRole) return toast.error('Select a role')
    setLoading(true)
    try {
      await onboardingApi.submitRequest({
        ...form,
        proposedRole: selectedRole.value,
        proposedSegment: selectedRole.segment,
      })
      setDone(true)
      toast.success('Onboarding request submitted to your coordinator')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setDone(false)
    setSelectedRole(null)
    setForm({
      prospectName: '',
      prospectEmail: '',
      prospectPhone: '',
      proposedState: userState || 'Kano',
      govIdType: 'nin',
      govIdNumber: '',
      idDocumentUrl: '',
    })
    onClose()
  }

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
          className="w-full max-w-lg bg-surface-l border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="font-display font-bold text-text-p">Onboard New Member</h3>
            <button onClick={reset} className="p-2 hover:bg-surface-h rounded-lg"><X className="w-5 h-5 text-text-m" /></button>
          </div>

          {done ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="font-display text-lg font-bold text-text-p mb-2">Request Submitted!</h4>
              <p className="text-sm text-text-m mb-4">Your coordinator will review and approve.</p>
              <button onClick={reset} className="btn btn-primary px-6">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!selectedRole ? (
                <div className="space-y-3">
                  <p className="text-xs font-mono text-text-m uppercase tracking-wider">Select Role to Onboard</p>
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon
                    return (
                      <button
                        key={role.label}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className="w-full flex items-center gap-3 p-4 bg-midnight/30 border border-border rounded-xl hover:border-brass/30 hover:bg-surface-h transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-brass/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-brass" />
                        </div>
                        <div>
                          <p className="font-medium text-text-p">{role.label}</p>
                          <p className="text-xs text-text-m">{role.value === 'buyer' ? 'End consumer' : 'Business owner account'}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => setSelectedRole(null)} className="text-xs text-text-m hover:text-text-p">← Change role</button>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brass/10 text-brass font-medium">{selectedRole.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Full Name</label>
                      <input
                        required
                        value={form.prospectName}
                        onChange={set('prospectName')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Email</label>
                      <input
                        required
                        type="email"
                        value={form.prospectEmail}
                        onChange={set('prospectEmail')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Phone</label>
                      <input
                        value={form.prospectPhone}
                        onChange={set('prospectPhone')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">State</label>
                      <select
                        value={form.proposedState}
                        onChange={set('proposedState')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      >
                        {STATE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">ID Type</label>
                      <select
                        value={form.govIdType}
                        onChange={set('govIdType')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      >
                        {ID_OPTIONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">ID Number</label>
                      <input
                        required
                        value={form.govIdNumber}
                        onChange={set('govIdNumber')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-2.5 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {loading ? 'Submitting...' : 'Submit to Coordinator'}
                  </button>
                </>
              )}
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
