import { useEffect, useState } from 'react'
import api from '../../api/index.js'
import { Card, Badge } from '../ui/index.jsx'
import toast from 'react-hot-toast'

export function QuotaOverviewTable({ refreshKey }) {
  const [quotas, setQuotas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/waivers/quotas')
      .then((res) => setQuotas(Array.isArray(res.data.quotas) ? res.data.quotas : []))
      .catch((err) => {
        setQuotas([])
        toast.error(err.response?.data?.message || 'Could not load waiver quotas')
      })
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <p className="text-xs text-text-m">Loading waiver quotas...</p>
  if (quotas.length === 0) return <p className="text-xs text-text-m">No quotas allocated yet.</p>

  return (
    <div className="flex flex-col gap-2">
      {quotas.map((quota) => {
        const remaining = quota.totalSlots - quota.usedSlots
        const isExpired = new Date(quota.expiresAt) < new Date()
        return (
          <Card key={quota._id} className="flex items-center justify-between gap-3 p-3">
            <div>
              <p className="text-sm font-medium">{quota.coordinatorId?.name}</p>
              <p className="text-xs text-text-m">{quota.coordinatorId?.assignedState} - allocated by {quota.allocatedBy?.name}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">{remaining}/{quota.totalSlots} left</p>
              <Badge color={isExpired ? 'red' : 'green'}>{isExpired ? 'Expired' : 'Active'}</Badge>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
