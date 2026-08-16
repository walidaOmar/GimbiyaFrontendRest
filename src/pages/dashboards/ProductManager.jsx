import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore.js'
import { productApi } from '../../api/index.js'
import { Button, Card, Badge, Modal, Input, Select, Spinner } from '../../components/ui/index.jsx'
import {
  Package, Plus, Pencil, Trash2, DollarSign, AlertTriangle, Tag, Search,
} from 'lucide-react'
import { formatNaira } from '../../utils/index.js'
import toast from 'react-hot-toast'

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  priceKobo: '',
  stock: '',
  category: '',
  assignedState: 'Ado bayero mall',
  buildingFloor: 'LEVEL_1',
  imageUrl: '',
  isActive: true,
}

export default function ProductManager() {
  const { user } = useAuthStore()
  const [products, setProducts] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [formErrors, setFormErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const [{ data: listData }, { data: analData }] = await Promise.all([
        productApi.getMyListings(),
        productApi.getAnalytics(),
      ])
      setProducts(listData.listings || listData.products || [])
      setAnalytics(analData)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const validateForm = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Product name is required'
    if (!form.priceKobo || Number(form.priceKobo) <= 0) errors.priceKobo = 'Valid price is required'
    if (form.stock === '' || Number(form.stock) < 0) errors.stock = 'Valid stock quantity is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const payload = {
        ...form,
        priceKobo: Number(form.priceKobo),
        stock: Number(form.stock),
      }

      if (editingProduct) {
        await productApi.update(editingProduct._id, payload)
        toast.success('Product updated')
      } else {
        await productApi.create(payload)
        toast.success('Product created')
      }

      setModalOpen(false)
      setEditingProduct(null)
      setForm(EMPTY_PRODUCT)
      setFormErrors({})
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setForm({
      ...EMPTY_PRODUCT,
      ...product,
      priceKobo: String((product.priceKobo || 0) / 100),
      stock: product.stock?.toString() || '0',
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await productApi.delete(id)
      toast.success('Product deleted')
      setDeleteConfirm(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleToggleActive = async (product) => {
    try {
      await productApi.toggle(product._id, !product.isActive)
      toast.success(product.isActive ? 'Product deactivated' : 'Product activated')
      fetchProducts()
    } catch (err) {
      toast.error('Toggle failed')
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === 'active' && !p.isActive) return false
      if (statusFilter === 'inactive' && p.isActive) return false
      if (statusFilter === 'low' && (p.stock || 0) > 10) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
      }
      return true
    })
  }, [products, statusFilter, searchQuery])

  const totalRevenue = analytics?.topProducts?.reduce((sum, p) => sum + (p.merchantNetNaira || 0), 0) || 0
  const lowStockCount = products.filter((p) => (p.stock || 0) <= 10).length

  if (loading && !products.length) {
    return <div className="min-h-screen bg-midnight flex items-center justify-center"><Spinner size={12} /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1">Product Manager</p>
        <h1 className="font-display text-3xl font-bold text-text-p">Marketplace Inventory</h1>
        <p className="font-mono text-xs text-text-m mt-1">{user?.name} · {user?.assignedState}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: 'text-brass' },
          { label: 'Active', value: products.filter((p) => p.isActive).length, icon: Tag, color: 'text-success' },
          { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-warning' },
          { label: 'Revenue', value: formatNaira(totalRevenue), icon: DollarSign, color: 'text-blue' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-2xl font-bold text-text-p">{value}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-m">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-m" />
            <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64 bg-midnight border-border" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40 bg-midnight border-border">
            <option value="all">All Products</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="low">Low Stock (≤10)</option>
          </Select>
        </div>
        <Button onClick={() => { setEditingProduct(null); setForm(EMPTY_PRODUCT); setModalOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <Card key={p._id} className="overflow-hidden group p-0">
            <div className="h-40 bg-surface-h relative overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brass/10"><Package className="w-10 h-10 text-brass opacity-40" /></div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(p)} className="p-1.5 bg-midnight/70 rounded-btn hover:bg-brass hover:text-midnight transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleteConfirm(p)} className="p-1.5 bg-midnight/70 rounded-btn hover:bg-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
              <Badge color={p.isActive ? 'green' : 'muted'} className="absolute top-2 left-2">{p.isActive ? 'Active' : 'Inactive'}</Badge>
              {(p.stock || 0) <= 10 && <Badge color="amber" className="absolute bottom-2 left-2">Low Stock: {p.stock}</Badge>}
            </div>
            <div className="p-4">
              <h4 className="font-body font-semibold text-text-p mb-1 truncate">{p.name}</h4>
              <p className="font-mono text-[10px] text-text-m mb-2">{p.category || 'Uncategorized'} · {p.assignedState} · {p.buildingFloor}</p>
              <div className="flex justify-between items-center">
                <p className="font-mono font-bold text-brass">{formatNaira((p.priceKobo || 0) / 100)}</p>
                <p className="font-mono text-[10px] text-text-m">{p.stock} in stock</p>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between">
                <Button variant="secondary" onClick={() => handleToggleActive(p)}>{p.isActive ? 'Deactivate' : 'Activate'}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!filteredProducts.length && (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-text-m mx-auto mb-4" />
          <p className="text-text-m text-lg mb-2">{products.length ? 'No products match your filters.' : 'No products listed yet.'}</p>
          {!products.length && (
            <>
              <p className="text-text-m/70 text-sm mb-6">Your marketplace is empty. Add your first product to start selling.</p>
              <Button onClick={() => { setEditingProduct(null); setForm(EMPTY_PRODUCT); setModalOpen(true) }}>
                <Plus className="w-4 h-4 mr-2" /> Add First Product
              </Button>
            </>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingProduct(null); setFormErrors({}) }} title={editingProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Product Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={formErrors.name} />
            </div>
            <div>
              <label className="input-label">Category</label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics, Fashion" />
            </div>
          </div>

          <div>
            <label className="input-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Price (₦) *</label>
              <Input type="number" value={form.priceKobo} onChange={(e) => setForm({ ...form, priceKobo: e.target.value })} error={formErrors.priceKobo} />
            </div>
            <div>
              <label className="input-label">Stock Quantity *</label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} error={formErrors.stock} />
            </div>
            <div>
              <label className="input-label">Image URL</label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Assigned State</label>
              <Select value={form.assignedState} onChange={(e) => setForm({ ...form, assignedState: e.target.value })} className="bg-midnight border-border">
                <option value="Ado bayero mall">Ado Bayero Mall</option>
                <option value="Tafawa balewa refinery">Tafawa Balewa Refinery</option>
                <option value="Sardauna market">Sardauna Market</option>
              </Select>
            </div>
            <div>
              <label className="input-label">Building Floor</label>
              <Select value={form.buildingFloor} onChange={(e) => setForm({ ...form, buildingFloor: e.target.value })} className="bg-midnight border-border">
                <option value="LEVEL_1">Level 1</option>
                <option value="LEVEL_2">Level 2</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-brass" />
            <label htmlFor="isActive" className="text-sm text-text-m">Active (visible in marketplace)</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditingProduct(null); setFormErrors({}) }}>Cancel</Button>
            <Button type="submit">{editingProduct ? 'Update Product' : 'Create Product'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <p className="text-text-m mb-4">Delete "{deleteConfirm?.name}"? This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
