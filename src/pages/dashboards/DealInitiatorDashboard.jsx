import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore.js'
import { propertyApi } from '../../api/index.js'
import { Card, Badge, Button, Select, Input } from '../../components/ui/index.jsx'
import {
  Target, CheckCircle2, Clock, DollarSign, TrendingUp, MessageSquare,
  Calendar, MapPin, Home, User, Phone, Mail, Send,
} from 'lucide-react'
import { formatNaira } from '../../utils/index.js'
import toast from 'react-hot-toast'

const badgeColor = (status) => {
  const s = String(status || '').toLowerCase()
  if (['closed', 'success', 'approved'].includes(s)) return 'green'
  if (['new', 'pending', 'viewing_scheduled'].includes(s)) return 'amber'
  if (['lost'].includes(s)) return 'red'
  if (['negotiating', 'offer_made', 'contacted'].includes(s)) return 'purple'
  return 'muted'
}

export default function DealInitiatorDashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const { data } = await propertyApi.getDealInitiatorDashboard()
      setData(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleUpdateStatus = async (inquiryId) => {
    if (!newStatus) return
    try {
      await propertyApi.updateInquiryStatus(inquiryId, {
        status: newStatus,
        note: statusNote || `Status updated to ${newStatus}`,
      })
      toast.success('Status updated')
      setUpdatingId(null)
      setStatusNote('')
      setNewStatus('')
      fetchDashboard()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const stats = data?.stats || {}
  const inquiries = data?.inquiries || []
  const activeDeals = useMemo(() => inquiries.filter((i) => !['closed', 'lost'].includes(i.status)), [inquiries])
  const closedDeals = useMemo(() => inquiries.filter((i) => i.status === 'closed'), [inquiries])

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-brass border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1">Deal Initiator Console</p>
        <h1 className="font-display text-3xl font-bold text-text-p">Buyer Lead Pipeline</h1>
        <p className="font-mono text-xs text-text-m mt-1">{user?.name} · Managing buyer leads & closings</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Deals', value: stats.totalAssigned || 0, icon: Target, color: 'text-brass' },
          { label: 'Active', value: stats.activeDeals || 0, icon: Clock, color: 'text-warning' },
          { label: 'Closed', value: stats.closedDeals || 0, icon: CheckCircle2, color: 'text-success' },
          { label: 'Earnings', value: formatNaira((stats.totalEarnings || 0) / 100), icon: DollarSign, color: 'text-blue' },
          { label: 'Success Rate', value: `${stats.successRate || 0}%`, icon: TrendingUp, color: 'text-purple' },
          { label: 'Pending', value: (stats.totalAssigned || 0) - (stats.closedDeals || 0), icon: MessageSquare, color: 'text-pink-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-xl font-bold text-text-p">{value}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-m">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 bg-surface border border-border rounded-card p-1 overflow-x-auto">
        {[
          { id: 'active', label: `Active Deals (${activeDeals.length})` },
          { id: 'closed', label: `Closed Deals (${closedDeals.length})` },
          { id: 'all', label: `All Inquiries (${inquiries.length})` },
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

      <div className="space-y-4">
        {(activeTab === 'active' ? activeDeals : activeTab === 'closed' ? closedDeals : inquiries).map((i) => (
          <Card key={i._id} className="p-5">
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="xl:w-1/3">
                <div className="h-32 rounded-card bg-surface-h overflow-hidden mb-3">
                  {i.propertyId?.imageUrls?.[0] ? (
                    <img src={i.propertyId.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brass/10"><Home className="w-8 h-8 text-brass opacity-50" /></div>
                  )}
                </div>
                <h4 className="font-body font-semibold text-text-p">{i.propertyId?.title || 'Unknown Property'}</h4>
                <p className="font-mono text-[10px] text-text-m flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {i.propertyId?.address}</p>
                <p className="font-mono text-lg font-bold text-brass mt-2">{formatNaira((i.propertyId?.priceKobo || 0) / 100)}</p>
              </div>

              <div className="xl:w-1/3 xl:border-l xl:border-r xl:border-border xl:px-6">
                <h5 className="font-body text-sm font-medium text-text-m mb-3">Buyer Details</h5>
                <div className="space-y-2">
                  <p className="font-body text-sm text-text-p flex items-center gap-2"><User className="w-4 h-4 text-text-m" /> {i.buyerId?.name || i.buyerName}</p>
                  <p className="font-body text-sm text-text-m flex items-center gap-2"><Mail className="w-4 h-4 text-text-m" /> {i.buyerId?.email || i.buyerEmail}</p>
                  <p className="font-body text-sm text-text-m flex items-center gap-2"><Phone className="w-4 h-4 text-text-m" /> {i.buyerPhone || 'N/A'}</p>
                  {i.buyerBudgetKobo && <p className="font-body text-sm text-brass flex items-center gap-2"><DollarSign className="w-4 h-4" /> Budget: {formatNaira(i.buyerBudgetKobo / 100)}</p>}
                  <p className="font-body text-sm text-text-m mt-2 italic">"{i.buyerMessage || 'No message provided'}"</p>
                </div>
              </div>

              <div className="xl:w-1/3 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge color={badgeColor(i.status)}>{i.status}</Badge>
                  <span className="font-mono text-[10px] text-text-m">{new Date(i.createdAt).toLocaleDateString()}</span>
                </div>

                {i.viewingDate && (
                  <p className="font-mono text-[10px] text-text-m flex items-center gap-1 mb-2"><Calendar className="w-3 h-3" /> Viewing: {new Date(i.viewingDate).toLocaleString()}</p>
                )}

                {i.status !== 'closed' && i.status !== 'lost' && (
                  <div className="space-y-2 mt-4">
                    {updatingId === i._id ? (
                      <>
                        <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full bg-midnight border-border text-sm">
                          <option value="">Select Status...</option>
                          <option value="contacted">Contacted</option>
                          <option value="viewing_scheduled">Viewing Scheduled</option>
                          <option value="negotiating">Negotiating</option>
                          <option value="offer_made">Offer Made</option>
                          <option value="closed">Closed</option>
                          <option value="lost">Lost</option>
                        </Select>
                        <Input placeholder="Add a note..." value={statusNote} onChange={(e) => setStatusNote(e.target.value)} className="w-full bg-midnight border-border text-sm" />
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => handleUpdateStatus(i._id)}><Send className="w-3 h-3 mr-1" /> Update</Button>
                          <Button variant="secondary" onClick={() => { setUpdatingId(null); setNewStatus(''); setStatusNote('') }}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <Button variant="secondary" className="w-full" onClick={() => setUpdatingId(i._id)}>Update Status</Button>
                    )}
                  </div>
                )}

                {i.status === 'closed' && i.agreedPriceKobo && (
                  <div className="mt-4 p-3 rounded-btn bg-success/10 border border-success/30">
                    <p className="font-body text-sm text-success font-medium">Deal Closed</p>
                    <p className="font-mono text-[10px] text-text-m">Agreed: {formatNaira(i.agreedPriceKobo / 100)}</p>
                    {i.commissionKobo && <p className="font-mono text-[10px] text-brass">Commission: {formatNaira(i.commissionKobo / 100)}</p>}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {!(activeTab === 'active' ? activeDeals : activeTab === 'closed' ? closedDeals : inquiries).length && (
          <div className="text-center py-20">
            <Target className="w-16 h-16 text-text-m mx-auto mb-4" />
            <p className="text-text-m text-lg">{activeTab === 'active' ? 'No active deals assigned to you yet.' : 'No deals in this category yet.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
