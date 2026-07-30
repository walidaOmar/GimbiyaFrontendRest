import { useState } from 'react'
import { Ticket, CheckCircle } from 'lucide-react'
import { waiverApi } from '../../api/index.js'
import toast from 'react-hot-toast'

export function CartCouponInput({ onApplied }) {
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState(null)
  const [validating, setValidating] = useState(false)

  const handleApply = async () => {
    if (!code.trim()) return
    setValidating(true)
    try {
      const res = await waiverApi.validateCoupon(code.trim())
      setApplied(res.data.coupon)
      onApplied?.(code.trim())
      toast.success(`Coupon ${code.trim().toUpperCase()} applied!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon')
      setApplied(null)
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="bg-surface-l border border-border rounded-xl p-4">
      <p className="text-xs font-mono text-text-m uppercase tracking-wider mb-2">Fulfillment Coupon</p>
      {applied ? (
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{applied.code} — {applied.remainingSlots} slots left</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter FUL-XXXXXX"
            className="flex-1 bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p font-mono uppercase focus:border-brass outline-none"
          />
          <button
            onClick={handleApply}
            disabled={validating}
            className="px-4 py-2.5 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 disabled:opacity-50 flex items-center gap-2"
          >
            <Ticket className="w-4 h-4" /> {validating ? '...' : 'Apply'}
          </button>
        </div>
      )}
    </div>
  )
}
