import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore.js'
import { propertyApi } from '../../api/index.js'
import { Button, Card, Badge, Modal, Input, Select, Spinner } from '../../components/ui/index.jsx'
import {
  Building2, Users, MessageSquare, TrendingUp, Plus, Pencil, Trash2,
  MapPin, BedDouble, Bath, Maximize, Car, Search, CheckCircle2, Clock,
  Home, Briefcase, LandPlot, Factory,
} from 'lucide-react'
import { formatNaira } from '../../utils/index.js'
import toast from 'react-hot-toast'

const PROPERTY_TYPE_ICONS = {
  residential: Home,
  commercial: Briefcase,
  land: LandPlot,
  industrial: Factory,
}

const EMPTY_PROPERTY = {
  title: '',
  description: '',
  propertyType: 'residential',
  listingType: 'sale',
  address: '',
  city: '',
  state: '',
  priceKobo: '',
  priceNegotiable: false,
  bedrooms: '',
  bathrooms: '',
  squareMeters: '',
  parkingSpaces: '',
  amenities: [],
  imageUrls: [],
  documentUrls: [],
}

const badgeColor = (status) => {
  const s = String(status || 'secondary').toLowerCase()
  if (['active', 'verified', 'closed', 'success'].includes(s)) return 'green'
  if (['new', 'pending', 'warning', 'viewing_scheduled'].includes(s)) return 'amber'
  if (['lost', 'inactive', 'danger', 'rejected'].includes(s)) return 'red'
  if (['contacted', 'negotiating', 'offer_made'].includes(s)) return 'purple'
  return 'muted'
}

