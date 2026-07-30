import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Search, Users, Package, TrendingDown, Clock, CheckCircle } from 'lucide-react'
import { groupOrderApi } from '../../api/index.js'
import toast from 'react-hot-toast'

export default function FulfillmentCodeInput({ onJoinSuccess }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [groupData, setGroupData] = useState(null)

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    try {
      const res = await groupOrderApi.getByCode(code.trim().toUpperCase())
      setGroupData(res.data.groupOrder)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code')
      setGroupData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (quantity) => {
    setLoading(true)
    try {
      const res = await groupOrderApi.join(code.trim().toUpperCase(), { quantity })
      toast.success(res.data.message)
      onJoinSuccess?.()
      const refreshed = await groupOrderApi.getByCode(code.trim().toUpperCase())
      setGroupData(refreshed.data.groupOrder)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-l border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-brass" />
        </div>
        <div>
          <h3 className="font-display font-bold text-text-p">Smart Group Buying</h3>
          <p className="text-xs text-text-m">Enter a fulfillment code to join a group order</p>
        </div>
      </div>

      <form onSubmit={handleLookup} className="flex gap-3 mb-6">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setGroupData(null)
          }}
          placeholder="Enter fulfillment code (e.g. GRP-A1B2C3)"
          className="flex-1 bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p focus:border-brass outline-none font-mono uppercase"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> {loading ? '...' : 'Lookup'}
        </button>
      </form>

      <AnimatePresence>
        {groupData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GroupOrderCard data={groupData} onJoin={handleJoin} loading={loading} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GroupOrderCard({ data, onJoin, loading }) {
  const [qty, setQty] = useState(1)
  const isExpired = new Date(data.expiresAt) < new Date()
  const isFulfilled = data.status === 'FULFILLED'
  const isFull = data.currentQuantity >= data.maxQuantity

  return (
    <div className="bg-midnight/40 border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-4">
        {data.productImageUrl ? (
          <img src={data.productImageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-surface-h" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-surface-h flex items-center justify-center">
            <Package className="w-6 h-6 text-text-d" />
          </div>
        )}
        <div>
          <h4 className="font-semibold text-text-p">{data.productName}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-m">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {data.currentQuantity}/{data.targetQuantity} joined</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {isExpired ? 'Expired' : 'Active'}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="h-2 bg-surface-h rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.progressPct}%` }}
            className={`h-full rounded-full ${data.progressPct >= 100 ? 'bg-emerald-500' : 'bg-brass'}`}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] font-mono text-text-d">
          <span>{data.progressPct}% to target</span>
          <span>Max: {data.maxQuantity}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-h/50 rounded-lg p-3 text-center">
          <p className="text-[10px] font-mono text-text-d uppercase">Current Discount</p>
          <p className="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1">
            <TrendingDown className="w-4 h-4" /> {data.currentBestDiscount || 0}%
          </p>
        </div>
        <div className="bg-surface-h/50 rounded-lg p-3 text-center">
          <p className="text-[10px] font-mono text-text-d uppercase">Base Price</p>
          <p className="text-lg font-bold text-text-p">₦{(data.basePriceKobo / 100).toLocaleString()}</p>
        </div>
      </div>

      {!isFulfilled && !isExpired && !isFull && (
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-2 bg-midnight rounded-lg px-3 py-2 border border-border">
            <span className="text-xs text-text-m">Qty:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="w-12 bg-transparent text-text-p text-sm text-center outline-none"
            />
          </div>
          <button
            onClick={() => onJoin(qty)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90 transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {loading ? 'Joining...' : 'Join Group Buy'}
          </button>
        </div>
      )}

      {isFulfilled && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm text-center font-medium">
          <CheckCircle className="w-4 h-4 inline mr-1" /> This group order has been fulfilled!
        </div>
      )}

      {isExpired && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center font-medium">
          This group order has expired.
        </div>
      )}
    </div>
  )
}
