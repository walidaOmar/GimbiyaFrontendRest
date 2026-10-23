import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Package, Plus, AlertTriangle, Tag, Search, Pencil, PackagePlus } from 'lucide-react'
import { productApi } from '../../api/index.js'
import { pricingApi, subscriptionApi } from '../../api/v21.js'
import { useAuthStore } from '../../store/authStore.js'
import { Button, Card, Badge, Modal, Input, Select } from '../../components/ui/index.jsx'
import { PageHeader, QueryState } from '../../components/ui/Polish.jsx'
import { formatNaira } from '../../utils/index.js'

const CATEGORIES = [
  ['groceries', 'Groceries and foodstuff'], ['fashion', 'Fashion and textiles'], ['electronics', 'Electronics and accessories'],
  ['household', 'Home and household'], ['building', 'Building materials and hardware'], ['agriculture', 'Agriculture and farm inputs'],
  ['industrial', 'Industrial and commercial supplies'], ['office', 'Office, school and business supplies'],
].map(([value, label]) => ({ value, label }))
const FLOORS = [{ value: 'LEVEL_1', label: 'Level 1' }, { value: 'LEVEL_2', label: 'Level 2' }]
const EMPTY = { name: '', descriptionText: '', baseNaira: '', stock: '', categorySlug: 'groceries', buildingFloor: 'LEVEL_1', unit: 'piece', minimumOrderQuantity: '1', imageUrl: '', bulkMinQty: '', bulkNaira: '' }
const err = (e, fallback) => e?.response?.data?.message || fallback
const toKobo = (naira) => Math.round(Number(naira) * 100)

