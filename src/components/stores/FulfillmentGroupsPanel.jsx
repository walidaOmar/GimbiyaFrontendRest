import { useEffect, useState } from 'react'
import { Package, CheckCircle2, Clock } from 'lucide-react'
import api from '../../api/index.js'
import { Card, Badge } from '../ui/index.jsx'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  PENDING: 'amber', CONFIRMED: 'blue', PROCESSING: 'purple',
  DISPATCHED: 'purple', DELIVERED: 'green', CANCELLED: 'red', DISPUTED: 'red',
}

/** Merchant-side view of their portion of multi-merchant orders. */
export function FulfillmentGroupsPanel() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/cart-v2/fulfillment-groups/mine')
      .then((res) => setGroups(Array.isArray(res.data.data) ? res.data.data : []))
      .catch((err) => {
        setGroups([])
        toast.error(err.response?.data?.message || 'Could not load fulfillment groups')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const confirm = async (groupId) => {
    try {
      await api.post(`/cart-v2/fulfillment-groups/${groupId}/confirm`)
      toast.success('Confirmed. Escrow locked for your part of this order.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm')
    }
  }

  if (loading) return <p className="text-xs text-text-m">Loading your fulfillment groups...</p>
  if (groups.length === 0) return <p className="text-xs text-text-m">No pending fulfillment groups right now.</p>

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
        <Card key={group._id} className="flex items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <Package className="h-4 w-4 shrink-0 text-text-m" />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {group.groupType === 'SERVICE' ? 'Service order' : `${group.items?.length || 0} item(s)`}
              </p>
              <p className="truncate font-mono text-xs text-text-m">Order {group.orderId?.orderRef || group.orderId}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge color={STATUS_COLOR[group.status] || 'muted'}>{group.status}</Badge>
            {group.status === 'PENDING' ? (
              <button
                type="button"
                onClick={() => confirm(group._id)}
                className="flex items-center gap-1 rounded bg-brass px-3 py-1.5 text-xs font-medium text-midnight hover:brightness-110"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
              </button>
            ) : <Clock className="h-3.5 w-3.5 text-text-m" />}
          </div>
        </Card>
      ))}
    </div>
  )
}
