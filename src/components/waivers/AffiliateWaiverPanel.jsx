import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ticket, Send, CheckCircle, Clock, Copy, CreditCard,
  X,
} from 'lucide-react'
import { waiverApi, orderApi } from '../../api/index.js'
import toast from 'react-hot-toast'

export default function AffiliateWaiverPanel() {
  const qc = useQueryClient()
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [targetIds, setTargetIds] = useState('')
  const [reason, setReason] = useState('')

  const { data: couponsData } = useQuery({
    queryKey: ['my-coupons'],
    queryFn: () => waiverApi.myCoupons().then((r) => r.data),
  })

  const requestMut = useMutation({
    mutationFn: (data) => waiverApi.submitRequest(data),
    onSuccess: () => {
      toast.success('Waiver request submitted to coordinator')
      setShowRequestForm(false)
      setTargetIds('')
      setReason('')
      qc.invalidateQueries(['my-coupons'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const handleSubmitRequest = () => {
    const ids = targetIds.split(',').map((s) => s.trim()).filter(Boolean)
    if (!ids.length) return toast.error('Enter at least one user ID')
    requestMut.mutate({ targetUserIds: ids, requestedSlots: ids.length, reason })
  }

  const coupons = couponsData?.coupons || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-text-p">My Fulfillment Coupons</h3>
          <p className="text-xs text-text-m">Waiver-based group buying for your buyers</p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 transition-all"
        >
          <Send className="w-4 h-4" /> Request Waiver
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon._id} className="bg-surface-l border border-border rounded-xl p-4 hover:border-brass/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brass" />
                <code className="text-lg font-mono font-bold text-brass tracking-wider">{coupon.code}</code>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                coupon.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                coupon.status === 'EXHAUSTED' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {coupon.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-midnight/30 rounded-lg p-2 text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Slots</p>
                <p className="text-sm font-bold text-text-p">{coupon.usedSlots}/{coupon.totalSlots}</p>
              </div>
              <div className="bg-midnight/30 rounded-lg p-2 text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Budget</p>
                <p className="text-sm font-bold text-text-p">₦{((coupon.budgetKobo || 0) / 100).toLocaleString()}</p>
              </div>
              <div className="bg-midnight/30 rounded-lg p-2 text-center">
                <p className="text-[10px] font-mono text-text-d uppercase">Expires</p>
                <p className="text-sm font-bold text-text-p">{new Date(coupon.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(coupon.code)
                  toast.success('Code copied')
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface-h border border-border rounded-lg text-xs font-medium text-text-m hover:text-text-p transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>
              <button
                onClick={() => {
                  setSelectedCoupon(coupon)
                  setShowPayModal(true)
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brass/10 border border-brass/30 rounded-lg text-xs font-medium text-brass hover:bg-brass/20 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" /> Pay Orders
              </button>
            </div>
          </div>
        ))}
      </div>

      {coupons.length === 0 && !showRequestForm && (
        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <Ticket className="w-10 h-10 text-text-d mx-auto mb-3" />
          <p className="text-text-m text-sm">No fulfillment coupons yet</p>
          <p className="text-text-d text-xs mt-1">Request a waiver from your coordinator</p>
        </div>
      )}

      <AnimatePresence>
        {showRequestForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRequestForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-surface-l border border-border rounded-xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display font-bold text-text-p">Request Waiver</h4>
                <button onClick={() => setShowRequestForm(false)} className="p-1 hover:bg-surface-h rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Buyer Public IDs (comma-separated)</label>
                  <textarea
                    value={targetIds}
                    onChange={(e) => setTargetIds(e.target.value)}
                    rows={3}
                    className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none font-mono"
                    placeholder="6a63e69d2477d7c9a0c30693, 6a63e69d2477d7c9a0c30694"
                  />
                  <p className="text-[10px] text-text-d mt-1">Paste the public unique IDs of buyers you want to cover</p>
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-m mb-1.5 uppercase">Reason / Note</label>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none"
                    placeholder="Why do these buyers need waiver coverage?"
                  />
                </div>
                <button
                  onClick={handleSubmitRequest}
                  disabled={requestMut.isPending}
                  className="w-full py-2.5 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 disabled:opacity-50"
                >
                  {requestMut.isPending ? 'Submitting...' : 'Submit to Coordinator'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayModal && selectedCoupon && (
          <CouponPayModal coupon={selectedCoupon} onClose={() => setShowPayModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function CouponPayModal({ coupon, onClose }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['coupon-orders', coupon.code],
    queryFn: () => orderApi.getByCoupon(coupon.code).then((r) => r.data),
  })

  const payMut = useMutation({
    mutationFn: () => orderApi.bulkFulfillmentPay({ couponCode: coupon.code }),
    onSuccess: (res) => {
      toast.success(res.data.message)
      qc.invalidateQueries(['coupon-orders', coupon.code])
      qc.invalidateQueries(['my-coupons'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Payment failed'),
  })

  const pendingOrders = data?.orders?.filter((o) => o.status === 'PENDING' || o.status === 'AWAITING_FULFILLMENT_PAYMENT') || []
  const pendingTotal = pendingOrders.reduce((s, o) => s + (o.grossTotalKobo || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-surface-l border border-border rounded-xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h4 className="font-display font-bold text-text-p">Pay Orders — {coupon.code}</h4>
          <button onClick={onClose} className="p-1 hover:bg-surface-h rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-text-m">Loading...</div>
        ) : (
          <>
            <div className="flex items-center justify-between bg-midnight/30 rounded-lg p-3 mb-4 shrink-0">
              <div className="text-sm">
                <span className="text-text-m">Pending orders:</span>{' '}
                <span className="font-bold text-text-p">{pendingOrders.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-text-m">Total due:</span>{' '}
                <span className="font-bold text-brass">₦{(pendingTotal / 100).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {data?.orders?.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-midnight/20 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-text-p">{order.userId?.name || 'Unknown'}</p>
                    <p className="text-xs text-text-m">{order.userId?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-p">₦{((order.grossTotalKobo || 0) / 100).toLocaleString()}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      order.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {pendingOrders.length > 0 && (
              <button
                onClick={() => payMut.mutate()}
                disabled={payMut.isPending}
                className="w-full py-3 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {payMut.isPending ? 'Processing...' : `Pay ₦${(pendingTotal / 100).toLocaleString()} for ${pendingOrders.length} Orders`}
              </button>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
