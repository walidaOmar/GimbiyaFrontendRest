import { useState }        from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Package, MapPin, CheckCircle,
  Plus, Minus, Trash2, ArrowRight, Copy,
} from 'lucide-react'
import { productApi, orderApi } from '../../api/index.js'
import { useMallStore }         from '../../store/mallStore.js'
import {
  Card, Button, Badge, StatusBadge,
  Modal, Spinner, EmptyState, Skeleton, StatCard,
} from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

const MILESTONES = ['PENDING','CONFIRMED','PROCESSING','DISPATCHED','DELIVERED']

function OrderTracker({ status }) {
  const idx = MILESTONES.indexOf(status)
  return (
    <div className="relative flex items-center justify-between py-2">
      {/* Track line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
      <motion.div
        className="absolute top-1/2 left-0 h-0.5 bg-brass -translate-y-1/2"
        style={{ boxShadow: '0 0 6px #C8A84B' }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, (idx / (MILESTONES.length - 1)) * 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {MILESTONES.map((m, i) => (
        <div key={m} className="relative flex flex-col items-center gap-1.5 z-10">
          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center
            font-mono text-[10px] font-bold transition-all duration-500 ${
            i <= idx
              ? 'bg-brass/20 border-brass text-brass shadow-glow-sm'
              : 'bg-midnight border-border text-text-d'
          }`}>
            {i < idx ? '✓' : i + 1}
          </div>
          <span className={`font-mono text-[8px] tracking-wider ${i <= idx ? 'text-brass' : 'text-text-d'}`}>
            {m.slice(0, 4)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function BuyerDashboard() {
  const qc = useQueryClient()
  const { selectedState, setSelectedState, cartItems, addToCart, removeFromCart, updateCartQty, clearCart, cartTotal } = useMallStore()
  const [floor, setFloor]             = useState('LEVEL_1')
  const [view,  setView]              = useState('shop')  // shop | cart | orders
  const [checkoutModal, setCheckout]  = useState(false)
  const [otpModal, setOtpModal]       = useState(null)
  const [address, setAddress]         = useState('')

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['catalog', selectedState, floor],
    queryFn:  () => productApi.getCatalog({ assignedState: selectedState, buildingFloor: floor, limit: 24 }).then(r => r.data),
    staleTime: 60000,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn:  () => orderApi.history({ limit: 20 }).then(r => r.data),
  })

  const checkoutMut = useMutation({
    mutationFn: (data) => orderApi.checkout(data),
    onSuccess: (res) => {
      setCheckout(false)
      clearCart()
      setOtpModal(res.data)
      toast.success(`Order ${res.data.orderRef} placed! Escrow locked.`)
      qc.invalidateQueries(['buyer-orders'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Checkout failed'),
  })

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }) => orderApi.cancel(id, reason),
    onSuccess: () => { toast.success('Order cancelled'); qc.invalidateQueries(['buyer-orders']) },
    onError:   (err) => toast.error(err.response?.data?.message || 'Cannot cancel at this stage'),
  })

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)
  const totalNaira = cartTotal() / 100

  const handleCheckout = () => {
    if (!address.trim()) { toast.error('Please enter a delivery address'); return }
    checkoutMut.mutate({
      cartItems: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
      shippingAddress: address,
      buyerPhone: '',
    })
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">Consumer Marketplace</p>
          <h1 className="font-display text-3xl font-bold text-text-p">Gimbiya Mall</h1>
        </div>
        <div className="flex gap-2">
          {['shop','cart','orders'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-btn font-mono text-xs uppercase tracking-wide transition-all ${
                view === v ? 'bg-brass text-midnight font-bold' : 'bg-surface border border-border text-text-m hover:text-text-p'
              }`}>
              {v === 'cart' ? `Cart (${cartCount})` : v}
            </button>
          ))}
        </div>
      </div>

      {/* SHOP VIEW */}
      {view === 'shop' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-surface-h border border-border rounded-btn p-0.5">
              {['Abuja','Kano','Kaduna'].map(s => (
                <button key={s} onClick={() => setSelectedState(s)}
                  className={`px-4 py-1.5 rounded-[6px] font-mono text-xs transition-all ${
                    selectedState === s ? 'bg-brass text-midnight font-bold' : 'text-text-m hover:text-text-p'
                  }`}>{s}</button>
              ))}
            </div>
            <div className="flex bg-surface-h border border-border rounded-btn p-0.5">
              {[{v:'LEVEL_1',l:'Commerce'},{v:'LEVEL_2',l:'Industry'}].map(({v,l}) => (
                <button key={v} onClick={() => setFloor(v)}
                  className={`px-4 py-1.5 rounded-[6px] font-mono text-xs transition-all ${
                    floor === v ? 'bg-brass text-midnight font-bold' : 'text-text-m hover:text-text-p'
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-card" />)}
            </div>
          ) : !catalog?.products?.length ? (
            <EmptyState icon={Package} title="No Products"
              description={`No listings in ${selectedState} ${floor === 'LEVEL_1' ? 'Commerce' : 'Industry'} yet.`} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {catalog.products.map((p) => {
                const inCart = cartItems.find(c => c.productId === p._id)
                return (
                  <motion.div key={p._id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -2 }}
                    className="card group cursor-pointer"
                  >
                    {/* Product image placeholder */}
                    <div className="h-32 rounded-btn bg-surface-h border border-border mb-3
                                    flex items-center justify-center overflow-hidden">
                      {p.imageUrls?.[0] ? (
                        <img src={p.imageUrls[0]} alt={p.name}
                          className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-10 h-10 text-text-d" />
                      )}
                    </div>

                    <div className="mb-1 flex items-center gap-1">
                      <Badge color={p.buildingFloor === 'LEVEL_1' ? 'blue' : 'purple'}>
                        {p.buildingFloor === 'LEVEL_1' ? 'L1' : 'L2'}
                      </Badge>
                      <span className="font-mono text-[10px] text-text-d">{p.categorySlug}</span>
                    </div>

                    <h3 className="font-body text-sm font-semibold text-text-p leading-snug mb-2 line-clamp-2">
                      {p.name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-base font-bold text-brass">
                          ₦{(p.priceKobo / 100).toLocaleString()}
                        </p>
                        <p className={`font-mono text-[10px] ${p.stock <= 10 ? 'text-warning' : 'text-success'}`}>
                          {p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`}
                        </p>
                      </div>

                      {p.stock > 0 && (
                        <button
                          onClick={() => { addToCart(p); toast.success('Added to cart') }}
                          className={`w-8 h-8 rounded-btn flex items-center justify-center transition-all ${
                            inCart
                              ? 'bg-role-buyer/20 border border-role-buyer/40 text-role-buyer'
                              : 'bg-brass/10 border border-brass/30 text-brass hover:bg-brass/20'
                          }`}
                          title="Add to cart"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* CART VIEW */}
      {view === 'cart' && (
        <div className="max-w-2xl mx-auto">
          {!cartItems.length ? (
            <EmptyState icon={ShoppingCart} title="Your Cart is Empty"
              description="Browse the shop and add products to get started."
              action={<Button variant="primary" onClick={() => setView('shop')}>Browse Products</Button>}
            />
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => (
                <Card key={item.productId} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-btn bg-surface-h border border-border flex items-center justify-center flex-shrink-0">
                    <Package className="w-7 h-7 text-text-d" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-text-p truncate">{item.name}</p>
                    <p className="font-mono text-xs text-brass">₦{(item.priceKobo / 100).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                      className="btn-icon w-7 h-7"><Minus className="w-3 h-3" /></button>
                    <span className="font-mono text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                      className="btn-icon w-7 h-7"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => removeFromCart(item.productId)}
                      className="btn-icon w-7 h-7 text-danger hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="font-mono text-sm font-bold text-brass w-20 text-right">
                    ₦{((item.priceKobo * item.quantity) / 100).toLocaleString()}
                  </p>
                </Card>
              ))}

              <div className="divider-brass" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-text-m">Total</p>
                  <p className="font-mono text-2xl font-bold text-brass">₦{totalNaira.toLocaleString()}</p>
                  <p className="font-mono text-[10px] text-text-m">
                    Platform fee (1.5%): ₦{(totalNaira * 0.015).toFixed(2)}
                  </p>
                </div>
                <Button variant="primary" onClick={() => setCheckout(true)}
                  iconRight={<ArrowRight className="w-4 h-4" />}>
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ORDERS VIEW */}
      {view === 'orders' && (
        <div className="space-y-4">
          {!ordersData?.orders?.length ? (
            <EmptyState icon={Package} title="No Orders Yet"
              description="Your order history will appear here."
              action={<Button variant="primary" onClick={() => setView('shop')}>Start Shopping</Button>}
            />
          ) : (
            ordersData.orders.map(order => (
              <Card key={order._id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-xs text-text-m">{order.orderRef}</p>
                    <p className="font-body text-sm font-semibold text-text-p mt-0.5">
                      {order.items?.length} item(s)
                    </p>
                    <p className="font-mono text-xs text-text-d">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="font-mono text-sm font-bold text-brass mt-1">
                      ₦{(order.grossTotalKobo / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
                <OrderTracker status={order.status} />
                {['PENDING','CONFIRMED'].includes(order.status) && (
                  <div className="mt-3">
                    <button
                      onClick={() => cancelMut.mutate({ id: order._id, reason: 'Cancelled by buyer' })}
                      className="font-mono text-xs text-danger hover:underline"
                    >
                      Cancel order
                    </button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Checkout Modal */}
      <Modal open={checkoutModal} onClose={() => setCheckout(false)} title="Confirm Your Order">
        <div className="space-y-4">
          <div className="bg-surface-h rounded-btn p-3 border border-border">
            <p className="font-mono text-xs text-text-m mb-1">Order Total</p>
            <p className="font-mono text-2xl font-bold text-brass">₦{totalNaira.toLocaleString()}</p>
            <p className="font-mono text-xs text-text-d">Funds locked in escrow until delivery</p>
          </div>
          <div className="space-y-1.5">
            <label className="input-label">Delivery Address *</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Full delivery address including street, area, and city..."
              rows={3} className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setCheckout(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1"
              loading={checkoutMut.isPending} onClick={handleCheckout}
              iconRight={<ArrowRight className="w-4 h-4" />}>
              Lock to Escrow
            </Button>
          </div>
        </div>
      </Modal>

      {/* OTP Modal — shown after successful checkout */}
      <Modal open={!!otpModal} onClose={() => setOtpModal(null)} title="Order Confirmed — Your OTP">
        {otpModal && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30
                            flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <p className="font-mono text-xs text-text-m mb-1">Order Reference</p>
              <p className="font-mono text-sm font-bold text-text-p">{otpModal.orderRef}</p>
            </div>
            <div className="bg-midnight border border-brass/30 rounded-card p-4">
              <p className="font-mono text-xs text-brass mb-2 tracking-widest">YOUR DELIVERY OTP</p>
              <p className="font-mono text-5xl font-black text-brass tracking-[0.5em] mb-2"
                 style={{ textShadow: '0 0 20px rgba(200,168,75,0.6)' }}>
                {otpModal.rawOtp}
              </p>
              <p className="font-mono text-[10px] text-text-d">
                Share this code ONLY with the rider at delivery. Do not share before.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-surface-h rounded-btn p-3">
                <p className="font-mono text-[10px] text-text-m">You Pay</p>
                <p className="font-mono text-sm font-bold text-brass">₦{otpModal.grossTotalNaira?.toLocaleString()}</p>
              </div>
              <div className="bg-surface-h rounded-btn p-3">
                <p className="font-mono text-[10px] text-text-m">In Escrow</p>
                <p className="font-mono text-sm font-bold text-success">LOCKED</p>
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={() => { setOtpModal(null); setView('orders') }}>
              Track My Order
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