export default function PropertyAdminDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState(null)
  const [listings, setListings] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [form, setForm] = useState(EMPTY_PROPERTY)
  const [formErrors, setFormErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [inquiryFilter, setInquiryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const { data } = await propertyApi.getDashboard()
      setDashboardData(data)
      setListings(data.listings || [])
      setInquiries(data.inquiries || [])
      setStaff(data.staff || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const validateForm = () => {
    const errors = {}
    if (!form.title.trim()) errors.title = 'Title is required'
    if (!form.address.trim()) errors.address = 'Address is required'
    if (!form.city.trim()) errors.city = 'City is required'
    if (!form.state.trim()) errors.state = 'State is required'
    if (!form.priceKobo || Number(form.priceKobo) <= 0) errors.priceKobo = 'Valid price is required'
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
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        squareMeters: form.squareMeters ? Number(form.squareMeters) : null,
        parkingSpaces: form.parkingSpaces ? Number(form.parkingSpaces) : null,
        portfolioId: dashboardData?.portfolio?._id,
      }

      if (editingProperty) {
        await propertyApi.update(editingProperty._id, payload)
        toast.success('Property updated')
      } else {
        await propertyApi.create(payload)
        toast.success('Property created')
      }

      setModalOpen(false)
      setEditingProperty(null)
      setForm(EMPTY_PROPERTY)
      setFormErrors({})
      fetchDashboard()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const handleEdit = (property) => {
    setEditingProperty(property)
    setForm({
      ...EMPTY_PROPERTY,
      ...property,
      priceKobo: String((property.priceKobo || 0) / 100),
      bedrooms: property.bedrooms?.toString() || '',
      bathrooms: property.bathrooms?.toString() || '',
      squareMeters: property.squareMeters?.toString() || '',
      parkingSpaces: property.parkingSpaces?.toString() || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await propertyApi.delete(id)
      toast.success('Property deleted')
      setDeleteConfirm(null)
      fetchDashboard()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleAssignInquiry = async (inquiryId, diId) => {
    try {
      await propertyApi.assignInquiry(inquiryId, { dealInitiatorId: diId })
      toast.success('Inquiry assigned')
      fetchDashboard()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed')
    }
  }

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((i) => {
      if (inquiryFilter !== 'all' && i.status !== inquiryFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          i.buyerId?.name?.toLowerCase().includes(q) ||
          i.propertyId?.title?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [inquiries, inquiryFilter, searchQuery])

  const stats = dashboardData?.stats || {}

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <Spinner size={12} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1">Property Management</p>
        <h1 className="font-display text-3xl font-bold text-text-p">Portfolio Dashboard</h1>
        <p className="font-mono text-xs text-text-m mt-1">{user?.name} · {dashboardData?.portfolio?.businessName || 'Portfolio'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Listings', value: stats.totalListings || 0, icon: Building2, color: 'text-brass' },
          { label: 'Active', value: stats.activeListings || 0, icon: CheckCircle2, color: 'text-success' },
          { label: 'Sold', value: stats.soldListings || 0, icon: TrendingUp, color: 'text-blue' },
          { label: 'Inquiries', value: stats.totalInquiries || 0, icon: MessageSquare, color: 'text-purple' },
          { label: 'New Leads', value: stats.newInquiries || 0, icon: Clock, color: 'text-warning' },
          { label: 'Staff', value: stats.totalStaff || 0, icon: Users, color: 'text-pink-400' },
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

      <div className="flex gap-2 bg-surface border border-border rounded-card p-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'listings', label: 'My Listings' },
          { id: 'inquiries', label: 'Inquiries' },
          { id: 'staff', label: 'Deal Initiators' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-brass text-midnight' : 'text-text-m hover:text-text-p'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-text-p">Recent Listings</h3>
                <Button variant="secondary" onClick={() => setActiveTab('listings')}>View All</Button>
              </div>
              <div className="space-y-3">
                {listings.slice(0, 5).map((p) => {
                  const Icon = PROPERTY_TYPE_ICONS[p.propertyType] || Home
                  return (
                    <div key={p._id} className="flex items-center gap-4 p-3 rounded-btn bg-midnight border border-border">
                      <div className="w-12 h-12 rounded-btn bg-brass/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-brass" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-text-p truncate">{p.title}</p>
                        <p className="font-mono text-[10px] text-text-m flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}, {p.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-brass">{formatNaira((p.priceKobo || 0) / 100)}</p>
                        <Badge color={badgeColor(p.status)}>{p.status}</Badge>
                      </div>
                    </div>
                  )
                })}
                {!listings.length && <p className="text-text-m text-center py-8">No listings yet. Create your first property.</p>}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-display text-xl font-bold text-text-p mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full justify-start gap-2" onClick={() => { setEditingProperty(null); setForm(EMPTY_PROPERTY); setModalOpen(true) }}>
                  <Plus className="w-4 h-4" /> Add New Property
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => setActiveTab('inquiries')}>
                  <MessageSquare className="w-4 h-4" /> View Inquiries
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => setActiveTab('staff')}>
                  <Users className="w-4 h-4" /> Manage Staff
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-display text-xl font-bold text-text-p mb-4">Recent Inquiries</h3>
              <div className="space-y-3">
                {inquiries.slice(0, 5).map((i) => (
                  <div key={i._id} className="p-3 rounded-btn bg-midnight border border-border">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-body text-sm font-medium text-text-p">{i.buyerId?.name || 'Unknown'}</p>
                      <Badge color={badgeColor(i.status)}>{i.status}</Badge>
                    </div>
                    <p className="font-mono text-[10px] text-text-m mt-1">{i.propertyId?.title}</p>
                    {i.buyerBudgetKobo && <p className="font-mono text-[10px] text-brass mt-1">Budget: {formatNaira(i.buyerBudgetKobo / 100)}</p>}
                  </div>
                ))}
                {!inquiries.length && <p className="text-text-m text-center py-4">No inquiries yet.</p>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'listings' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold text-text-p">My Property Listings</h3>
            <Button onClick={() => { setEditingProperty(null); setForm(EMPTY_PROPERTY); setModalOpen(true) }}>
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((p) => {
              const Icon = PROPERTY_TYPE_ICONS[p.propertyType] || Home
              return (
                <Card key={p._id} className="overflow-hidden group p-0">
                  <div className="h-40 relative bg-surface-h overflow-hidden">
                    {p.imageUrls?.[0] ? (
                      <img src={p.imageUrls[0]} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brass/10">
                        <Icon className="w-12 h-12 text-brass opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(p)} className="p-1.5 bg-midnight/70 rounded-btn hover:bg-brass hover:text-midnight transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(p)} className="p-1.5 bg-midnight/70 rounded-btn hover:bg-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <Badge color={badgeColor(p.status)} className="absolute top-2 left-2">{p.status}</Badge>
                  </div>
                  <div className="p-4">
                    <h4 className="font-body font-semibold text-text-p mb-1">{p.title}</h4>
                    <p className="font-mono text-[10px] text-text-m flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" /> {p.address}, {p.city}</p>
                    <div className="flex items-center gap-3 text-[11px] text-text-m mb-3 flex-wrap">
                      {p.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {p.bedrooms}</span>}
                      {p.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {p.bathrooms}</span>}
                      {p.squareMeters && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" /> {p.squareMeters}m²</span>}
                      {p.parkingSpaces && <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {p.parkingSpaces}</span>}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="font-mono font-bold text-brass">{formatNaira((p.priceKobo || 0) / 100)}</p>
                      <p className="font-mono text-[10px] text-text-m">{p.viewCount} views · {p.inquiryCount} inquiries</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {!listings.length && (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-text-m mx-auto mb-4" />
              <p className="text-text-m text-lg mb-2">No properties listed yet</p>
              <p className="text-text-m/70 text-sm mb-6">Start building your portfolio by adding your first property.</p>
              <Button onClick={() => { setEditingProperty(null); setForm(EMPTY_PROPERTY); setModalOpen(true) }}>
                <Plus className="w-4 h-4 mr-2" /> Add First Property
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="font-display text-xl font-bold text-text-p">Buyer Inquiries</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-m" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search buyer or property..." className="pl-9 w-64 bg-midnight border-border" />
              </div>
              <Select value={inquiryFilter} onChange={(e) => setInquiryFilter(e.target.value)} className="w-40 bg-midnight border-border">
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="viewing_scheduled">Viewing</option>
                <option value="negotiating">Negotiating</option>
                <option value="offer_made">Offer Made</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredInquiries.map((i) => (
              <Card key={i._id} className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-body font-semibold text-text-p">{i.buyerId?.name || 'Unknown Buyer'}</p>
                      <Badge color={badgeColor(i.status)}>{i.status}</Badge>
                    </div>
                    <p className="font-mono text-[10px] text-text-m">{i.propertyId?.title}</p>
                    <p className="font-body text-sm text-text-m mt-1">{i.buyerMessage || 'No message'}</p>
                    {i.buyerBudgetKobo && <p className="font-mono text-[10px] text-brass mt-1">Budget: {formatNaira(i.buyerBudgetKobo / 100)}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {i.status === 'new' && (
                      <Select value="" onChange={(e) => e.target.value && handleAssignInquiry(i._id, e.target.value)} className="w-48 bg-midnight border-border text-sm">
                        <option value="">Assign to Deal Initiator...</option>
                        {staff.map((s) => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </Select>
                    )}
                    {i.dealInitiatorId && <p className="font-mono text-[10px] text-text-m">Assigned: {i.dealInitiatorId.name || 'Staff'}</p>}
                  </div>
                </div>
              </Card>
            ))}
            {!filteredInquiries.length && <p className="text-text-m text-center py-12">No inquiries match your filters.</p>}
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div>
          <h3 className="font-display text-xl font-bold text-text-p mb-4">Deal Initiators</h3>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {staff.map((s) => (
              <Card key={s._id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brass/10 flex items-center justify-center text-brass font-bold">{s.name?.charAt(0)?.toUpperCase() || 'D'}</div>
                  <div>
                    <p className="font-body font-semibold text-text-p">{s.name}</p>
                    <p className="font-mono text-[10px] text-text-m">{s.email}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between text-[11px] text-text-m">
                  <span>{s.phone || 'No phone'}</span>
                  <Badge color={s.isActive ? 'green' : 'red'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </Card>
            ))}
          </div>
          {!staff.length && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-text-m mx-auto mb-3" />
              <p className="text-text-m">No deal initiators yet. They are created during onboarding.</p>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingProperty(null); setFormErrors({}) }} title={editingProperty ? 'Edit Property' : 'Add New Property'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={formErrors.title} />
            </div>
            <div>
              <label className="input-label">Property Type *</label>
              <Select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className="bg-midnight border-border">
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="industrial">Industrial</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="input-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Listing Type *</label>
              <Select value={form.listingType} onChange={(e) => setForm({ ...form, listingType: e.target.value })} className="bg-midnight border-border">
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="lease">For Lease</option>
              </Select>
            </div>
            <div>
              <label className="input-label">Price (₦) *</label>
              <Input type="number" value={form.priceKobo} onChange={(e) => setForm({ ...form, priceKobo: e.target.value })} error={formErrors.priceKobo} />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input type="checkbox" id="negotiable" checked={form.priceNegotiable} onChange={(e) => setForm({ ...form, priceNegotiable: e.target.checked })} className="w-4 h-4 accent-brass" />
              <label htmlFor="negotiable" className="text-sm text-text-m">Price Negotiable</label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Address *</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={formErrors.address} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">City *</label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={formErrors.city} />
              </div>
              <div>
                <label className="input-label">State *</label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} error={formErrors.state} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="input-label">Bedrooms</label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
            <div><label className="input-label">Bathrooms</label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
            <div><label className="input-label">Sq Meters</label><Input type="number" value={form.squareMeters} onChange={(e) => setForm({ ...form, squareMeters: e.target.value })} /></div>
            <div><label className="input-label">Parking</label><Input type="number" value={form.parkingSpaces} onChange={(e) => setForm({ ...form, parkingSpaces: e.target.value })} /></div>
          </div>

          <div>
            <label className="input-label">Image URLs (comma separated)</label>
            <Input value={form.imageUrls.join(', ')} onChange={(e) => setForm({ ...form, imageUrls: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} placeholder="https://..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditingProperty(null); setFormErrors({}) }}>Cancel</Button>
            <Button type="submit">{editingProperty ? 'Update Property' : 'Create Property'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <p className="text-text-m mb-4">Delete "{deleteConfirm?.title}"? This will also remove associated inquiries.</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
