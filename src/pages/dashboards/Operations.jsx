// ═══════════════════════════════════════════════════════════════════════════
// STOCK MANAGER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
import { useState }        from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion }           from 'framer-motion'
import {
  Warehouse, AlertTriangle, Plus, Minus,
  FileText, CheckCircle, Truck, Link2,
  TrendingUp, Users, RefreshCw, ArrowRight,
} from 'lucide-react'
import { stockApi, deliveryApi, affiliateApi } from '../../api/index.js'
import {
  Card, StatCard, Button, Badge, StatusBadge,
  Modal, Input, EmptyState, Skeleton, Spinner, GlowDot,
} from '../../components/ui/index.jsx'
import toast from 'react-hot-toast'

export function StockDashboard() {
  const qc                = useQueryClient()
  const [selected, setSel] = useState(null)
  const [auditModal, setAudit] = useState(null)
  const [lowOnly, setLowOnly] = useState(false)
  const [adjusting, setAdj] = useState({ reason: 'AUDIT', note: '' })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stock-manifest', lowOnly],
    queryFn:  () => stockApi.manifest({ lowStockOnly: lowOnly, limit: 100 }).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: auditData, isLoading: auditLoad } = useQuery({
    queryKey: ['stock-audit', auditModal?._id],
    queryFn:  () => stockApi.auditLog(auditModal._id, { limit: 30 }).then(r => r.data),
    enabled:  !!auditModal,
  })

  const adjustMut = useMutation({
    mutationFn: (payload) => stockApi.adjust(payload),
    onSuccess: (res) => {
      const d = res.data
      toast.success(`Stock updated: ${d.stockBefore} → ${d.stockAfter}`)
      qc.invalidateQueries(['stock-manifest'])
      setSel(null)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Adjustment failed'),
  })

  const handleAdjust = (productId, delta) => {
    if (!adjusting.reason) { toast.error('Select a reason code'); return }
    adjustMut.mutate({
      productId,
      deltaCount: delta,
      reasonCode: adjusting.reason,
      noteText:   adjusting.note,
    })
  }

  const manifest = data?.manifest || []
  const lowCount = manifest.filter(p => p.isLowStock).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">Warehouse Operations</p>
          <h1 className="font-display text-3xl font-bold text-text-p">Stock Control</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLowOnly(!lowOnly)}
            className={`px-4 py-2 rounded-btn font-mono text-xs border transition-all ${
              lowOnly ? 'bg-warning/10 border-warning text-warning' : 'bg-surface border-border text-text-m hover:text-text-p'
            }`}>
            {lowOnly ? '⚠ Low Stock Only' : 'All Stock'}
          </button>
          <button onClick={() => refetch()} className="btn-icon"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total SKUs"   value={manifest.length} icon={Warehouse} />
        <StatCard label="Low Stock"    value={lowCount} icon={AlertTriangle} color="text-warning" />
        <StatCard label="Threshold"    value={data?.lowStockThreshold || 10} icon={AlertTriangle} color="text-text-m" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Manifest list */}
        <div className="space-y-2">
          <p className="section-label">Inventory Manifest</p>
          {isLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-btn" />)
          ) : !manifest.length ? (
            <EmptyState icon={Warehouse} title="No Products" description="No inventory in your region." />
          ) : (
            manifest.map(p => (
              <motion.div key={p._id}
                onClick={() => setSel(sel => sel?._id === p._id ? null : p)}
                whileHover={{ x: 2 }}
                className={`p-3 rounded-btn border cursor-pointer transition-all ${
                  selected?._id === p._id
                    ? 'bg-success/10 border-success'
                    : 'bg-surface-h border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-semibold text-text-p truncate">{p.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-text-m">{p.assignedState}</span>
                      <span className="font-mono text-[10px] text-text-d">{p.categorySlug}</span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`font-mono text-xl font-bold ${
                      p.stock === 0 ? 'text-danger' : p.isLowStock ? 'text-warning' : 'text-success'
                    }`}>{p.stock}</p>
                    <p className="font-mono text-[10px] text-text-d">{p.stockStatus}</p>
                  </div>
                </div>

                {/* Adjustment panel */}
                {selected?._id === p._id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3"
                    onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {['AUDIT','DAMAGED','RECOUNT','INBOUND'].map(r => (
                        <button key={r}
                          onClick={() => setAdj(a => ({ ...a, reason: r }))}
                          className={`flex-1 py-1 rounded-btn font-mono text-[9px] transition-all ${
                            adjusting.reason === r
                              ? 'bg-brass text-midnight font-bold'
                              : 'bg-midnight border border-border text-text-m hover:text-text-p'
                          }`}>{r}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[-50, -10, 10, 50].map(d => (
                        <button key={d}
                          onClick={() => handleAdjust(p._id, d)}
                          disabled={adjustMut.isPending}
                          className={`py-2.5 rounded-btn font-mono text-sm font-bold transition-all
                            border ${d < 0
                              ? 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20'
                              : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                            }`}>
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAudit(p)}
                        className="flex-1 py-1.5 rounded-btn border border-border text-text-m
                                   font-mono text-xs hover:text-brass hover:border-brass transition-colors">
                        View Audit Log
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Audit log panel (inline) */}
        <div>
          <p className="section-label mb-2">Recent Adjustments</p>
          <Card className="h-[480px] overflow-y-auto">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Warehouse className="w-10 h-10 text-text-d mb-3" />
                <p className="font-mono text-xs text-text-d">Select a product to adjust stock</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-mono text-xs text-text-m">
                  Audit log: <span className="text-text-p">{selected.name}</span>
                </p>
                {/* Quick summary */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-midnight rounded-btn p-2">
                    <p className="font-mono text-[10px] text-text-d">Current Stock</p>
                    <p className="font-mono text-xl font-bold text-brass">{selected.stock}</p>
                  </div>
                  <div className="bg-midnight rounded-btn p-2">
                    <p className="font-mono text-[10px] text-text-d">Status</p>
                    <p className={`font-mono text-sm font-bold ${
                      selected.stock === 0 ? 'text-danger' : selected.isLowStock ? 'text-warning' : 'text-success'
                    }`}>{selected.stockStatus}</p>
                  </div>
                </div>
                <p className="font-mono text-[10px] text-text-d">
                  Click +/- buttons on the left to adjust. Each change is logged permanently.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Audit Log Modal */}
      <Modal open={!!auditModal} onClose={() => setAudit(null)}
        title={`Audit Log — ${auditModal?.name || ''}`} size="lg">
        {auditLoad ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !auditData?.entries?.length ? (
          <EmptyState icon={FileText} title="No Audit Entries" description="No adjustments recorded yet." />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {auditData.entries.map(e => (
              <div key={e._id} className="flex items-center justify-between p-3 bg-midnight rounded-btn border border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge color={e.deltaCount > 0 ? 'green' : 'red'}>
                      {e.deltaCount > 0 ? `+${e.deltaCount}` : e.deltaCount}
                    </Badge>
                    <Badge color="muted">{e.reasonCode}</Badge>
                  </div>
                  <p className="font-mono text-[10px] text-text-d mt-1">
                    {e.stockBefore} → {e.stockAfter} · {e.actorId?.name}
                  </p>
                </div>
                <p className="font-mono text-[10px] text-text-d">
                  {new Date(e.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// DELIVERY RIDER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export function RiderDashboard() {
  const qc                   = useQueryClient()
  const [handoverModal, setHandover] = useState(null)
  const [otp, setOtp]        = useState('')
  const [sigDone, setSigDone] = useState(false)

  const { data: jobsData, isLoading: jobsLoad } = useQuery({
    queryKey: ['rider-jobs'],
    queryFn:  () => deliveryApi.jobs().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: activeData, isLoading: activeLoad } = useQuery({
    queryKey: ['rider-active'],
    queryFn:  () => deliveryApi.active().then(r => r.data),
    refetchInterval: 15000,
  })

  const claimMut = useMutation({
    mutationFn: (orderId) => deliveryApi.claim(orderId),
    onSuccess: () => {
      toast.success('Job claimed! Navigate to pickup.')
      qc.invalidateQueries(['rider-jobs'])
      qc.invalidateQueries(['rider-active'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Job no longer available'),
  })

  const handoverMut = useMutation({
    mutationFn: (data) => deliveryApi.handover(data),
    onSuccess: () => {
      toast.success('Delivery confirmed! Escrow released.')
      setHandover(null)
      setOtp('')
      setSigDone(false)
      qc.invalidateQueries(['rider-active'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid OTP'),
  })

  const handleHandover = () => {
    if (otp.length !== 4) { toast.error('Enter the 4-digit OTP from the buyer'); return }
    handoverMut.mutate({
      orderId:       handoverModal._id,
      submittedOtp:  otp,
      signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    })
  }

  const jobs    = jobsData?.jobs   || []
  const active  = activeData?.deliveries || []

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1">Logistics Fleet Interface</p>
        <h1 className="font-display text-3xl font-bold text-text-p">Rider Console</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Available Jobs"  value={jobs.length}   icon={Truck}        color="text-role-rider" />
        <StatCard label="Active Delivery" value={active.length} icon={CheckCircle}  color="text-warning" />
        <StatCard label="On-Time Rate"    value="96.2%"          icon={TrendingUp}   color="text-success" />
      </div>

      {/* Active Delivery */}
      {active.length > 0 && (
        <div className="space-y-3">
          <p className="section-label">Active Deliveries</p>
          {active.map(order => (
            <Card key={order._id} glow>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge color="amber">IN TRANSIT</Badge>
                  <p className="font-mono text-xs text-text-m mt-1">{order.orderRef}</p>
                  <p className="font-body text-sm text-text-p mt-0.5">{order.shippingAddress}</p>
                </div>
                <p className="font-mono text-sm font-bold text-brass">
                  ₦{(order.grossTotalKobo / 100).toLocaleString()}
                </p>
              </div>
              <Button variant="primary" className="w-full"
                onClick={() => setHandover(order)}
                icon={<CheckCircle className="w-4 h-4" />}>
                Initiate OTP Handover
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Available jobs */}
      <div className="space-y-3">
        <p className="section-label">Job Stream ({jobs.length} available)</p>
        {jobsLoad ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)
        ) : !jobs.length ? (
          <EmptyState icon={Truck} title="No Jobs Available"
            description="New orders in your region will appear here." />
        ) : (
          jobs.map(order => (
            <Card key={order._id} hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-text-m">{order.orderRef}</p>
                  <p className="font-body text-sm text-text-p mt-0.5">{order.shippingAddress}</p>
                  <p className="font-mono text-[10px] text-text-d mt-1">
                    {order.items?.length} item(s) · {order.assignedState}
                  </p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="font-mono text-sm font-bold text-brass">
                    ₦{(order.grossTotalKobo / 100).toLocaleString()}
                  </p>
                  <Button variant="secondary" size="sm" className="mt-2"
                    loading={claimMut.isPending}
                    onClick={() => claimMut.mutate(order._id)}>
                    Claim Job
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* OTP Handover Modal */}
      <Modal open={!!handoverModal} onClose={() => { setHandover(null); setOtp(''); setSigDone(false) }}
        title="Secure OTP Handover">
        {handoverModal && (
          <div className="space-y-4">
            <div className="bg-midnight border border-border rounded-btn p-3">
              <p className="font-mono text-xs text-text-m">Order: {handoverModal.orderRef}</p>
              <p className="font-body text-sm text-text-p mt-1">{handoverModal.shippingAddress}</p>
            </div>

            <div className="space-y-1.5">
              <label className="input-label">4-Digit OTP from Buyer *</label>
              <input
                type="text" maxLength={4}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="input text-center text-3xl tracking-[0.6em] font-mono"
              />
              <p className="font-mono text-[10px] text-text-d text-center">
                Ask the buyer to show you their OTP code
              </p>
            </div>

            <div className="p-3 bg-surface-h border border-border rounded-btn">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sigDone} onChange={e => setSigDone(e.target.checked)}
                  className="rounded" />
                <span className="font-mono text-xs text-text-m">
                  I confirm the buyer has received the package and I have their signature
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setHandover(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1"
                loading={handoverMut.isPending}
                disabled={otp.length !== 4 || !sigDone}
                onClick={handleHandover}
                icon={<CheckCircle className="w-4 h-4" />}>
                Confirm Delivery
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════
// AFFILIATE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export function AffiliateDashboard() {
  const qc               = useQueryClient()
  const [createModal, setCreate] = useState(false)
  const [campaignName, setCName] = useState('')

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['affiliate-analytics'],
    queryFn:  () => affiliateApi.analytics().then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: campaignsData } = useQuery({
    queryKey: ['affiliate-campaigns'],
    queryFn:  () => affiliateApi.campaigns().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => affiliateApi.create({ campaignName }),
    onSuccess: () => {
      toast.success('Campaign created!')
      qc.invalidateQueries(['affiliate-analytics'])
      qc.invalidateQueries(['affiliate-campaigns'])
      setCreate(false)
      setCName('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create'),
  })

  const summary   = analyticsData?.summary   || {}
  const campaigns = campaignsData?.campaigns || analyticsData?.campaigns || []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">Growth Partner Portal</p>
          <h1 className="font-display text-3xl font-bold text-text-p">Affiliate Hub</h1>
        </div>
        <Button variant="primary" onClick={() => setCreate(true)}
          icon={<Plus className="w-4 h-4" />}>
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clicks"       value={(summary.totalClicks || 0).toLocaleString()} icon={TrendingUp}  color="text-role-affiliate" />
        <StatCard label="Conversions"        value={summary.totalConversions || 0}               icon={CheckCircle} color="text-success" />
        <StatCard label="Commission Earned"  value={`₦${((summary.totalCommissionNaira || 0)).toLocaleString()}`} icon={TrendingUp} />
        <StatCard label="Conversion Rate"    value={`${summary.overallCvr || '0.00'}%`}          icon={BarChart2 || TrendingUp} color="text-role-coord" />
      </div>

      {/* Campaigns */}
      <Card>
        <p className="section-label mb-4">Active Campaigns</p>
        {isLoading ? (
          <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-btn" />)}</div>
        ) : !campaigns.length ? (
          <EmptyState icon={Link2} title="No Campaigns"
            description="Create your first campaign to start earning commissions."
            action={<Button variant="primary" onClick={() => setCreate(true)}>Create Campaign</Button>}
          />
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c._id} className="p-4 bg-midnight rounded-btn border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-body text-sm font-semibold text-text-p">{c.campaignName}</p>
                    <p className="font-mono text-xs text-text-m mt-1">Code: <span className="text-brass">{c.code}</span></p>
                    <p className="font-mono text-[10px] text-text-d mt-0.5 break-all">{c.referralUrl}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-mono text-lg font-bold text-brass">
                      ₦{(c.commissionNaira || 0).toLocaleString()}
                    </p>
                    <p className="font-mono text-[10px] text-text-d">commission</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="font-mono text-sm font-bold text-text-p">{c.clicks}</p>
                    <p className="font-mono text-[10px] text-text-d">Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm font-bold text-success">{c.conversions}</p>
                    <p className="font-mono text-[10px] text-text-d">Conversions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm font-bold text-role-affiliate">{c.conversionRate}%</p>
                    <p className="font-mono text-[10px] text-text-d">CVR</p>
                  </div>
                </div>
                {/* CVR bar */}
                <div className="mt-3 h-1.5 bg-surface-h rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-role-affiliate"
                    style={{ width: `${Math.min(100, Number(c.conversionRate) * 10)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Campaign Modal */}
      <Modal open={createModal} onClose={() => { setCreate(false); setCName('') }}
        title="Create Campaign" size="sm">
        <div className="space-y-4">
          <Input label="Campaign Name *"
            placeholder="e.g. Kano Flash Sale June"
            value={campaignName}
            onChange={e => setCName(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setCreate(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1"
              loading={createMut.isPending}
              disabled={!campaignName.trim()}
              onClick={() => createMut.mutate()}>
              Create Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
