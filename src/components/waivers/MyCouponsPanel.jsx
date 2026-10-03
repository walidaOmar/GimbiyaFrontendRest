import { useEffect, useState } from 'react'
import api from '../../api/index.js'
import { Card, Badge } from '../ui/index.jsx'
import toast from 'react-hot-toast'

const STATUS_COLOR = { ACTIVE: 'green', EXHAUSTED: 'muted', EXPIRED: 'red', REVOKED: 'red' }

export function MyCouponsPanel() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/waivers/my-coupons')
      .then((res) => setCoupons(Array.isArray(res.data.coupons) ? res.data.coupons : []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load coupons'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-xs text-text-m">Loading your coupons...</p>
  if (coupons.length === 0) return <p className="text-xs text-text-m">No coupons issued yet.</p>

  return (
    <div className="flex flex-col gap-2">
      {coupons.map((coupon) => (
        <Card key={coupon._id} className="flex items-center justify-between gap-3 p-3">
          <div>
            <p className="font-mono text-sm font-semibold">{coupon.code}</p>
            <p className="text-xs text-text-m">{coupon.claimedBy?.length || 0}/{coupon.totalSlots} claimed</p>
          </div>
          <Badge color={STATUS_COLOR[coupon.status] || 'muted'}>{coupon.status}</Badge>
        </Card>
      ))}
    </div>
  )
}
