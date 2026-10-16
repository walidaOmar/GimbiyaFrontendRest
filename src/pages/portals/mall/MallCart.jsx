import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingCart, CreditCard, Loader2, Wrench, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { cartV2Api, paymentApi, serviceCatalogApi } from '../../../api/index.js'
import { useCartV2 } from '../../../store/cartV2Store.js'
import { useAuthStore } from '../../../store/authStore.js'
import { Card, Badge, Modal } from '../../../components/ui/index.jsx'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { STATE_OPTIONS } from '../../../config/regions.js'
import { formatNaira } from '../../../utils/index.js'

const apiMsg = (error, fallback) => error?.response?.data?.message || fallback

export default function MallCart() {
  const user = useAuthStore((state) => state.user)
  const cart = useCartV2()
  const [address, setAddress] = useState('')
  const [node, setNode] = useState(user?.assignedState && user.assignedState !== 'Global' ? user.assignedState : STATE_OPTIONS[0].value)
  const [busy, setBusy] = useState(false)
  const [otps, setOtps] = useState(null)
  const [servicesFor, setServicesFor] = useState(null)

  useEffect(() => {
    if (user?._id) cart.bindUser(user._id)
  }, [user?._id])

  const syncItems = async () => {
    for (const item of cart.items) {
      const { data } = await cartV2Api.addItem({ productId: item.productId, quantity: item.quantity })
      cart.setCartItemId(item.productId, data.data._id)
    }
    for (const item of useCartV2.getState().items) {
      for (const service of item.services.filter((entry) => !entry.synced)) {
        await cartV2Api.addService(item.cartItemId, service.offeringId)
        cart.markServiceSynced(item.productId, service.offeringId)
      }
    }
  }

  const checkout = async () => {
    if (!address.trim()) return toast.error('Enter a delivery address')
    setBusy(true)
    try {
      await syncItems()
      const { data } = await cartV2Api.checkout({ shippingAddress: address.trim(), assignedState: node })
      const { order, groupOtpSummary } = data.data
      cart.clear()
      setOtps({ order, groups: groupOtpSummary || [] })
      toast.success('Order created. Complete payment to confirm it.')
    } catch (error) {
      toast.error(apiMsg(error, 'Checkout failed'))
    } finally {
      setBusy(false)
    }
  }

  const pay = async () => {
    setBusy(true)
    try {
      const { data } = await paymentApi.initiate({ orderId: otps.order._id, paymentMethod: 'ACCOUNT_TRANSFER' })
      window.location.href = data.checkoutUrl
    } catch (error) {
      toast.error(apiMsg(error, 'Could not start payment'))
      setBusy(false)
    }
  }

  if (user?._id && cart.ownerId !== user._id) {
    return <div className="max-w-4xl"><PageHeader eyebrow="Gimbiya Mall" title="Your cart" /><Card className="text-sm text-text-m">Loading your saved cart…</Card></div>
  }

  if (!cart.items.length && !otps) {
    return (
      <div>
        <PageHeader eyebrow="Gimbiya Mall" title="Your cart" />
        <Card className="text-center py-12">
          <ShoppingCart className="w-10 h-10 text-text-d mx-auto mb-3" />
          <p className="text-text-m">Your cart is empty.</p>
          <Link to="/marketplace" className="btn btn-primary mt-5 inline-flex">Browse the marketplace</Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Gimbiya Mall" title="Your cart" description="Items from different merchants are split into separate fulfillment groups, each with its own delivery code." />

      {!otps && <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <Card key={item.productId} className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-p truncate">{item.name}</p>
                <p className="text-xs text-text-m">{formatNaira(item.priceKobo)} each</p>
                {item.services.map((service) => (
                  <Badge key={service.offeringId} color="blue">
                    {service.serviceType} · {formatNaira(service.priceKobo)}
                    <button className="ml-2" aria-label="Remove service" onClick={() => cart.removeService(item.productId, service.offeringId)}>×</button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-icon" aria-label="Decrease" onClick={() => cart.setQty(item.productId, item.quantity - 1)}><Minus className="w-4 h-4" /></button>
                <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                <button className="btn-icon" aria-label="Increase" onClick={() => cart.setQty(item.productId, item.quantity + 1)}><Plus className="w-4 h-4" /></button>
                <button className="btn-icon" title="Add a service" onClick={() => setServicesFor(item)}><Wrench className="w-4 h-4" /></button>
                <button className="btn-icon !text-danger" aria-label="Remove" onClick={() => cart.remove(item.productId)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="h-fit space-y-4">
          <div>
            <label className="input-label">Delivery node</label>
            <select className="input w-full" value={node} onChange={(event) => setNode(event.target.value)}>
              {STATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Delivery address</label>
            <textarea className="input w-full resize-none" rows={3} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, landmark, phone" />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-text-m text-sm">Total</span>
            <span className="font-display text-xl font-bold text-brass">{formatNaira(cart.total())}</span>
          </div>
          <p className="text-[11px] text-text-d">Stock is reserved when you place the order. Unpaid orders are released after 30 minutes.</p>
          <button className="btn btn-primary w-full" disabled={busy} onClick={checkout}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Place order'}
          </button>
        </Card>
      </div>}

      {otps && (
        <Card className="space-y-4">
          <div>
            <p className="section-label">Order {otps.order.orderRef}</p>
            <h2 className="font-display text-xl font-bold">Save your delivery codes</h2>
            <p className="text-sm text-text-m mt-1">Give each code to the rider only when that part of your order arrives. They are shown once.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {otps.groups.map((group, index) => (
              <div key={group.fulfillmentGroupId} className="p-3 bg-midnight border border-border rounded-btn flex items-center justify-between">
                <div><p className="text-xs text-text-m">{group.groupType === 'SERVICE' ? 'Service' : 'Merchant'} group {index + 1}</p><p className="font-mono text-2xl tracking-[0.4em] text-brass">{group.rawOtp}</p></div>
                <KeyRound className="w-5 h-5 text-text-d" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={pay}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Pay {formatNaira(otps.order.grossTotalKobo)}</button>
            <Link to="/dashboard/mall" className="btn btn-ghost">Pay later</Link>
          </div>
        </Card>
      )}

      <ServicePicker item={servicesFor} node={node} onClose={() => setServicesFor(null)} onPick={(service) => { cart.addService(servicesFor.productId, service); setServicesFor(null) }} />
    </div>
  )
}

function ServicePicker({ item, node, onClose, onPick }) {
  const query = useQuery({
    queryKey: ['service-offerings', node],
    queryFn: () => serviceCatalogApi.offerings({ assignedState: node }).then((response) => response.data),
    enabled: Boolean(item),
  })
  const offerings = query.data?.data || []
  return (
    <Modal open={Boolean(item)} onClose={onClose} title={`Add a service to ${item?.name || ''}`}>
      <QueryState query={query} isEmpty={(data) => !(data?.data || []).length} empty={{ title: 'No services available at this node.' }}>
        {(data) => (
          <div className="space-y-2">
            {(data.data || []).map((offering) => (
              <button key={offering._id} onClick={() => onPick({ offeringId: offering._id, serviceType: offering.serviceType, priceKobo: offering.priceKobo })}
                className="w-full flex items-center justify-between p-3 border border-border rounded-btn hover:border-brass/40 text-left">
                <span className="text-sm text-text-p">{offering.serviceType}</span>
                <span className="text-sm text-brass">{formatNaira(offering.priceKobo)}</span>
              </button>
            ))}
          </div>
        )}
      </QueryState>
    </Modal>
  )
}
