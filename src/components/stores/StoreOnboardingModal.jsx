import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, CheckCircle, ChevronLeft, ChevronRight, FileText, MapPin, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { storeApi } from '../../api/index.js'
import { STATE_OPTIONS } from '../../config/regions.js'
import { BUSINESS_CLASSIFICATION, getCategories, getSubcategories } from '../../config/businessClassification.js'
import { useAuthStore } from '../../store/authStore.js'

const INITIAL_FORM = { name: '', email: '', phone: '', ownerId: '', state: '', floorLevel: '', sector: 'retail', category: '', subcategory: '', nin: '', cacNumber: '', tinNumber: '', businessAddress: '', homeAddress: '', accountDetails: { bankName: '', accountNumber: '', accountName: '' } }
const createInitialForm = (state) => ({ ...INITIAL_FORM, state: state || STATE_OPTIONS[0]?.value || '' })

export default function StoreOnboardingModal({ isOpen, onClose }) {
  const user = useAuthStore((state) => state.user)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState(() => createInitialForm(user?.assignedState))
  const classification = useMemo(() => BUSINESS_CLASSIFICATION.find((item) => item.value === form.sector), [form.sector])
  const categories = getCategories(form.sector)
  const subcategories = getSubcategories(form.sector, form.category)
  const isCoordinator = user?.role === 'developer_coordinator'

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value, ...(field === 'sector' ? { category: '', subcategory: '' } : {}), ...(field === 'category' ? { subcategory: '' } : {}) }))
  const setAccountField = (field) => (event) => setForm((current) => ({ ...current, accountDetails: { ...current.accountDetails, [field]: event.target.value } }))
  const reset = () => { setStep(1); setDone(false); setForm(createInitialForm(user?.assignedState)); onClose?.() }

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        businessName: form.name,
        businessEmail: form.email,
        businessPhone: form.phone,
        primaryState: form.state,
        commerceSegment: classification.businessType,
        businessType: classification.businessType,
        marketTier: classification.marketTier,
      }
      if (isCoordinator) await storeApi.submitRequest(payload)
      else await storeApi.onboard(payload)
      setDone(true)
      toast.success(isCoordinator ? 'Store request submitted for CEO approval.' : 'Store onboarding submitted.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Store onboarding failed')
    } finally { setLoading(false) }
  }

  if (!isOpen) return null
  return <AnimatePresence><motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={reset}><motion.div className="w-full max-w-3xl bg-surface-l border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()}>
    <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-brass" /></div><div><h3 className="font-display font-bold text-text-p">Onboard New Store</h3><p className="text-xs text-text-m">Classification controls marketplace visibility.</p></div></div><button onClick={reset} className="p-2 hover:bg-surface-h rounded-lg" aria-label="Close store onboarding"><X className="w-5 h-5 text-text-m" /></button></div>
    {done ? <div className="p-10 text-center"><CheckCircle className="w-14 h-14 text-success mx-auto mb-4" /><h4 className="font-display text-xl font-bold text-text-p">Store Submitted</h4><p className="text-sm text-text-m mt-2 mb-6">The store is pending backend verification.</p><button onClick={reset} className="btn btn-primary px-8">Done</button></div> : <><div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-midnight/30 shrink-0">{['Business details', 'Classification', 'Review & submit'].map((label, index) => <div key={label} className={`flex items-center gap-2 text-xs font-mono ${step >= index + 1 ? 'text-brass' : 'text-text-d'}`}><span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${step >= index + 1 ? 'border-brass bg-brass/10' : 'border-border bg-surface-h'}`}>{index + 1}</span>{label}{index < 2 && <span className="text-border mx-1">→</span>}</div>)}</div><form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto">
      {step === 1 && <div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="input-label">Store name</label><input required value={form.name} onChange={setField('name')} className="input w-full" placeholder="Business name" /></div><div><label className="input-label">Owner email</label><input required type="email" value={form.email} onChange={setField('email')} className="input w-full" placeholder="owner@example.com" /></div><div><label className="input-label">Phone</label><input value={form.phone} onChange={setField('phone')} className="input w-full" placeholder="+234..." /></div><div><label className="input-label">State / node</label><select required disabled={Boolean(user?.assignedState)} value={form.state} onChange={setField('state')} className="input w-full">{STATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><div><label className="input-label">Floor or unit</label><input value={form.floorLevel} onChange={setField('floorLevel')} className="input w-full" placeholder="Floor 2, Unit 14" /></div><div className="col-span-2"><label className="input-label">Owner ID (optional)</label><input value={form.ownerId} onChange={setField('ownerId')} className="input w-full" placeholder="Existing user ID" /></div></div>}
      {step === 2 && <div className="grid grid-cols-2 gap-4"><div><label className="input-label">Sector</label><select required value={form.sector} onChange={setField('sector')} className="input w-full">{BUSINESS_CLASSIFICATION.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div><label className="input-label">Primary category</label><select required value={form.category} onChange={setField('category')} className="input w-full"><option value="">Select category</option>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div><label className="input-label">Secondary subcategory</label><select required value={form.subcategory} onChange={setField('subcategory')} className="input w-full"><option value="">Select subcategory</option>{subcategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="bg-brass/5 border border-brass/20 rounded-btn p-3"><p className="text-xs text-text-m">Marketplace tier</p><p className="text-sm font-bold text-brass mt-1">{classification.marketTier}</p></div><div className="col-span-2"><label className="input-label">Business address</label><textarea required value={form.businessAddress} onChange={setField('businessAddress')} rows={2} className="input w-full resize-none" placeholder="Full business address" /></div></div>}
      {step === 3 && <div className="grid grid-cols-2 gap-4"><div><label className="input-label">NIN</label><input required value={form.nin} onChange={setField('nin')} className="input w-full" /></div><div><label className="input-label"><FileText className="w-3 h-3 inline mr-1" /> CAC number</label><input required value={form.cacNumber} onChange={setField('cacNumber')} className="input w-full" /></div><div><label className="input-label">TIN number</label><input required value={form.tinNumber} onChange={setField('tinNumber')} className="input w-full" /></div><div><label className="input-label"><MapPin className="w-3 h-3 inline mr-1" /> Home address</label><input required value={form.homeAddress} onChange={setField('homeAddress')} className="input w-full" /></div><div><label className="input-label">Bank name</label><input value={form.accountDetails.bankName} onChange={setAccountField('bankName')} className="input w-full" /></div><div><label className="input-label">Account number</label><input value={form.accountDetails.accountNumber} onChange={setAccountField('accountNumber')} className="input w-full" /></div><div className="col-span-2 bg-brass/5 border border-brass/20 rounded-btn p-4"><p className="text-sm">{form.name} will be submitted as a <strong>{classification.label}</strong> store in <strong className="text-brass">{form.state}</strong>.</p><p className="text-xs text-text-m mt-1">The backend validates classification and controls the final visibility tier.</p></div></div>}
      <div className="flex justify-between border-t border-border pt-4"><button type="button" className="btn btn-ghost" disabled={step === 1} onClick={() => setStep(step - 1)}><ChevronLeft className="w-4 h-4" /> Back</button>{step < 3 ? <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>Continue <ChevronRight className="w-4 h-4" /></button> : <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit for verification'}</button>}</div>
    </form></>}</motion.div></motion.div></AnimatePresence>
}
