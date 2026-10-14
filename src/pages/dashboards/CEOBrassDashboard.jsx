import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, CheckCircle, LockKeyhole, Radio, RefreshCw, Wallet, XCircle } from 'lucide-react'
import { ceoApi } from '../../api/index.js'
import { Card, EmptyState, Skeleton, StatCard, StatusBadge } from '../../components/ui/index.jsx'
import { formatKobo } from '../../utils/tracking.js'
import toast from 'react-hot-toast'

export default function CEOBrassDashboard() {
  const qc = useQueryClient()
  const [events, setEvents] = useState([])
  const metrics = useQuery({ queryKey: ['ceo-contract-metrics'], queryFn: () => ceoApi.metrics().then(r => r.data), refetchInterval: 60000 })
  const telemetry = useQuery({ queryKey: ['ceo-contract-telemetry'], queryFn: () => ceoApi.telemetry().then(r => r.data), refetchInterval: 60000 })
  const kycQueue = useQuery({ queryKey: ['ceo-kyc-queue'], queryFn: () => ceoApi.kycQueue({ status: 'PENDING', limit: 20 }).then(r => r.data), refetchInterval: 60000 })
  const data = metrics.data || {}
  const ledgerRows = Array.isArray(data.escrowLedger) ? data.escrowLedger : []
  const ledgerTotal = (type) => ledgerRows.filter(r => String(r._id).toUpperCase().includes(type)).reduce((n, r) => n + (r.amountKobo || 0), 0)
  const kyc = kycQueue.data?.users || []
  const payoutCount = data.payoutQueue?.count ?? 0
  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['ceo-contract-metrics'] })
    qc.invalidateQueries({ queryKey: ['ceo-contract-telemetry'] })
    qc.invalidateQueries({ queryKey: ['ceo-kyc-queue'] })
  }
  const adjudicate = useMutation({
    mutationFn: ({ id, action }) => {
      const payload = { targetUserId: id, action }
      if (action === 'REJECT') {
        const reason = window.prompt('Reason for rejecting this KYC submission?')
        if (!reason) return Promise.reject(new Error('cancelled'))
        payload.rejectionReason = reason
      }
      return ceoApi.adjudicate(payload)
    },
    onSuccess: () => { toast.success('KYC queue updated'); refreshAll() },
    onError: e => { if (e.message !== 'cancelled') toast.error(e.response?.data?.message || 'Adjudication failed') },
  })
  const revoke = useMutation({
    mutationFn: id => {
      const reason = window.prompt("Reason for revoking this user's access?")
      if (!reason) return Promise.reject(new Error('cancelled'))
      return ceoApi.revokeAccess({ targetUserId: id, reason })
    },
    onSuccess: () => { toast.success('Access revoked'); refreshAll() },
    onError: e => { if (e.message !== 'cancelled') toast.error(e.response?.data?.message || 'Revoke failed') },
  })

  useEffect(() => { const incoming = telemetry.data?.events || []; if (Array.isArray(incoming)) setEvents(incoming.slice(0, 8)) }, [telemetry.data])

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="section-label mb-1">GIMBIYA COS / Brass</p><h1 className="font-display text-3xl font-bold text-text-p">Executive Command</h1><p className="text-text-m mt-1">Platform-wide treasury, KYC, and live operations.</p></div><button onClick={refreshAll} className="btn-icon" title="Refresh metrics"><RefreshCw className="w-4 h-4" /></button></header>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCard label="Platform GMV" value={formatKobo(data.platformGmvKobo ?? 0)} icon={Activity} /><StatCard label="Escrow locked" value={formatKobo(ledgerTotal('LOCK'))} icon={LockKeyhole} color="text-warning" /><StatCard label="Escrow released" value={formatKobo(ledgerTotal('RELEASE'))} icon={CheckCircle} color="text-success" /><StatCard label="Payout queue" value={payoutCount.toLocaleString()} icon={Wallet} color="text-role-affiliate" /></div>
    <Card><div className="flex items-center justify-between mb-4"><p className="section-label">Live telemetry</p><span className="flex items-center gap-2 text-xs text-success"><Radio className="w-3 h-3" /> LIVE</span></div>{telemetry.isLoading ? <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div> : !events.length ? <EmptyState icon={Activity} title="No live events" description="Order and inventory events will appear here." /> : <div className="space-y-2">{events.map((event, index) => <div key={event.data?._id ? `${event.event}-${event.data._id}` : index} className="flex items-center justify-between gap-3 p-3 bg-midnight border border-border rounded-btn"><div><p className="text-sm text-text-p">{event.event || event.type || 'Platform event'}</p><p className="text-xs text-text-m">{event.data?.orderRef || event.data?.name || event.data?._id || 'Telemetry received'}</p></div><span className="text-[10px] text-text-d">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString('en-NG') : 'NOW'}</span></div>)}</div>}</Card>
    <Card><div className="mb-4"><p className="section-label">KYC adjudication queue</p><p className="text-xs text-warning mt-1">{kyc.length} awaiting decision</p></div>{!kyc.length ? <EmptyState icon={CheckCircle} title="Queue clear" description="No pending KYC adjudication." /> : <div className="space-y-2">{kyc.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-midnight border border-border rounded-btn"><div><p className="text-sm text-text-p">{item.name || item.email || 'Applicant'}</p><p className="text-xs text-text-m">{item.role || 'User'} · {item.assignedState || 'Platform'}</p></div><div className="flex items-center gap-2"><StatusBadge status={item.kycStatus || 'PENDING'} /><button className="btn-icon !text-success" title="Approve KYC" onClick={() => adjudicate.mutate({ id: item._id, action: 'APPROVE' })}><CheckCircle className="w-4 h-4" /></button><button className="btn-icon !text-danger" title="Reject KYC" onClick={() => adjudicate.mutate({ id: item._id, action: 'REJECT' })}><XCircle className="w-4 h-4" /></button><button className="btn-icon !text-warning" title="Revoke access" onClick={() => revoke.mutate(item._id)}><LockKeyhole className="w-4 h-4" /></button></div></div>)}</div>}</Card>
  </div>
}
