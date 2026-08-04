import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, MapPin, Plus, Minus, Ticket } from 'lucide-react'
import { productApi, orderApi } from '../../api/index.js'
import { useAuthStore } from '../../store/authStore.js'
import toast from 'react-hot-toast'

export default function AffiliateShop() {
  const { user } = useAuthStore()
  const [selectedState, setSelectedState] = useState(user?.assignedState || 'Kano')
  const [selectedFloor, setSelectedFloor] = useState('LEVEL_1')
  const [cart, setCart] = useState([])
  const [couponCode, setCouponCode] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)

  const { data: catalog } = useQuery({
    queryKey: ['affiliate-shop', selectedState, selectedFloor],
    queryFn: () => productApi.getCatalog({ assignedState: selectedState, buildingFloor: selectedFloor, limit: 50 }).then((r) => r.data),
  })

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id)
      if (existing) {
        return prev.map((i) => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product._id, name: product.name, priceKobo: product.priceKobo, quantity: 1 }]
    })
    toast.success(`${product.name} added to cart`)
  }

  const updateQty = (productId, delta) => {
    setCart((prev) => prev.map((i) => {
      if (i.productId === productId) {
        const newQty = Math.max(1, i.quantity + delta)
        return { ...i, quantity: newQty }
      }
      return i
    }))
  }

  const cartTotal = cart.reduce((s, i) => s + (i.priceKobo * i.quantity), 0)

  const handleCheckout = async () => {
    if (!cart.length) return toast.error('Cart is empty')
    try {
      await orderApi.checkout({
        items: cart,
        assignedState: selectedState,
        fulfillmentCouponCode: couponCode || undefined,
        affiliateReferralCode: user?.referralCode,
      })
      toast.success('Order placed successfully!')
      setCart([])
      setShowCheckout(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-surface-l border border-border rounded-xl p-4">
        <ShoppingBag className="w-5 h-5 text-brass" />
        <div className="flex items-center gap-2">
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p">
            <option value="Abuja">Abuja</option>
            <option value="Kano">Kano</option>
            <option value="Kaduna">Kaduna</option>
          </select>
          <select value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value)} className="bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p">
            <option value="LEVEL_1">Level 1</option>
            <option value="LEVEL_2">Level 2</option>
          </select>
        </div>
        {cart.length > 0 && (
          <button onClick={() => setShowCheckout(true)} className="ml-auto flex items-center gap-2 px-4 py-2 bg-brass text-midnight rounded-lg text-sm font-bold">
            <ShoppingBag className="w-4 h-4" /> Cart ({cart.length}) — ₦{(cartTotal / 100).toLocaleString()}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog?.products?.map((product) => (
          <div key={product._id} className="bg-surface-l border border-border rounded-xl overflow-hidden hover:border-brass/30 transition-colors">
            <div className="h-40 bg-surface-h flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-text-d" />
            </div>
            <div className="p-4">
              <h4 className="font-medium text-text-p mb-1">{product.name}</h4>
              <p className="text-sm text-brass font-bold mb-3">₦{(product.priceKobo / 100).toLocaleString()}</p>
              <button onClick={() => addToCart(product)} className="w-full py-2 bg-brass/10 border border-brass/30 rounded-lg text-brass text-sm font-medium hover:bg-brass/20 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckout(false)}>
          <div className="bg-surface-l border border-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-text-p mb-4">Checkout</h3>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-2 bg-midnight/30 rounded-lg">
                  <div>
                    <p className="text-sm text-text-p">{item.name}</p>
                    <p className="text-xs text-text-m">₦{(item.priceKobo / 100).toLocaleString()} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.productId, -1)} className="p-1 hover:bg-surface-h rounded"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="p-1 hover:bg-surface-h rounded"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-mono text-text-m mb-1.5 uppercase flex items-center gap-1">
                <Ticket className="w-3 h-3" /> Fulfillment Coupon (optional)
              </label>
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="FUL-XXXXXX" className="w-full bg-midnight border border-border rounded-lg px-4 py-2.5 text-sm text-text-p font-mono uppercase focus:border-brass outline-none" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-m">Total:</span>
              <span className="text-xl font-bold text-brass">₦{(cartTotal / 100).toLocaleString()}</span>
            </div>
            <button onClick={handleCheckout} className="w-full py-3 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90">
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
