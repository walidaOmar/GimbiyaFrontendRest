import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productApi, propertyApi } from '../api/index.js'
import { Card, Badge, Input, Select, Button, Spinner } from '../components/ui/index.jsx'
import {
  Search, MapPin, BedDouble, Bath, Maximize, Home, Briefcase, LandPlot, Factory,
  Package, ShoppingBag, Filter, X, Building2,
} from 'lucide-react'
import { formatNaira } from '../utils/index.js'

const PROPERTY_TYPE_ICONS = {
  residential: Home,
  commercial: Briefcase,
  land: LandPlot,
  industrial: Factory,
}

export default function UnifiedMarketplace() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [filters, setFilters] = useState({ search: '', state: '', minPrice: '', maxPrice: '', sortBy: 'createdAt' })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 12, sortBy: filters.sortBy, ...filters }
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k]
      })

      let allItems = []
      let totalCount = 0

      if (tab === 'all' || tab === 'products') {
        const { data } = await productApi.getAll({
          ...params,
          assignedState: params.state,
          search: params.search,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
        })
        const prods = (data.products || data.items || []).map((p) => ({ ...p, _itemType: 'product' }))
        allItems = [...allItems, ...prods]
        totalCount += data.pagination?.total || data.total || prods.length
      }

      if (tab === 'all' || tab === 'properties') {
        const { data } = await propertyApi.getPublic({
          ...params,
          state: params.state,
          search: params.search,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
        })
        const props = (data.properties || data.items || []).map((p) => ({ ...p, _itemType: 'property' }))
        allItems = [...allItems, ...props]
        totalCount += data.pagination?.total || data.total || props.length
      }

      if (filters.sortBy === 'priceKobo') {
        allItems.sort((a, b) => (b.priceKobo || 0) - (a.priceKobo || 0))
      } else {
        allItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      }

      setItems(allItems)
      setTotal(totalCount)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [page, tab, filters.sortBy])

  const handleSearch = () => {
    setPage(1)
    fetchItems()
  }

  const clearFilters = () => {
    setFilters({ search: '', state: '', minPrice: '', maxPrice: '', sortBy: 'createdAt' })
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-midnight text-text-p">
      <div className="bg-[#0D4A3A] py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-text-p mb-4">Gimbiya Marketplace</h1>
          <p className="font-body text-lg text-brass mb-8">Products, properties & services — all in one place</p>
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-m" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search products, properties, brands..."
                className="pl-10 w-full bg-white text-midnight border-0 h-12"
              />
            </div>
            <Button onClick={handleSearch} className="h-12 px-6">Search</Button>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="h-12 px-4"><Filter className="w-5 h-5" /></Button>
          </div>
        </div>
      </div>

      <div className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { id: 'all', label: 'All Items', icon: ShoppingBag },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'properties', label: 'Properties', icon: Building2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setPage(1) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium transition-colors ${tab === id ? 'bg-brass text-midnight' : 'text-text-m hover:text-text-p'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="input-label">State/Location</label>
                <Input value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })} placeholder="e.g. Lagos" className="w-40 bg-midnight border-border" />
              </div>
              <div>
                <label className="input-label">Min Price (₦)</label>
                <Input type="number" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} className="w-32 bg-midnight border-border" />
              </div>
              <div>
                <label className="input-label">Max Price (₦)</label>
                <Input type="number" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} className="w-32 bg-midnight border-border" />
              </div>
              <div>
                <label className="input-label">Sort By</label>
                <Select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} className="w-40 bg-midnight border-border">
                  <option value="createdAt">Newest</option>
                  <option value="priceKobo">Price: High to Low</option>
                </Select>
              </div>
              <Button onClick={handleSearch}>Apply</Button>
              <Button variant="secondary" onClick={clearFilters} className="flex items-center gap-1"><X className="w-3 h-3" /> Clear</Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="font-mono text-xs uppercase tracking-wider text-text-m">{items.length} of {total} results</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={12} /></div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => {
                if (item._itemType === 'property') {
                  const Icon = PROPERTY_TYPE_ICONS[item.propertyType] || Home
                  return (
                    <Link key={item._id} to={`/properties/${item._id}`} className="group">
                      <Card className="overflow-hidden hover:border-brass/80 transition-colors h-full p-0">
                        <div className="h-48 bg-surface-h relative overflow-hidden">
                          {item.imageUrls?.[0] ? (
                            <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brass/10"><Icon className="w-16 h-16 text-brass opacity-30" /></div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge color="muted">{item.listingType}</Badge>
                            <Badge color="purple">Property</Badge>
                          </div>
                          <div className="absolute bottom-3 right-3"><p className="text-lg font-bold text-text-p drop-shadow-lg">{formatNaira((item.priceKobo || 0) / 100)}</p></div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-body font-semibold text-text-p mb-1 group-hover:text-brass transition-colors">{item.title}</h3>
                          <p className="font-mono text-[10px] text-text-m flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" /> {item.city}, {item.state}</p>
                          <div className="flex items-center gap-3 text-[11px] text-text-m flex-wrap">
                            {item.bedrooms !== null && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {item.bedrooms}</span>}
                            {item.bathrooms !== null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {item.bathrooms}</span>}
                            {item.squareMeters !== null && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" /> {item.squareMeters}m²</span>}
                          </div>
                          {item.priceNegotiable && <p className="font-mono text-[10px] text-success mt-2">Price negotiable</p>}
                        </div>
                      </Card>
                    </Link>
                  )
                }

                return (
                  <Link key={item._id} to="/shop" className="group">
                    <Card className="overflow-hidden hover:border-brass/80 transition-colors h-full p-0">
                      <div className="h-48 bg-surface-h relative overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brass/10"><Package className="w-16 h-16 text-brass opacity-30" /></div>
                        )}
                        <div className="absolute top-3 left-3"><Badge color="blue">Product</Badge></div>
                        <div className="absolute bottom-3 right-3"><p className="text-lg font-bold text-text-p drop-shadow-lg">{formatNaira((item.priceKobo || 0) / 100)}</p></div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-body font-semibold text-text-p mb-1 group-hover:text-brass transition-colors">{item.name}</h3>
                        <p className="font-mono text-[10px] text-text-m mb-2">{item.category || 'Uncategorized'} · {item.assignedState}</p>
                        <div className="flex justify-between items-center">
                          <p className="font-mono text-[10px] text-text-m">{item.stock} in stock</p>
                          <p className="font-mono text-[10px] text-text-m">{item.buildingFloor}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {!items.length && (
              <div className="text-center py-20">
                <ShoppingBag className="w-16 h-16 text-text-m mx-auto mb-4" />
                <p className="text-text-m text-lg">No items found.</p>
                <Button variant="secondary" onClick={clearFilters} className="mt-4">Clear Filters</Button>
              </div>
            )}

            {total > 12 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="px-4 py-2 text-text-m">Page {page} of {Math.ceil(total / 12)}</span>
                <Button variant="secondary" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
