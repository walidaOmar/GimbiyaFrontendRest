import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { productApi, propertyApi, serviceCatalogApi } from '../api/index.js'
import { useAuthStore } from '../store/authStore.js'
import { useCartV2 } from '../store/cartV2Store.js'
import { Badge, Button, Card, EmptyState, Input, Modal, Select, Spinner } from '../components/ui/index.jsx'
import { Building2, Filter, MapPin, Package, Search, ShoppingBag, ShoppingCart, Wrench, X } from 'lucide-react'
import { formatNaira } from '../utils/index.js'
import { STATE_OPTIONS, getRegionLabel } from '../config/regions.js'

const PROPERTY_MODULE_ENABLED = import.meta.env.VITE_ENABLE_PROPERTY_MODULE === 'true'

const VIEW_COLOR = { B2C: 'green', B2B: 'amber', ALL: 'purple', ADMIN: 'muted' }
const TIER_BADGE = { consumer: ['Retail', 'blue'], wholesale: ['Wholesale', 'amber'], manufacturing: ['Manufacturer', 'purple'] }
const PRICING_LABEL = { FIXED: 'fixed price', HOURLY: 'per hour', PER_UNIT: 'per item', QUOTE: 'quote needed', INSPECTION: 'inspection first' }
const EMPTY_FILTERS = { search: '', assignedState: '', category: '', sort: 'newest', minNaira: '', maxNaira: '' }
const prettyCategory = (slug) => String(slug || '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

function ProductCard({ product, onAdd }) {
  const [qty, setQty] = useState(product.minimumOrderQuantity || 1)
  const [tierLabel, tierColor] = TIER_BADGE[product.marketTier] || TIER_BADGE.consumer
  const minQty = product.minimumOrderQuantity || 1
  const bestBulk = (product.bulkPricingTiers || []).reduce((min, t) => (min == null || t.minQty < min ? t.minQty : min), null)
  const image = product.imageUrls?.[0]
  return (
    <Card className="overflow-hidden hover:border-brass/80 transition-colors h-full p-0 flex flex-col">
      <div className="h-44 bg-surface-h relative overflow-hidden">
        {image ? <img src={image} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brass/10"><Package className="w-14 h-14 text-brass opacity-30" /></div>}
        <div className="absolute top-3 left-3"><Badge color={tierColor}>{tierLabel}</Badge></div>
        {product.stock <= 10 && <div className="absolute top-3 right-3"><Badge color="amber">Only {product.stock} left</Badge></div>}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="font-mono text-[10px] uppercase text-text-m truncate">{prettyCategory(product.categorySlug)} · {getRegionLabel(product.assignedState)}</p>
        <h3 className="font-body font-semibold text-text-p mt-1 mb-1">{product.name}</h3>
        <p className="font-mono text-[10px] text-text-m mb-3">Sold by {product.sellerName || 'a verified merchant'}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black text-brass">{formatNaira(product.priceKobo)}</span>
          <span className="font-mono text-[10px] text-text-m">per {product.unit || 'piece'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {minQty > 1 && <Badge color="amber">Minimum order: {minQty}</Badge>}
          {bestBulk && <Badge color="green">Lower price from {bestBulk}+ units</Badge>}
        </div>
        <div className="mt-auto pt-4 flex items-center gap-2">
          <input type="number" min={minQty} max={product.stock} value={qty} onChange={(event) => setQty(Math.max(minQty, parseInt(event.target.value, 10) || minQty))}
            className="input w-20 text-center" aria-label="Quantity" />
          <Button className="flex-1 text-xs" icon={<ShoppingCart className="w-4 h-4" />} onClick={() => onAdd(product, qty)}>Add to cart</Button>
        </div>
      </div>
    </Card>
  )
}

function ServiceCard({ offering, onAttach }) {
  const quoteOnly = offering.pricingModel === 'QUOTE' || offering.pricingModel === 'INSPECTION'
  return (
    <Card className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between gap-2">
        <Badge color="blue">{prettyCategory(offering.category)}</Badge>
        <span className="font-mono text-[10px] text-text-m">{getRegionLabel(offering.assignedState)}</span>
      </div>
      <h3 className="font-semibold text-text-p">{offering.serviceType}</h3>
      <p className="font-mono text-[10px] text-text-m">By {offering.providerName}{offering.serviceArea ? ` · ${offering.serviceArea}` : ''}</p>
      {offering.descriptionText && offering.descriptionText !== 'Pilot test listing' && <p className="text-xs text-text-m">{offering.descriptionText}</p>}
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-lg font-black text-brass">{formatNaira(offering.priceKobo)}</span>
        <span className="font-mono text-[10px] text-text-m">{PRICING_LABEL[offering.pricingModel] || ''}</span>
      </div>
      {offering.estimatedDurationHours != null && <p className="font-mono text-[10px] text-text-m">About {offering.estimatedDurationHours} hour(s)</p>}
      <Button variant="secondary" className="mt-auto text-xs" disabled={quoteOnly} icon={<Wrench className="w-4 h-4" />} onClick={() => onAttach(offering)}>
        {quoteOnly ? 'Quote needed' : 'Add to a cart item'}
      </Button>
    </Card>
  )
}

export default function UnifiedMarketplace() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const cart = useCartV2()
  const [tab, setTab] = useState('products')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [attachTo, setAttachTo] = useState(null)

  const productParams = Object.fromEntries(Object.entries({
    limit: 48, search: applied.search, assignedState: applied.assignedState, category: applied.category, sort: applied.sort,
    minPriceKobo: applied.minNaira ? Math.round(Number(applied.minNaira) * 100) : '', maxPriceKobo: applied.maxNaira ? Math.round(Number(applied.maxNaira) * 100) : '',
  }).filter(([, value]) => value !== ''))
  const productsQuery = useQuery({ queryKey: ['products', productParams, user?._id], queryFn: () => productApi.getCatalog(productParams).then((r) => r.data), enabled: tab === 'products', staleTime: 30000 })

  const serviceParams = Object.fromEntries(Object.entries({ assignedState: applied.assignedState, category: tab === 'services' ? applied.category : '', search: applied.search }).filter(([, v]) => v !== ''))
  const servicesQuery = useQuery({ queryKey: ['services', serviceParams], queryFn: () => serviceCatalogApi.offerings(serviceParams).then((r) => r.data), enabled: tab === 'services', staleTime: 30000 })
  const propertiesQuery = useQuery({ queryKey: ['marketplace-properties', applied.search], queryFn: () => propertyApi.getPublic({ search: applied.search }).then((r) => r.data), enabled: tab === 'properties' && PROPERTY_MODULE_ENABLED, staleTime: 30000 })

  const meta = productsQuery.data?.meta
  const view = meta?.view || { label: 'Marketplace', badge: 'B2C', note: 'Sign in to see products for your account type.' }
  const products = productsQuery.data?.products || []
  const services = servicesQuery.data?.data || []
  const categories = tab === 'services' ? servicesQuery.data?.categories || [] : meta?.categories || []
  const properties = propertiesQuery.data?.properties || propertiesQuery.data?.items || []
  const loading = tab === 'properties' ? propertiesQuery.isLoading : tab === 'services' ? servicesQuery.isLoading : productsQuery.isLoading
  const set = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }))
  const apply = (next = filters) => setApplied(next)
  const reset = () => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS) }
  const pickCategory = (category) => { const next = { ...filters, category: filters.category === category ? '' : category }; setFilters(next); setApplied(next) }

  const requireLogin = () => {
    toast('Sign in to start shopping', { icon: '🔒' })
    navigate('/login', { state: { from: location.pathname } })
  }

  const addProduct = (product, qty) => {
    if (!user) return requireLogin()
    cart.bindUser(user._id)
    const result = cart.add(product, qty)
    if (!result.ok) return toast.error(result.message)
    toast.success(`${product.name} added. Open your cart to check out.`)
  }

  const startAttach = (offering) => {
    if (!user) return requireLogin()
    cart.bindUser(user._id)
    const eligible = useCartV2.getState().items.filter((item) => !item.assignedState || item.assignedState === offering.assignedState)
    if (!useCartV2.getState().items.length) return toast.error('Add a product to your cart first, then attach this service to it.')
    if (!eligible.length) return toast.error(`This service is in ${getRegionLabel(offering.assignedState)}. Your cart items are from another market.`)
    setAttachTo({ offering, eligible })
  }

  const attach = (item) => {
    const { offering } = attachTo
    const result = cart.addService(item.productId, { offeringId: offering._id, serviceType: offering.serviceType, priceKobo: offering.priceKobo })
    setAttachTo(null)
    if (!result.ok) return toast.error(result.message)
    toast.success('Service added to your cart item.')
  }

  const active = (key) => `flex items-center gap-2 px-4 py-2 rounded-btn text-sm ${tab === key ? 'bg-brass text-midnight' : 'text-text-m hover:text-text-p'}`

  return <div className="min-h-screen bg-midnight text-text-p">
    <div className="bg-[#0D4A3A] py-12 px-6"><div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div><p className="section-label text-brass mb-2">Gimbiya Marketplace</p><h1 className="font-display text-4xl font-bold">One marketplace. Every market.</h1></div>
        <div className="flex items-center gap-3 bg-midnight/30 border border-white/10 px-4 py-3 rounded-btn">
          <Badge color={VIEW_COLOR[view.badge] || 'muted'}>{view.badge}</Badge>
          <div><p className="text-sm font-bold">{user ? view.label : 'Public Retail'}</p><p className="text-[10px] text-text-m">{user ? view.note : 'Sign in to see products for your account type.'}</p></div>
        </div>
      </div>
      <form className="max-w-3xl flex gap-2" onSubmit={(event) => { event.preventDefault(); apply() }}>
        <Input value={filters.search} onChange={set('search')} placeholder="Search products and services..." icon={Search} className="bg-white text-midnight border-0 h-12" />
        <Button type="submit" className="h-12 px-5">Search</Button>
        <Button type="button" variant="secondary" onClick={() => setShowFilters(!showFilters)} className="h-12 px-4" aria-label="Toggle filters"><Filter className="w-5 h-5" /></Button>
      </form>
    </div></div>

    <div className="bg-surface border-b border-border px-6 py-4"><div className="max-w-7xl mx-auto space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button onClick={() => setTab('products')} className={active('products')}><Package className="w-4 h-4" /> Products</button>
          <button onClick={() => setTab('services')} className={active('services')}><Wrench className="w-4 h-4" /> Services</button>
          {PROPERTY_MODULE_ENABLED && <button onClick={() => setTab('properties')} className={active('properties')}><Building2 className="w-4 h-4" /> Properties</button>}
        </div>
        <Link to={user ? '/cart' : '/login'} className="btn btn-secondary text-sm"><ShoppingCart className="w-4 h-4" /> Cart{cart.count() > 0 ? ` (${cart.count()})` : ''}</Link>
      </div>
      {showFilters && <div className="flex flex-wrap gap-3 items-end">
        <Select label="Market" value={filters.assignedState} onChange={set('assignedState')} className="w-56 bg-midnight" options={[{ value: '', label: 'All markets' }, ...STATE_OPTIONS]} />
        {tab === 'products' && <>
          <Input label="Min price (₦)" type="number" value={filters.minNaira} onChange={set('minNaira')} className="w-32 bg-midnight" />
          <Input label="Max price (₦)" type="number" value={filters.maxNaira} onChange={set('maxNaira')} className="w-32 bg-midnight" />
          <Select label="Sort" value={filters.sort} onChange={set('sort')} className="w-40 bg-midnight" options={[{ value: 'newest', label: 'Newest' }, { value: 'popular', label: 'Most popular' }, { value: 'price_asc', label: 'Price: low to high' }, { value: 'price_desc', label: 'Price: high to low' }]} />
        </>}
        <Button onClick={() => apply()}>Apply</Button>
        <Button variant="ghost" onClick={reset} aria-label="Clear filters"><X className="w-4 h-4" /></Button>
      </div>}
      {tab !== 'properties' && categories.length > 0 && <div className="flex flex-wrap gap-2">
        {categories.map((category) => <button key={category} onClick={() => pickCategory(category)}
          className={`px-3 py-1 rounded-full text-xs border ${applied.category === category ? 'bg-brass text-midnight border-brass' : 'border-border text-text-m hover:text-text-p'}`}>{prettyCategory(category)}</button>)}
      </div>}
    </div></div>

    <div className="max-w-7xl mx-auto px-6 py-8">
      {loading ? <div className="flex justify-center py-20"><Spinner size={12} /></div>
        : tab === 'products' ? (productsQuery.isError ? <EmptyState icon={ShoppingBag} title="Could not load products" description={productsQuery.error?.response?.data?.message || 'Please try again.'} />
          : !products.length ? <EmptyState icon={ShoppingBag} title="No products found" description="Try another market, category or search." />
          : <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{products.map((product) => <ProductCard key={product._id} product={product} onAdd={addProduct} />)}</div>)
        : tab === 'services' ? (!services.length ? <EmptyState icon={Wrench} title="No services found" description="Try another market or category." />
          : <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{services.map((offering) => <ServiceCard key={offering._id} offering={offering} onAttach={startAttach} />)}</div>)
        : (!properties.length ? <EmptyState icon={Building2} title="No properties found" description="Try adjusting your search." /> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{properties.map((property) => <Link key={property._id} to={`/properties/${property._id}`}><Card className="overflow-hidden p-0 h-full"><div className="h-48 bg-surface-h">{property.imageUrls?.[0] && <img src={property.imageUrls[0]} alt={property.title} className="w-full h-full object-cover" />}</div><div className="p-4"><h3 className="font-semibold">{property.title}</h3><p className="text-xs text-text-m mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{property.city}, {property.state}</p><p className="text-brass font-bold mt-3">{formatNaira(property.priceKobo || 0)}</p></div></Card></Link>)}</div>)}
    </div>

    <Modal open={Boolean(attachTo)} onClose={() => setAttachTo(null)} title={`Add "${attachTo?.offering.serviceType || ''}" to which item?`}>
      <div className="space-y-2">
        {attachTo?.eligible.map((item) => <button key={item.productId} onClick={() => attach(item)} className="w-full flex items-center justify-between p-3 border border-border rounded-btn hover:border-brass/40 text-left">
          <span className="text-sm text-text-p">{item.name}</span><span className="text-xs text-text-m">x{item.quantity}</span>
        </button>)}
      </div>
    </Modal>
  </div>
}