export default function ProductManager() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // { product, naira }
  const [restocking, setRestocking] = useState(null) // { product, units }

  const list = useQuery({ queryKey: ['my-listings'], queryFn: () => productApi.getMyListings().then((r) => r.data) })
  const plan = useQuery({ queryKey: ['my-plan'], queryFn: () => subscriptionApi.me().then((r) => r.data.data), retry: false })
  const pricing = useQuery({ queryKey: ['pricing-info', form.buildingFloor], queryFn: () => pricingApi.info({ floor: form.buildingFloor }).then((r) => r.data), staleTime: 300000 })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['my-listings'] }); qc.invalidateQueries({ queryKey: ['my-plan'] }) }

  const products = list.data?.products || []
  const productsLimit = plan.data?.limits?.products
  const used = plan.data?.usage?.products ?? products.length

  const create = useMutation({
    mutationFn: (body) => productApi.create(body),
    onSuccess: ({ data }) => { toast.success(`Published. Customers pay ${formatNaira(data.priceKobo)}.`); setModal(false); setForm(EMPTY); setErrors({}); refresh() },
    onError: (e) => toast.error(err(e, 'Could not publish')),
  })
  const toggle = useMutation({ mutationFn: (p) => productApi.toggle(p._id, !p.isActive), onSuccess: refresh, onError: (e) => toast.error(err(e, 'Could not update')) })
  const reprice = useMutation({
    mutationFn: ({ product, naira }) => productApi.updatePrice(product._id, toKobo(naira)),
    onSuccess: () => { toast.success('Price updated'); setEditing(null); refresh() },
    onError: (e) => toast.error(err(e, 'Could not update the price')),
  })
  const restock = useMutation({
    mutationFn: ({ product, units }) => productApi.restock(product._id, Number(units)),
    onSuccess: () => { toast.success('Stock updated'); setRestocking(null); refresh() },
    onError: (e) => toast.error(err(e, 'Could not restock')),
  })

  const node = user?.assignedState
  const ratePct = pricing.data?.myRatePct ?? null // the server works out the real markup for your market, tier and floor
  const preview = (naira) => (ratePct != null && Number(naira) > 0 ? Math.round(toKobo(naira) * (1 + ratePct / 100)) : null)

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (form.name.trim().length < 3) next.name = 'Enter at least 3 characters'
    if (!(Number(form.baseNaira) > 0)) next.baseNaira = 'Enter the price you want to receive'
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Enter the stock quantity'
    setErrors(next)
    if (Object.keys(next).length) return
    create.mutate({
      name: form.name.trim(), descriptionText: form.descriptionText, basePriceKobo: toKobo(form.baseNaira), initialStock: Number(form.stock),
      categorySlug: form.categorySlug, buildingFloor: form.buildingFloor, unit: form.unit || 'piece',
      minimumOrderQuantity: Number(form.minimumOrderQuantity) || 1, imageUrls: form.imageUrl ? [form.imageUrl.trim()] : [],
      bulkPricingTiers: Number(form.bulkMinQty) > 1 && Number(form.bulkNaira) > 0 ? [{ minQty: Number(form.bulkMinQty), priceKobo: toKobo(form.bulkNaira) }] : [],
    })
  }

  const shown = products.filter((p) => {
    if (filter === 'active' && !p.isActive) return false
    if (filter === 'inactive' && p.isActive) return false
    if (filter === 'low' && p.stock > 10) return false
    return !search || p.name.toLowerCase().includes(search.toLowerCase())
  })
  const atLimit = productsLimit != null && used >= productsLimit

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Product Manager" title="Marketplace inventory" description={`${user?.name} · ${node}`}
        actions={<Button disabled={atLimit} icon={<Plus className="w-4 h-4" />} onClick={() => { setForm(EMPTY); setErrors({}); setModal(true) }}>Add product</Button>} />

      {plan.data && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-m">Plan: <b className="text-text-p">{plan.data.limits.label}</b> · {used} of {productsLimit ?? 'unlimited'} products used</p>
          {atLimit && <a href="/dashboard/merchant/subscription" className="btn btn-secondary btn-sm">Upgrade to add more</a>}
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[['Products', products.length, Package, 'text-brass'], ['Active', products.filter((p) => p.isActive).length, Tag, 'text-success'], ['Low stock', products.filter((p) => p.stock <= 10).length, AlertTriangle, 'text-warning']].map(([label, value, Icon, color]) => (
          <Card key={label} className="p-4"><div className="flex items-center gap-3"><Icon className={`w-5 h-5 ${color}`} /><div><p className="text-2xl font-bold text-text-p">{value}</p><p className="font-mono text-[10px] uppercase tracking-wider text-text-m">{label}</p></div></div></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input icon={Search} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44" options={[{ value: 'all', label: 'All products' }, { value: 'active', label: 'Active only' }, { value: 'inactive', label: 'Inactive' }, { value: 'low', label: 'Low stock (10 or fewer)' }]} />
      </div>

      <QueryState query={list} isEmpty={() => !shown.length} empty={{ title: products.length ? 'No products match your filters' : 'No products listed yet', description: products.length ? undefined : 'Add your first product to start selling.' }}>
        {() => (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {shown.map((p) => (
              <Card key={p._id} className="overflow-hidden p-0">
                <div className="h-36 bg-surface-h relative overflow-hidden">
                  {p.imageUrls?.[0] ? <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-brass/10"><Package className="w-10 h-10 text-brass opacity-40" /></div>}
                  <div className="absolute top-2 left-2 flex gap-1"><Badge color={p.isActive ? 'green' : 'muted'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>{p.stock <= 10 && <Badge color="amber">Low: {p.stock}</Badge>}</div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-text-p truncate">{p.name}</h4>
                  <p className="font-mono text-[10px] text-text-m">{p.categorySlug} · {p.buildingFloor} · {p.marketTier}</p>
                  <div className="text-sm">
                    <p className="text-text-m">You receive <b className="text-text-p">{formatNaira(p.basePriceKobo)}</b></p>
                    <p className="text-text-m">Customers pay <b className="text-brass">{formatNaira(p.priceKobo)}</b></p>
                  </div>
                  <p className="font-mono text-[10px] text-text-m">{p.stock} {p.unit}(s) in stock · {p.soldCount} sold</p>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="secondary" icon={<Pencil className="w-3 h-3" />} onClick={() => setEditing({ product: p, naira: String(p.basePriceKobo / 100) })}>Price</Button>
                    <Button size="sm" variant="secondary" icon={<PackagePlus className="w-3 h-3" />} onClick={() => setRestocking({ product: p, units: '' })}>Restock</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle.mutate(p)}>{p.isActive ? 'Hide' : 'Show'}</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      <Modal open={modal} onClose={() => setModal(false)} title="Add a product" size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Product name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
            <Select label="Category" value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })} options={CATEGORIES} />
          </div>
          <div><label className="input-label">Description</label><textarea className="input resize-none w-full" rows={2} value={form.descriptionText} onChange={(e) => setForm({ ...form, descriptionText: e.target.value })} /></div>
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Your price (₦) *" type="number" min="1" value={form.baseNaira} onChange={(e) => setForm({ ...form, baseNaira: e.target.value })} error={errors.baseNaira}
              hint={preview(form.baseNaira) ? `Customers will pay about ${formatNaira(preview(form.baseNaira))} (platform markup added)` : 'The platform markup is added on top for customers.'} />
            <Input label="Stock *" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} error={errors.stock} />
            <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="piece, bag, carton" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Select label="Floor" value={form.buildingFloor} onChange={(e) => setForm({ ...form, buildingFloor: e.target.value })} options={FLOORS} />
            <Input label="Minimum order" type="number" min="1" value={form.minimumOrderQuantity} onChange={(e) => setForm({ ...form, minimumOrderQuantity: e.target.value })} />
            <Input label="Image link (optional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Bulk discount from (units)" type="number" min="2" value={form.bulkMinQty} onChange={(e) => setForm({ ...form, bulkMinQty: e.target.value })} hint="Optional" />
            <Input label="Your price at that quantity (₦)" type="number" min="1" value={form.bulkNaira} onChange={(e) => setForm({ ...form, bulkNaira: e.target.value })} hint="Must be lower than your normal price" />
          </div>
          <p className="text-xs text-text-m">Your market and who can buy this (shoppers, retailers or wholesalers) come from your verified store type, so they cannot be changed here.</p>
          <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button type="submit" loading={create.isPending}>Publish</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Change price: ${editing?.product.name || ''}`}>
        {editing && <div className="space-y-4">
          <Input label="Your new price (₦)" type="number" min="1" value={editing.naira} onChange={(e) => setEditing({ ...editing, naira: e.target.value })}
            hint={preview(editing.naira) ? `Customers will pay about ${formatNaira(preview(editing.naira))}` : ''} />
          {editing.product.priceEditWaitHours > 0 && <p className="text-xs text-warning">Basic plan: next price change possible in about {editing.product.priceEditWaitHours} hour(s).</p>}
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button loading={reprice.isPending} onClick={() => reprice.mutate(editing)}>Save price</Button></div>
        </div>}
      </Modal>

      <Modal open={Boolean(restocking)} onClose={() => setRestocking(null)} title={`Restock: ${restocking?.product.name || ''}`}>
        {restocking && <div className="space-y-4">
          <Input label="Units to add" type="number" min="1" value={restocking.units} onChange={(e) => setRestocking({ ...restocking, units: e.target.value })} hint={`Currently ${restocking.product.stock} in stock`} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setRestocking(null)}>Cancel</Button><Button loading={restock.isPending} onClick={() => restock.mutate(restocking)}>Add stock</Button></div>
        </div>}
      </Modal>
    </div>
  )
}
