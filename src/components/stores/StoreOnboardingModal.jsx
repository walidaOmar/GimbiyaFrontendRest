import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Building2, Upload, CheckCircle, Landmark,
  MapPin, CreditCard, User, Hash, FileText,
} from 'lucide-react'
import { storeApi } from '../../api/index.js'
import toast from 'react-hot-toast'

const STATE_OPTIONS = [
  { value: 'Abuja', label: 'Abuja' },
  { value: 'Kano', label: 'Kano' },
  { value: 'Kaduna', label: 'Kaduna' },
]

export default function StoreOnboardingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    nin: '',
    cacNumber: '',
    tinNumber: '',
    businessAddress: '',
    homeAddress: '',
    primaryState: 'Kano',
    commerceSegment: 'retailer',
    accountDetails: { bankName: '', accountNumber: '', accountName: '' },
  })

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const setAccount = (key) => (e) => setForm((p) => ({
    ...p,
    accountDetails: { ...p.accountDetails, [key]: e.target.value },
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await storeApi.onboard(form)
      setDone(true)
      toast.success('Store onboarding submitted. It will appear in Pending for verification.')
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
      nin: '',
      cacNumber: '',
      tinNumber: '',
      businessAddress: '',
      homeAddress: '',
      primaryState: 'Kano',
      commerceSegment: 'retailer',
      accountDetails: { bankName: '', accountNumber: '', accountName: '' },
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
                <p className="text-xs text-text-m">CEO verification required before activation</p>
              </div>
            </div>
            <button onClick={reset} className="p-2 hover:bg-surface-h rounded-lg transition-colors">
              <X className="w-5 h-5 text-text-m" />
            </button>
          </div>

          {done ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="font-display text-xl font-bold text-text-p mb-2">Store Submitted!</h4>
              <p className="text-sm text-text-m mb-6">
                The store is now in Pending. Go to the Pending tab to verify and activate it.
              </p>
              <button onClick={reset} className="btn btn-primary px-8">Done</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-6 py-3 border-b border-border shrink-0 bg-midnight/30">
                {[
                  { n: 1, l: 'Business Info' },
                  { n: 2, l: 'KYC Documents' },
                  { n: 3, l: 'Account Details' },
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
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider">Business Name</label>
                      <input
                        required
                        value={form.businessName}
                        onChange={setField('businessName')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="e.g. Alhaji Musa Enterprises"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider">Business Email</label>
                      <input
                        required
                        type="email"
                        value={form.businessEmail}
                        onChange={setField('businessEmail')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="store@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider">Business Phone</label>
                      <input
                        value={form.businessPhone}
                        onChange={setField('businessPhone')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="+234..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider">Primary State</label>
                      <select
                        required
                        value={form.primaryState}
                        onChange={setField('primaryState')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      >
                        {STATE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider">Commerce Segment</label>
                      <select
                        required
                        value={form.commerceSegment}
                        onChange={setField('commerceSegment')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                      >
                        <option value="manufacturer">🏭 Manufacturer</option>
                        <option value="wholesaler">📦 Wholesaler</option>
                        <option value="retailer">🛒 Retailer</option>
                        <option value="service_provider">🔧 Service Provider</option>
                        <option value="logistics">🚚 Logistics</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider">Business Address</label>
                      <textarea
                        required
                        value={form.businessAddress}
                        onChange={setField('businessAddress')}
                        rows={2}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none resize-none"
                        placeholder="Full business address..."
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
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <Hash className="w-3 h-3" /> NIN (Owner)
                      </label>
                      <input
                        required
                        value={form.nin}
                        onChange={setField('nin')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="National Identification Number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> CAC Number
                      </label>
                      <input
                        required
                        value={form.cacNumber}
                        onChange={setField('cacNumber')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="Corporate Affairs Commission"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> TIN Number
                      </label>
                      <input
                        required
                        value={form.tinNumber}
                        onChange={setField('tinNumber')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="Tax Identification Number"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> Home Address (Owner)
                      </label>
                      <textarea
                        required
                        value={form.homeAddress}
                        onChange={setField('homeAddress')}
                        rows={2}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none resize-none"
                        placeholder="Owner's residential address..."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider">ID Document URL</label>
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                          placeholder="Firebase Storage URL for scanned ID/CAC"
                          disabled
                        />
                        <button type="button" className="px-3 py-2 bg-surface-h border border-border rounded-lg text-text-m">
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-text-d mt-1">Paste URL after uploading to Firebase Storage</p>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <button type="button" onClick={() => setStep(1)} className="btn btn-ghost px-6">← Back</button>
                      <button type="button" onClick={() => setStep(3)} className="btn btn-primary px-6">Next: Account →</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <Landmark className="w-3 h-3" /> Bank Name
                      </label>
                      <input
                        value={form.accountDetails.bankName}
                        onChange={setAccount('bankName')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="e.g. First Bank of Nigeria"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3" /> Account Number
                      </label>
                      <input
                        value={form.accountDetails.accountNumber}
                        onChange={setAccount('accountNumber')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="10-digit account number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-text-m mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Account Name
                      </label>
                      <input
                        value={form.accountDetails.accountName}
                        onChange={setAccount('accountName')}
                        className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                        placeholder="Name on account"
                      />
                    </div>
                    <div className="col-span-2 bg-brass/5 border border-brass/20 rounded-lg p-3 mt-2">
                      <p className="text-xs text-text-m">
                        <span className="text-brass font-bold">Note:</span> The store will be created in <span className="text-text-p font-semibold">PENDING</span> status. You must verify it from the Pending tab to activate the business owner account.
                      </p>
                    </div>
                    <div className="flex justify-between col-span-2 pt-2">
                      <button type="button" onClick={() => setStep(2)} className="btn btn-ghost px-6">← Back</button>
                      <button type="submit" disabled={loading} className="btn btn-primary px-8 flex items-center gap-2">
                        {loading ? 'Submitting...' : 'Submit for Verification'}
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
