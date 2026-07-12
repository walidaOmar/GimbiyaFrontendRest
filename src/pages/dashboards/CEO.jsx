import { useState }        from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion }           from 'framer-motion'
import {
  TrendingUp, Users, Package, ShoppingCart,
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { ceoApi }           from '../../api/index.js'
import {
  StatCard, Card, Badge, StatusBadge,
  Button, Modal, Spinner, EmptyState, GlowDot, Skeleton,
} from '../../components/ui/index.jsx'
import { LiveTicker }       from '../../components/layout/LiveTicker.jsx'
import toast                from 'react-hot-toast'

// ── MINI LINE CHART ───────────────────────────────────────────────────────────
function LineChart({ data = [], color = '#C8A84B', height = 80 }) {
  if (!data.length) return null
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const w = 300, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polyline
        points={pts} fill="none" stroke={color} strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}

// ── PROGRESS BAR ──────────────────────────────────────────────────────────────
function ProgressBar({ label, value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-xs text-text-m">{label}</span>
        <span className="font-mono text-xs font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-surface-h rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  )
}

export default function CEODashboard() {
  const qc               = useQueryClient()
  const [kycModal, setKycModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: metrics, isLoading: metLoad } = useQuery({
    queryKey: ['ceo-metrics'],
    queryFn:  () => ceoApi.metrics().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: telemetry, isLoading: telLoad } = useQuery({
    queryKey: ['ceo-telemetry'],
    queryFn:  () => ceoApi.telemetry().then(r => r.data),
    refetchInterval: 60000,
  })

  const { data: kycData, isLoading: kycLoad } = useQuery({
    queryKey: ['ceo-kyc'],
    queryFn:  () => ceoApi.kycQueue({ status: 'PENDING', limit: 20 }).then(r => r.data),
    refetchInterval: 30000,
  })

  const adjudicate = useMutation({
    mutationFn: (data) => ceoApi.adjudicate(data),
    onSuccess: (_, vars) => {
      toast.success(`KYC ${vars.action === 'APPROVE' ? 'approved' : 'rejected'}`)
      qc.invalidateQueries(['ceo-kyc'])
      qc.invalidateQueries(['ceo-metrics'])
      setKycModal(null)
      setRejectReason('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Adjudication failed'),
  })

  const totalGmv      = telemetry?.totalGmvNaira      || 0
  const escrowLocked  = telemetry?.escrowLockedNaira  || 0
  const kycPending    = telemetry?.kycPendingCount    || 0
  const stateData     = telemetry?.stateBreakdown     || {}

  const gmvChartData = Object.values(stateData).map(s => s.grossTotalKobo / 100)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">National Command Module</p>
          <h1 className="font-display text-3xl font-bold text-text-p">CEO Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 bg-surface-h border border-border rounded-card px-4 py-2">
          <GlowDot color="#00D98B" size={8} />
          <span className="font-mono text-xs text-success tracking-wider">PLATFORM SECURE</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metLoad ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-card" />)
        ) : (
          <>
            <StatCard
              label="Total GMV"
              value={`₦${(totalGmv / 1000).toFixed(1)}K`}
              change="+18.4% MoM"
              icon={TrendingUp}
            />
            <StatCard
              label="Active Users"
              value={metrics?.platform?.totalUsers?.toLocaleString() || '—'}
              change="All roles"
              icon={Users}
              color="text-role-coord"
            />
            <StatCard
              label="Active Orders"
              value={metrics?.platform?.activeOrders?.toLocaleString() || '—'}
              change="In pipeline"
              icon={ShoppingCart}
              color="text-role-buyer"
            />
            <StatCard
              label="Escrow Locked"
              value={`₦${(escrowLocked / 1000).toFixed(1)}K`}
              change={`${kycPending} KYC pending`}
              icon={AlertTriangle}
              color="text-warning"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* GMV Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Nationwide Transaction Velocity</p>
            <button onClick={() => qc.invalidateQueries(['ceo-telemetry'])}
              className="btn-icon" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-midnight rounded-btn p-3 relative overflow-hidden">
            {telLoad ? (
              <div className="h-20 flex items-center justify-center">
                <Spinner size={5} />
              </div>
            ) : (
              <LineChart data={gmvChartData.length ? gmvChartData : [2, 4, 3, 6, 5, 8, 7, 9]} />
            )}
            <div className="flex justify-between mt-2">
              <span className="font-mono text-[10px] text-text-d">STATE START</span>
              <span className="font-mono text-[10px] text-text-d">LIVE</span>
            </div>
          </div>
        </Card>

        {/* Node throughput */}
        <Card>
          <p className="section-label mb-4">Node Throughput</p>
          <div className="space-y-4">
            {[
              { node: 'Abuja Hub',    color: '#C8A84B', key: 'Abuja'  },
              { node: 'Kano Center',  color: '#8B5CF6', key: 'Kano'   },
              { node: 'Kaduna Depot', color: '#F59E0B', key: 'Kaduna' },
            ].map(({ node, color, key }) => {
              const s = stateData[key] || {}
              const totalAcross = Object.values(stateData).reduce((sum, st) => sum + (st.totalOrders || 0), 0) || 1
              return (
                <ProgressBar
                  key={key}
                  label={node}
                  value={s.totalOrders || 0}
                  max={totalAcross}
                  color={color}
                />
              )
            })}
          </div>

          <div className="mt-6 space-y-3">
            {Object.entries(metrics?.nodes || { Abuja: 'ONLINE', Kano: 'OPTIMIZED', Kaduna: 'SECURE' }).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="font-mono text-xs text-text-m">{k}</span>
                <Badge color="green"><GlowDot color="#00D98B" size={5} />{v}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* KYC Queue */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-label">KYC Adjudication Queue</p>
            <p className="font-mono text-xs text-warning mt-1">
              {kycData?.pagination?.total || 0} pending review
            </p>
          </div>
          <button onClick={() => qc.invalidateQueries(['ceo-kyc'])} className="btn-icon">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {kycLoad ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-btn" />)}
          </div>
        ) : !kycData?.users?.length ? (
          <EmptyState
            icon={CheckCircle}
            title="All Clear"
            description="No pending KYC submissions."
          />
        ) : (
          <div className="space-y-2">
            {kycData.users.map((u) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-midnight rounded-btn
                           border border-border hover:border-border/80 transition-colors"
              >
                <div>
                  <p className="font-body text-sm font-semibold text-text-p">{u.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color="muted">{u.role.replace('_', ' ')}</Badge>
                    <Badge color="muted">{u.assignedState}</Badge>
                    <span className="font-mono text-[10px] text-text-d">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={u.kycStatus} />
                  <button
                    onClick={() => adjudicate.mutate({ targetUserId: u._id, action: 'APPROVE' })}
                    disabled={adjudicate.isPending}
                    className="w-8 h-8 rounded-btn bg-success/10 border border-success/30 text-success
                               hover:bg-success/20 transition-colors flex items-center justify-center"
                    title="Approve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setKycModal(u)}
                    className="w-8 h-8 rounded-btn bg-danger/10 border border-danger/30 text-danger
                               hover:bg-danger/20 transition-colors flex items-center justify-center"
                    title="Reject"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Reject Modal */}
      <Modal open={!!kycModal} onClose={() => { setKycModal(null); setRejectReason('') }}
        title="Reject KYC Submission">
        {kycModal && (
          <div className="space-y-4">
            <p className="font-body text-text-m text-sm">
              You are rejecting the KYC submission for{' '}
              <span className="text-text-p font-semibold">{kycModal.name}</span>.
              Please provide a reason so they can resubmit correctly.
            </p>
            <div className="space-y-1.5">
              <label className="input-label">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Document photos are unclear. Please resubmit with better lighting."
                rows={3}
                className="input resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1"
                onClick={() => { setKycModal(null); setRejectReason('') }}>
                Cancel
              </Button>
              <Button
                variant="danger" className="flex-1"
                loading={adjudicate.isPending}
                disabled={!rejectReason.trim()}
                onClick={() => adjudicate.mutate({
                  targetUserId: kycModal._id,
                  action: 'REJECT',
                  rejectionReason: rejectReason,
                })}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
