import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Package, Tag, Clock, CheckCircle, Copy, ArrowRight } from 'lucide-react'
import { groupOrderApi, productApi } from '../../api/index.js'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function CreateGroupOrderModal({ isOpen, onClose, userState }) {
  const [step, setStep] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [form, setForm] = useState({
    targetQuantity: 5,
    maxQuantity: 50,
    discountPct: 10,
    expiresInHours: 48,
  })
  const [created, setCreated] = useState(null)
  const [loading, setLoading] = useState(false)

  const { data: catalog } = useQuery({
    queryKey: ['catalog-group', userState],
    queryFn: () => productApi.getCatalog({ assignedState: userState, limit: 50 }).then((r) => r.data),
    enabled: isOpen && !!userState,
  })

  const handleCreate = async () => {
    if (!selectedProduct) return
    setLoading(true)
    try {
      const res = await groupOrderApi.create({
        productId: selectedProduct._id,
        targetQuantity: form.targetQuantity,
        maxQuantity: form.maxQuantity,
        discountTiers: [{ minQty: form.targetQuantity, discountPct: form.discountPct }],
        assignedState: userState,
        expiresInHours: form.expiresInHours,
      })
      setCreated(res.data.groupOrder)
      setStep(3)
      toast.success('Group order created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setSelectedProduct(null)
    setCreated(null)
    setForm({ targetQuantity: 5, maxQuantity: 50, discountPct: 10, expiresInHours: 48 })
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
          className="w-full max-w-lg bg-surface-l border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h3 className="font-display font-bold text-text-p">Create Group Order</h3>
            <button onClick={reset} className="p-2 hover:bg-surface-h rounded-lg"><X className="w-5 h-5 text-text-m" /></button>
          </div>

          <div className="p-6 overflow-y-auto">
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-xs font-mono text-text-m uppercase tracking-wider mb-2">Select Product</p>
                {catalog?.products?.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => {
                      setSelectedProduct(p)
                      setStep(2)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedProduct?._id === p._id
                        ? 'border-brass bg-brass/10'
                        : 'border-border hover:border-brass/30 hover:bg-surface-h'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-surface-h flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-text-d" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-p truncate">{p.name}</p>
                      <p className="text-xs text-text-m">₦{(p.priceKobo / 100).toLocaleString()}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-d" />
                  </button>
                ))}
              </div>
            )}

            {step === 2 && selectedProduct && (
              <div className="space-y-4">
                <div className="bg-midnight/40 rounded-lg p-3 flex items-center gap-3">
                  <Package className="w-5 h-5 text-brass" />
                  <div>
                    <p className="text-sm font-medium text-text-p">{selectedProduct.name}</p>
                    <p className="text-xs text-text-m">₦{(selectedProduct.priceKobo / 100).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-text-m mb-1.5">Target Quantity</label>
                    <input
                      type="number"
                      min={2}
                      value={form.targetQuantity}
                      onChange={(e) => setForm((p) => ({ ...p, targetQuantity: Number(e.target.value) }))}
                      className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-m mb-1.5">Max Quantity</label>
                    <input
                      type="number"
                      min={2}
                      value={form.maxQuantity}
                      onChange={(e) => setForm((p) => ({ ...p, maxQuantity: Number(e.target.value) }))}
                      className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-m mb-1.5">Discount %</label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={form.discountPct}
                      onChange={(e) => setForm((p) => ({ ...p, discountPct: Number(e.target.value) }))}
                      className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-m mb-1.5">Expires (hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={form.expiresInHours}
                      onChange={(e) => setForm((p) => ({ ...p, expiresInHours: Number(e.target.value) }))}
                      className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button onClick={() => setStep(1)} className="btn btn-ghost px-4">← Back</button>
                  <button onClick={handleCreate} disabled={loading} className="btn btn-primary px-6 flex items-center gap-2">
                    {loading ? 'Creating...' : 'Create & Get Code'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && created && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="font-display text-xl font-bold text-text-p">Group Order Created!</h4>
                <p className="text-sm text-text-m">Share this fulfillment code with buyers:</p>
                <div className="bg-midnight border border-brass/30 rounded-xl p-4 flex items-center justify-center gap-3">
                  <code className="text-2xl font-mono font-bold text-brass tracking-widest">{created.fulfillmentCode}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(created.fulfillmentCode)
                      toast.success('Copied!')
                    }}
                    className="p-2 hover:bg-brass/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-5 h-5 text-brass" />
                  </button>
                </div>
                <p className="text-xs text-text-d">
                  Target: {created.targetQuantity} buyers · Expires: {new Date(created.expiresAt).toLocaleString()}
                </p>
                <button onClick={reset} className="btn btn-primary px-8">Done</button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
