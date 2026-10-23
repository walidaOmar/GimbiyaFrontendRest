import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingCart, Loader2, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import { cartV2Api } from '../../../api/index.js'
import { orderApi } from '../../../api/v21.js'
import { useCartV2 } from '../../../store/cartV2Store.js'
import { useAuthStore } from '../../../store/authStore.js'
import { Card, Badge } from '../../../components/ui/index.jsx'
import { PageHeader } from '../../../components/ui/Polish.jsx'
import { getRegionLabel } from '../../../config/regions.js'
import { formatNaira } from '../../../utils/index.js'

const apiMsg = (error, fallback) => error?.response?.data?.message || fallback
const storedRef = () => { try { return localStorage.getItem('affiliateRef') || '' } catch { return '' } }

export default function MallCart() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const cart = useCartV2()
  const [address, setAddress] = useState('')
  const [busy, setBusy] = useState(false)
  const [quote, setQuote] = useState(null)

  useEffect(() => { if (user?._id) cart.bindUser(user._id) }, [user?._id])
  // Any change to the cart makes the old exact price stale.
  const signature = cart.items.map((item) => `${item.productId}:${item.quantity}:${item.services.length}`).join('|')
  useEffect(() => { setQuote(null) }, [signature])

  const node = cart.items[0]?.assignedState

  // Makes the saved (server) cart match what is on screen, then asks the server for the exact price.
  const syncAndQuote = async () => {
    const { data: server } = await cartV2Api.getCart()
    const local = new Set(useCartV2.getState().items.map((item) => item.productId))
    for (const row of server.data?.items || []) {
      const productId = row.productId?._id || row.productId
      if (!local.has(productId)) await cartV2Api.removeItem(row._id)
    }
    for (const item of useCartV2.getState().items) {
      const { data } = await cartV2Api.addItem({ productId: item.productId, quantity: item.quantity })
      cart.setCartItemId(item.productId, data.data._id)
    }
    for (const item of useCartV2.getState().items) {
      for (const service of item.services.filter((entry) => !entry.synced)) {
        await cartV2Api.addService(item.cartItemId, service.offeringId)
        cart.markServiceSynced(item.productId, service.offeringId)
      }
    }
    const { data } = await orderApi.quote(storedRef())
    return data.data
  }

  const review = async () => {
    setBusy(true)
    try { setQuote(await syncAndQuote()) } catch (error) { toast.error(apiMsg(error, 'Could not price your cart')) } finally { setBusy(false) }
  }

  const placeOrder = async () => {
    if (address.trim().length < 5) return toast.error('Enter a delivery address')
    setBusy(true)
    try {
      const { data } = await cartV2Api.checkout({ shippingAddress: address.trim(), affiliateReferralCode: storedRef() || undefined })
      cart.clear()
      toast.success('Order placed. Pay to confirm it.')
      navigate(`/orders/${data.data.order.orderRef}/status`)
    } catch (error) {
      toast.error(apiMsg(error, 'Checkout failed'))
      setBusy(false)
    }
  }

  if (user?._id && cart.ownerId !== user._id) {
    return <div className="max-w-4xl"><PageHeader eyebrow="Gimbiya Mall" title="Your cart" /><Card className="text-sm text-text-m">Loading your saved cart…</Card></div>
  }

  if (!cart.items.length) {
    return (
      <div className="max-w-4xl">
        <PageHeader eyebrow="Gimbiya Mall" title="Your cart" />
        <Card className="text-center py-12">
          <ShoppingCart className="w-10 h-10 text-text-d mx-auto mb-3" />
          <p className="text-text-m">Your cart is empty.</p>
          <div className="flex justify-center gap-2 mt-5">
            <Link to="/marketplace" className="btn btn-primary inline-flex">Browse the marketplace</Link>
            <Link to="/orders" className="btn btn-ghost inline-flex">My orders</Link>
          </div>
        </Card>
      </div>
    )
  }

  const issueFor = (item) => quote?.items?.find((row) => row.cartItemId === item.cartItemId)?.issue

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Gimbiya Mall" title="Your cart" description={`Items from different sellers are split into separate parts, each with its own handover code.${node ? ` Shopping in ${getRegionLabel(node)}.` : ''}`}
        actions={<button className="btn btn-ghost btn-sm" onClick={() => cart.clear()}>Clear cart</button>} />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => {
            const issue = issueFor(item)
            return (
              <Card key={item.productId} className={`flex flex-wrap items-center gap-4 ${issue ? 'border-danger/40' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-p truncate">{item.name}</p>
                  <p className="text-xs text-text-m">{formatNaira(item.priceKobo)} each{item.minimumOrderQuantity > 1 ? ` · minimum ${item.minimumOrderQuantity}` : ''}</p>
                  {issue && <p className="text-xs text-danger mt-1">{issue}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.services.map((service) => (
                      <Badge key={service.offeringId} color="blue">
                        {service.serviceType} · {formatNaira(service.priceKobo)}
                        <button className="ml-2" aria-label="Remove service" onClick={() => cart.removeService(item.productId, service.offeringId)}>×</button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-icon" aria-label="Decrease" onClick={() => cart.setQty(item.productId, item.quantity - 1)}><Minus className="w-4 h-4" /></button>
                  <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                  <button className="btn-icon" aria-label="Increase" onClick={() => cart.setQty(item.productId, item.quantity + 1)}><Plus className="w-4 h-4" /></button>
                  <Link to="/marketplace" className="btn-icon" title="Find a service to add"><Wrench className="w-4 h-4" /></Link>
                  <button className="btn-icon !text-danger" aria-label="Remove" onClick={() => cart.remove(item.productId)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="h-fit space-y-4">
          <div>
            <label className="input-label">Delivery address</label>
            <textarea className="input w-full resize-none" rows={3} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, landmark, phone" />
          </div>

          {quote ? (
            <div className="space-y-1.5 border-t border-border pt-3 text-sm">
              <Row label="Products" value={quote.totals.productsKobo} />
              {quote.totals.servicesKobo > 0 && <Row label="Services" value={quote.totals.servicesKobo} />}
              <Row label={`Platform fee (${quote.totals.platformFeePct}%)`} value={quote.totals.feeKobo} />
              <Row label={`Delivery (${quote.groupCount} part${quote.groupCount === 1 ? '' : 's'})`} value={quote.totals.deliveryFeeKobo} />
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-text-m">Total</span>
                <span className="font-display text-xl font-bold text-brass">{formatNaira(quote.totals.grossTotalKobo)}</span>
              </div>
              {quote.referralApplied && <p className="text-[11px] text-success">Referral applied.</p>}
              {quote.issues?.length > 0 && <p className="text-[11px] text-danger">Fix the items marked above before you can order.</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-text-m text-sm">Items</span>
              <span className="font-display text-lg font-bold text-text-p">{formatNaira(cart.total())}</span>
            </div>
          )}
          <p className="text-[11px] text-text-d">Fees and delivery are added when you review. Stock is held for 30 minutes after you place the order.</p>

          {!quote
            ? <button className="btn btn-primary w-full" disabled={busy} onClick={review}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Review exact total'}</button>
            : <button className="btn btn-primary w-full" disabled={busy || quote.issues?.length > 0} onClick={placeOrder}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : `Place order · ${formatNaira(quote.totals.grossTotalKobo)}`}</button>}
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between"><span className="text-text-m">{label}</span><span>{formatNaira(value)}</span></div>
}
