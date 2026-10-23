import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { KeyRound, Loader2, CreditCard } from 'lucide-react'
import { orderApi } from '../../../api/v21.js'
import { paymentApi } from '../../../api/index.js'
import { Badge, Card } from '../../../components/ui/index.jsx'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { getRegionLabel } from '../../../config/regions.js'
import { formatNaira } from '../../../utils/index.js'

const STATUS_COLOR = { PENDING: 'amber', PAID: 'blue', CONFIRMED: 'blue', DISPATCHED: 'purple', DELIVERED: 'green', CANCELLED: 'red' }
const STATUS_TEXT = {
  PENDING: 'Waiting for payment', PAID: 'Paid. Waiting for the seller', CONFIRMED: 'Seller confirmed',
  DISPATCHED: 'On the way', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', PROCESSING: 'Being prepared',
}
const frame = 'max-w-3xl mx-auto px-4 md:px-6 py-8'

export function MyOrdersPage() {
  const query = useQuery({ queryKey: ['my-orders'], queryFn: () => orderApi.mine().then((r) => r.data.data) })
  return (
    <div className={frame}>
      <PageHeader eyebrow="Gimbiya Mall" title="My orders" description="Everything you bought, with handover codes for items still on the way." />
      <QueryState query={query} isEmpty={(d) => !d?.length} empty={{ title: 'No orders yet', description: 'Browse the marketplace to place your first order.' }}>
        {(orders) => <div className="space-y-2">{orders.map((o) => (
          <Link key={o.orderRef} to={`/orders/${o.orderRef}/status`}>
            <Card hover className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-mono text-sm text-text-p">{o.orderRef}</p><p className="text-xs text-text-m">{getRegionLabel(o.assignedState)} · {o.itemCount} item(s) · {new Date(o.createdAt).toLocaleDateString()}</p></div>
              <div className="flex items-center gap-3"><span className="font-bold text-brass">{formatNaira(o.grossTotalKobo)}</span><Badge color={STATUS_COLOR[o.status] || 'muted'}>{STATUS_TEXT[o.status] || o.status}</Badge></div>
            </Card>
          </Link>
        ))}</div>}
      </QueryState>
    </div>
  )
}

export function OrderStatusPage() {
  const { orderRef } = useParams()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const query = useQuery({
    queryKey: ['order', orderRef],
    queryFn: () => orderApi.byRef(orderRef).then((r) => r.data.data),
    // Payment confirmation arrives by webhook, so keep checking until the order is settled.
    refetchInterval: (q) => (['DELIVERED', 'CANCELLED'].includes(q.state.data?.status) ? false : 8000),
  })
  useEffect(() => { qc.invalidateQueries({ queryKey: ['my-orders'] }) }, [query.data?.status])

  const pay = async (order) => {
    setBusy(true)
    try {
      const { data } = await paymentApi.initiate({ orderId: order.orderId, paymentMethod: 'ACCOUNT_TRANSFER' })
      window.location.href = data.checkoutUrl
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not start payment')
      setBusy(false)
    }
  }
  const cancel = async () => {
    setBusy(true)
    try { await orderApi.cancel(orderRef); toast.success('Order cancelled'); qc.invalidateQueries({ queryKey: ['order', orderRef] }) }
    catch (error) { toast.error(error?.response?.data?.message || 'Could not cancel') }
    finally { setBusy(false) }
  }

  return (
    <div className={frame}>
      <QueryState query={query}>
        {(order) => (
          <>
            <PageHeader eyebrow={`Order ${order.orderRef}`} title={STATUS_TEXT[order.status] || order.status}
              description={`${getRegionLabel(order.assignedState)} · deliver to ${order.shippingAddress}`}
              actions={<Link to="/orders" className="btn btn-ghost btn-sm">All orders</Link>} />

            {order.status === 'PENDING' && (
              <Card className="mb-4 border-brass/30 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm text-text-p">Pay {formatNaira(order.grossTotalKobo)} to confirm this order.</p>
                  {order.reservationExpiresAt && <p className="text-xs text-text-m">Items are held until {new Date(order.reservationExpiresAt).toLocaleTimeString()}.</p>}</div>
                <div className="flex gap-2">
                  <button className="btn btn-primary" disabled={busy} onClick={() => pay(order)}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Pay now</button>
                  <button className="btn btn-ghost" disabled={busy} onClick={cancel}>Cancel order</button>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {order.groups.map((group) => (
                <Card key={group.fulfillmentGroupId} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><p className="text-sm font-medium text-text-p">{group.sellerName}</p><p className="text-xs text-text-m">{group.groupType === 'SERVICE' ? 'Service' : 'Products'}</p></div>
                    <div className="flex items-center gap-2"><span className="text-sm text-brass">{formatNaira(group.amountKobo)}</span><Badge color={STATUS_COLOR[group.status] || 'muted'}>{STATUS_TEXT[group.status] || group.status}</Badge></div>
                  </div>
                  <ul className="text-xs text-text-m list-disc pl-4">{group.items.map((item, i) => <li key={i}>{item.productName || item.serviceType} {item.quantity > 1 ? `x${item.quantity}` : ''}</li>)}</ul>
                  {group.handoverCode && (
                    <div className="p-3 bg-midnight border border-border rounded-btn flex items-center justify-between">
                      <div>
                        <p className="text-xs text-text-m">{group.groupType === 'SERVICE' ? 'Give this code to the provider when the job is done' : 'Give this code to the rider when this part arrives'}</p>
                        <p className="font-mono text-2xl tracking-[0.4em] text-brass">{group.handoverCode}</p>
                      </div>
                      <KeyRound className="w-5 h-5 text-text-d" />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <Card className="mt-4 text-sm space-y-1">
              <Line label="Platform fee" value={order.platformFeeKobo} />
              <Line label="Delivery" value={order.deliveryFeeKobo} />
              <div className="flex justify-between border-t border-border pt-2 font-bold"><span>Total</span><span className="text-brass">{formatNaira(order.grossTotalKobo)}</span></div>
            </Card>
          </>
        )}
      </QueryState>
    </div>
  )
}

function Line({ label, value }) {
  return <div className="flex justify-between text-text-m"><span>{label}</span><span>{formatNaira(value)}</span></div>
}
