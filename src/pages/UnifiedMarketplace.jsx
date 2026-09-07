import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productApi, propertyApi } from '../api/index.js'
import { Badge, Button, Card, EmptyState, Input, Select, Spinner } from '../components/ui/index.jsx'
import { Building2, Filter, MapPin, Package, Search, ShoppingBag, X } from 'lucide-react'
import { formatNaira } from '../utils/index.js'

const TIER_LABELS = {
  consumer: { label: 'Public Retail', badge: 'B2C', color: 'green', note: 'Retail products available to everyone.' },
  wholesale: { label: 'Wholesale Procurement', badge: 'B2B', color: 'amber', note: 'Inventory available for business restocking.' },
  manufacturing: { label: 'Manufacturer Direct', badge: 'B2B', color: 'purple', note: 'Direct-source inventory for bulk procurement.' },
  all: { label: 'Full Catalog', badge: 'ADMIN', color: 'muted', note: 'All catalog visibility enabled.' },
}

function ProductCard({ product, showBulkPricing }) {
  const isB2B = showBulkPricing && product.marketTier !== 'consumer'
  const price = product.priceKobo || product.price || 0
  return <Card className="overflow-hidden hover:border-brass/80 transition-colors h-full p-0 flex flex-col">
    <div className="h-48 bg-surface-h relative overflow-hidden">{product.imageUrls?.[0] || product.imageUrl ? <img src={product.imageUrls?.[0] || product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brass/10"><Package className="w-14 h-14 text-brass opacity-30" /></div>}<div className="absolute top-3 left-3"><Badge color={isB2B ? 'amber' : 'blue'}>{isB2B ? 'B2B' : 'Retail'}</Badge></div></div>
    <div className="p-4 flex flex-col flex-1"><div className="flex items-center justify-between gap-2 mb-2"><span className="font-mono text-[10px] uppercase text-text-m truncate">{product.store?.businessType || product.category || 'Product'}</span>{isB2B && product.minimumOrderQuantity && <Badge color="amber">MOQ: {product.minimumOrderQuantity}</Badge>}</div><h3 className="font-body font-semibold text-text-p mb-1">{product.name}</h3><p className="font-mono text-[10px] text-text-m mb-3">{product.store?.name || product.assignedState || 'Gimbiya Marketplace'}</p><div className="flex items-baseline gap-2"><span className="text-lg font-black text-brass">{formatNaira(price / 100)}</span><span className="font-mono text-[10px] text-text-m">per unit</span></div>{isB2B && product.bulkPricingTiers?.length > 0 && <div className="mt-3 pt-3 border-t border-border space-y-1.5"><p className="font-mono text-[10px] font-bold text-text-m uppercase">Bulk Pricing</p>{product.bulkPricingTiers.map((tier, index) => <div key={`${tier.minQty}-${index}`} className="flex justify-between text-xs"><span className="text-text-m">{tier.minQty}+ units</span><span className="text-success font-bold">{formatNaira((tier.priceKobo || 0) / 100)}</span></div>)}</div>}<Link to="/shop" className="btn btn-primary mt-4 w-full text-center text-xs">{isB2B ? 'Add to Procurement List' : 'Add to Cart'}</Link></div>
  </Card>
}

export default function UnifiedMarketplace() {
  const [tab, setTab] = useState('products')
  const [filters, setFilters] = useState({ search: '', state: '', minPrice: '', maxPrice: '', sortBy: 'createdAt' })
  const [showFilters, setShowFilters] = useState(false)
  const params = Object.fromEntries(Object.entries({ limit: 50, ...filters }).filter(([, value]) => value !== ''))
  const productsQuery = useQuery({ queryKey: ['products', params], queryFn: () => productApi.getCatalog(params).then((response) => response.data), staleTime: 30000 })
  const propertiesQuery = useQuery({ queryKey: ['marketplace-properties', params], queryFn: () => propertyApi.getPublic(params).then((response) => response.data), staleTime: 30000, enabled: tab === 'properties' })
  const products = productsQuery.data?.products || productsQuery.data?.items || []
  const properties = propertiesQuery.data?.properties || propertiesQuery.data?.items || []
  const tierMeta = TIER_LABELS[productsQuery.data?.meta?.marketTier] || TIER_LABELS.consumer
  const loading = tab === 'properties' ? propertiesQuery.isLoading : productsQuery.isLoading
  const updateFilter = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }))

  return <div className="min-h-screen bg-midnight text-text-p">
    <div className="bg-[#0D4A3A] py-12 px-6"><div className="max-w-7xl mx-auto"><div className="flex flex-wrap items-start justify-between gap-4 mb-8"><div><p className="section-label text-brass mb-2">Gimbiya Marketplace</p><h1 className="font-display text-4xl font-bold">One catalog. The right visibility.</h1></div><div className="flex items-center gap-3 bg-midnight/30 border border-white/10 px-4 py-3 rounded-btn"><Badge color={tierMeta.color}>{tierMeta.badge}</Badge><div><p className="text-sm font-bold">{tierMeta.label}</p><p className="text-[10px] text-text-m">{tierMeta.note}</p></div></div></div><div className="max-w-3xl flex gap-2"><Input value={filters.search} onChange={updateFilter('search')} onKeyDown={(event) => event.key === 'Enter' && productsQuery.refetch()} placeholder="Search products, properties, brands..." icon={Search} className="bg-white text-midnight border-0 h-12" /><Button onClick={() => productsQuery.refetch()} className="h-12 px-5">Search</Button><Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="h-12 px-4" aria-label="Toggle filters"><Filter className="w-5 h-5" /></Button></div></div></div>
    <div className="bg-surface border-b border-border px-6 py-4"><div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4"><div className="flex gap-2"><button onClick={() => setTab('products')} className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm ${tab === 'products' ? 'bg-brass text-midnight' : 'text-text-m hover:text-text-p'}`}><Package className="w-4 h-4" /> Products</button><button onClick={() => setTab('properties')} className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm ${tab === 'properties' ? 'bg-brass text-midnight' : 'text-text-m hover:text-text-p'}`}><Building2 className="w-4 h-4" /> Properties</button></div>{showFilters && <div className="flex flex-wrap gap-3 items-end"><Input label="State" value={filters.state} onChange={updateFilter('state')} className="w-40 bg-midnight" /><Input label="Min price" type="number" value={filters.minPrice} onChange={updateFilter('minPrice')} className="w-32 bg-midnight" /><Input label="Max price" type="number" value={filters.maxPrice} onChange={updateFilter('maxPrice')} className="w-32 bg-midnight" /><Select label="Sort" value={filters.sortBy} onChange={updateFilter('sortBy')} options={[{ value: 'createdAt', label: 'Newest' }, { value: 'priceKobo', label: 'Price' }]} className="w-32 bg-midnight" /><Button variant="ghost" onClick={() => setFilters({ search: '', state: '', minPrice: '', maxPrice: '', sortBy: 'createdAt' })}><X className="w-4 h-4" /></Button></div>}</div></div>
    <div className="max-w-7xl mx-auto px-6 py-8">{loading ? <div className="flex justify-center py-20"><Spinner size={12} /></div> : tab === 'products' ? (!products.length ? <EmptyState icon={ShoppingBag} title="No products found" description="Try adjusting your search or filters." /> : <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{products.map((product) => <ProductCard key={product._id} product={product} showBulkPricing={productsQuery.data?.meta?.marketTier !== 'consumer'} />)}</div>) : (!properties.length ? <EmptyState icon={Building2} title="No properties found" description="Try adjusting your search or filters." /> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{properties.map((property) => <Link key={property._id} to={`/properties/${property._id}`}><Card className="overflow-hidden p-0 h-full"><div className="h-48 bg-surface-h">{property.imageUrls?.[0] && <img src={property.imageUrls[0]} alt={property.title} className="w-full h-full object-cover" />}</div><div className="p-4"><h3 className="font-semibold">{property.title}</h3><p className="text-xs text-text-m mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{property.city}, {property.state}</p><p className="text-brass font-bold mt-3">{formatNaira((property.priceKobo || 0) / 100)}</p></div></Card></Link>)}</div>)}</div>
  </div>
}
