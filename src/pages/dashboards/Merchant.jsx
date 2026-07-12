import { useState }        from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion }           from 'framer-motion'
import {
  Package, TrendingUp, DollarSign, ToggleLeft,
  ToggleRight, Plus, Edit2, BarChart2, RefreshCw,
} from 'lucide-react'
import { productApi }       from '../../api/index.js'
import { useAuthStore }     from '../../store/authStore.js'
import {
  Card, StatCard, Button, Badge, StatusBadge,
  Modal, Input, Select, EmptyState, Skeleton, Spinner,
} from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

const FLOOR_OPTIONS  = [{ value:'LEVEL_1', label:'Level 1 — Commerce' }, { value:'LEVEL_2', label:'Level 2 — Industry' }]
const STATE_OPTIONS  = [{ value:'Abuja', label:'Abuja' }, { value:'Kano', label:'Kano' }, { value:'Kaduna', label:'Kaduna' }]

const EMPTY_FORM = {
  name: '', descriptionText: '', priceKobo: '', initialStock: '',
  categorySlug: '', assignedState: 'Kano', buildingFloor: 'LEVEL_1',
}

export default function MerchantDashboard() {
  const qc           = useQueryClient()
  const user         = useAuthStore(s => s.user)
  const [tab, setTab] = useState('listings')
  const [addModal, setAddModal] = useState(false)
  const [priceModal, setPriceModal] = useState(null)  // product to reprice
  const [newPrice, setNewPrice]   = useState('')
  const [form, setForm]           = useState(EMPTY_FORM)
  const [errors, setErrors]       = useState({})

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: listingsData, isLoading: listLoad } = useQuery({
    queryKey: ['my-listings'],
    queryFn:  () => productApi.myListings({ limit: 50 }).then(r => r.data),
  })

  const { data: analyticsData, isLoading: analLoad } = useQuery({
    queryKey: ['merchant-analytics'],
    queryFn:  () => productApi.analytics().then(r => r.data),
    enabled:  tab === 'analytics',
  })

  const { data: settlementData, isLoading: settLoad } = useQuery({
    queryKey: ['merchant-settlement'],
    queryFn:  () => productApi.settlement({ limit: 30 }).then(r => r.data),
    enabled:  tab === 'settlement',
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const publishMut = useMutation({
    mutationFn: (data) => productApi.publish(data),
    onSuccess: () => {
      toast.success('Listing published!')
      qc.invalidateQueries(['my-listings'])
      setAddModal(false)
      setForm(EMPTY_FORM)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to publish'),
  })

  const priceMut = useMutation({
    mutationFn: ({ id, priceKobo }) => productApi.updatePrice(id, priceKobo),
    onSuccess: () => {
      toast.success('Price updated')
      qc.invalidateQueries(['my-listings'])
      setPriceModal(null)
      setNewPrice('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Price update failed'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }) => productApi.toggle(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries(['my-listings'])
      toast.success('Listing updated')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Toggle failed'),
  })

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const e = {}
    if (!form.name || form.name.length < 3)    e.name = 'Name must be at least 3 characters'
    if (!form.priceKobo || Number(form.priceKobo) < 1) e.priceKobo = 'Enter a valid price in Kobo'
    if (form.initialStock === '')              e.initialStock = 'Stock quantity is required'
    if (!form.categorySlug)                    e.categorySlug = 'Category is required'
    return e
  }

  const handlePublish = () => {
    const errs = validateForm()
    if (Object.keys(errs).length) { setErrors(errs); return }
    publishMut.mutate({
      ...form,
      priceKobo:    Number(form.priceKobo),
      initialStock: Number(form.initialStock),
    })
  }

  const handlePriceUpdate = () => {
    const kobo = Number(newPrice)
    if (!kobo || kobo < 1) { toast.error('Enter a valid Kobo amount'); return }
    priceMut.mutate({ id: priceModal._id, priceKobo: kobo })
  }

  const set = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }))
    setErrors(p => ({ ...p, [key]: '' }))
  }

  const listings = listingsData?.products || []

  // Summary stats
  const totalListings = listings.length
  const activeListings = listings.filter(p => p.isActive).length
  const breakdown = analyticsData?.orderBreakdown || []
  const totalRevKobo = breakdown.reduce((s, b) => s + (b.merchantNetKobo || 0), 0)
  const settleSummary = settlementData?.summary || {}

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">Merchant Control Panel</p>
          <h1 className="font-display text-3xl font-bold text-text-p">Store Manager</h1>
          <p className="font-mono text-xs text-text-m mt-1">{user?.assignedState} · {user?.email}</p>
        </div>
        <Button variant="primary" onClick={() => setAddModal(true)}
          icon={<Plus className="w-4 h-4" />}>
          New Listing
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Listings"  value={totalListings}  icon={Package} />
        <StatCard label="Active Listings" value={activeListings}  icon={ToggleRight} color="text-success" />
        <StatCard label="Released (Net)"  value={`₦${((settleSummary.totalReleasedNaira || 0) / 1000).toFixed(1)}K`}
          icon={DollarSign} />
        <StatCard label="Fulfillment"     value="98.7%" change="Target >98.5%" icon={TrendingUp}
          color="text-success" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-surface border border-border rounded-card p-1">
        {['listings','analytics','settlement'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-btn font-mono text-xs uppercase tracking-wide transition-all ${
              tab === t ? 'bg-brass text-midnight font-bold' : 'text-text-m hover:text-text-p'
            }`}>{t}</button>
        ))}
      </div>

      {/* LISTINGS TAB */}
      {tab === 'listings' && (
        <>
          {listLoad ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-card" />)}
            </div>
          ) : !listings.length ? (
            <EmptyState icon={Package} title="No Listings Yet"
              description="Publish your first product to start selling."
              action={<Button variant="primary" onClick={() => setAddModal(true)}>Create First Listing</Button>}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(p => (
                <motion.div key={p._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card border transition-colors ${p.isActive ? '' : 'opacity-60'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-1.5">
                      <Badge color={p.buildingFloor === 'LEVEL_1' ? 'blue' : 'purple'}>
                        {p.buildingFloor === 'LEVEL_1' ? 'L1' : 'L2'}
                      </Badge>
                      <Badge color="muted">{p.assignedState}</Badge>
                    </div>
                    <button
                      onClick={() => toggleMut.mutate({ id: p._id, isActive: !p.isActive })}
                      disabled={toggleMut.isPending}
                      className="text-text-m hover:text-brass transition-colors"
                      title={p.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {p.isActive
                        ? <ToggleRight className="w-5 h-5 text-success" />
                        : <ToggleLeft  className="w-5 h-5" />
                      }
                    </button>
                  </div>

                  <h3 className="font-body text-sm font-semibold text-text-p mb-2 line-clamp-2">
                    {p.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold text-brass">
                        ₦{(p.priceKobo / 100).toLocaleString()}
                      </p>
                      <p className={`font-mono text-xs ${p.stock <= 10 ? 'text-warning' : 'text-text-m'}`}>
                        {p.stock} units
                      </p>
                    </div>
                    <button
                      onClick={() => { setPriceModal(p); setNewPrice(String(p.priceKobo)) }}
                      className="btn-icon"
                      title="Update price"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock bar */}
                  <div className="mt-3 h-1 bg-surface-h rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brass"
                      style={{ width: `${Math.min(100, (p.stock / 200) * 100)}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          {analLoad ? <Spinner /> : (
            <>
              {/* Order Breakdown */}
              <Card>
                <p className="section-label mb-4">Order Breakdown by Status</p>
                {!breakdown.length ? (
                  <p className="font-mono text-xs text-text-m">No order data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {breakdown.map(b => (
                      <div key={b._id} className="flex items-center justify-between p-3
                           bg-midnight rounded-btn border border-border">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={b._id} />
                          <span className="font-mono text-xs text-text-m">{b.count} orders</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-brass">
                          ₦{(b.merchantNetNaira || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Top products */}
              <Card>
                <p className="section-label mb-4">Top 5 Products by Sales</p>
                <div className="space-y-2">
                  {(analyticsData?.topProducts || []).map((p, i) => (
                    <div key={p._id} className="flex items-center gap-3 p-2">
                      <span className="font-mono text-lg font-bold text-text-d w-6">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-text-p truncate">{p.name}</p>
                        <p className="font-mono text-xs text-text-m">{p.soldCount} sold</p>
                      </div>
                      <span className="font-mono text-sm font-bold text-brass">
                        ₦{(p.priceKobo / 100).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* SETTLEMENT TAB */}
      {tab === 'settlement' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Released" icon={DollarSign}
              value={`₦${(settleSummary.totalReleasedNaira || 0).toLocaleString()}`} />
            <StatCard label="Ledger Entries" icon={BarChart2}
              value={settleSummary.entryCount || 0} color="text-text-m" />
          </div>

          <Card>
            <p className="section-label mb-4">Escrow Ledger</p>
            {settLoad ? <Spinner /> : !settlementData?.entries?.length ? (
              <EmptyState icon={DollarSign} title="No Transactions"
                description="Completed orders will appear here." />
            ) : (
              <div className="space-y-2">
                {settlementData.entries.map(e => (
                  <div key={e._id}
                    className="flex items-center justify-between p-3 bg-midnight rounded-btn border border-border">
                    <div>
                      <Badge color={e.entryType === 'RELEASE' ? 'green' : e.entryType === 'LOCK' ? 'brass' : 'red'}>
                        {e.entryType}
                      </Badge>
                      <p className="font-mono text-[10px] text-text-d mt-1">
                        {new Date(e.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-brass">
                        ₦{(e.merchantNetKobo / 100).toLocaleString()}
                      </p>
                      <p className="font-mono text-[10px] text-text-d">
                        Fee: ₦{(e.platformFeeKobo / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ADD LISTING MODAL */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setForm(EMPTY_FORM); setErrors({}) }}
        title="New Product Listing" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Product Name *" placeholder="e.g. Premium Ankara Fabric Set"
              value={form.name} onChange={set('name')} error={errors.name} />
          </div>
          <Input label="Price (Kobo) *" type="number" placeholder="1250000 = ₦12,500"
            hint={form.priceKobo ? `= ₦${(Number(form.priceKobo)/100).toLocaleString()}` : ''}
            value={form.priceKobo} onChange={set('priceKobo')} error={errors.priceKobo} />
          <Input label="Initial Stock *" type="number" placeholder="50"
            value={form.initialStock} onChange={set('initialStock')} error={errors.initialStock} />
          <Input label="Category Slug *" placeholder="textiles"
            value={form.categorySlug} onChange={set('categorySlug')} error={errors.categorySlug} />
          <Input label="Description" placeholder="Optional product description"
            value={form.descriptionText} onChange={set('descriptionText')} />
          <Select label="State" value={form.assignedState}
            onChange={set('assignedState')} options={STATE_OPTIONS} />
          <Select label="Floor" value={form.buildingFloor}
            onChange={set('buildingFloor')} options={FLOOR_OPTIONS} />
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" className="flex-1" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="primary" className="flex-1"
            loading={publishMut.isPending} onClick={handlePublish}>
            Publish Listing
          </Button>
        </div>
      </Modal>

      {/* REPRICE MODAL */}
      <Modal open={!!priceModal} onClose={() => { setPriceModal(null); setNewPrice('') }}
        title="Update Price" size="sm">
        {priceModal && (
          <div className="space-y-4">
            <p className="font-body text-sm text-text-m">
              Updating price for: <span className="text-text-p font-semibold">{priceModal.name}</span>
            </p>
            <p className="font-mono text-xs text-text-d">
              Current: ₦{(priceModal.priceKobo / 100).toLocaleString()}
            </p>
            <Input label="New Price (Kobo) *" type="number"
              placeholder="e.g. 1500000 = ₦15,000"
              hint={newPrice ? `= ₦${(Number(newPrice)/100).toLocaleString()}` : ''}
              value={newPrice} onChange={e => setNewPrice(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setPriceModal(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1"
                loading={priceMut.isPending} onClick={handlePriceUpdate}>
                Update Price
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
