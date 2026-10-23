import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { walletApi } from '../../../api/v21.js'
import { PageHeader, QueryState, Tabs } from '../../../components/ui/Polish.jsx'
import { Card, Badge, Button } from '../../../components/ui/index.jsx'
import { formatNaira } from '../../../utils/index.js'

const STATUS_COLOR = { REQUESTED: 'amber', APPROVED: 'blue', PAID: 'green', REJECTED: 'red', FAILED: 'red' }
const KIND = { PLATFORM_REVENUE: 'Platform revenue', UNASSIGNED_RIDER_SHARE: 'Rider share with no rider', SUBSCRIPTION_PAYMENT: 'Subscriptions' }

export default function Withdrawals() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('REQUESTED')
  const list = useQuery({ queryKey: ['withdrawals', tab], queryFn: () => walletApi.adminList({ status: tab }).then((r) => r.data.data), refetchInterval: 20000 })
  const summary = useQuery({ queryKey: ['platform-summary'], queryFn: () => walletApi.adminSummary().then((r) => r.data.data) })
  const done = (text) => () => { toast.success(text); qc.invalidateQueries({ queryKey: ['withdrawals'] }) }
  const fail = (e) => toast.error(e.response?.data?.message || 'Action failed')
  const approve = useMutation({ mutationFn: (id) => walletApi.approve(id), onSuccess: (r) => { toast.success(r.data.message); qc.invalidateQueries({ queryKey: ['withdrawals'] }) }, onError: fail })
  const paid = useMutation({ mutationFn: (id) => walletApi.markPaid(id, 'Paid from Monnify dashboard'), onSuccess: done('Marked as paid'), onError: fail })
  const reject = useMutation({ mutationFn: ({ id, note }) => walletApi.reject(id, note), onSuccess: done('Rejected. The money is back in the wallet.'), onError: fail })
  const askReject = (id) => { const note = window.prompt('Reason for rejecting (the user will see it):'); if (note) reject.mutate({ id, note }) }

  return (
    <div>
      <PageHeader eyebrow="Group HQ" title="Withdrawals" description="Review payout requests. Approving does not move money by itself unless automatic transfers are switched on for your Monnify account." />
      <QueryState query={summary}>{(rows) => rows.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3 mb-5">{rows.map((r) => <Card key={r._id}><p className="section-label">{KIND[r._id] || r._id}</p><p className="font-display text-xl font-bold text-brass">{formatNaira(r.totalKobo)}</p><p className="text-xs text-text-m">{r.count} entries</p></Card>)}</div>)}
      </QueryState>
      <Tabs value={tab} onChange={setTab} tabs={['REQUESTED', 'APPROVED', 'PAID', 'REJECTED'].map((id) => ({ id, label: id[0] + id.slice(1).toLowerCase() }))} />
      <QueryState query={list} isEmpty={(d) => !d?.length} empty={{ title: 'Nothing here' }}>
        {(rows) => <div className="space-y-2">{rows.map((w) => (
          <Card key={w._id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 text-sm"><p className="font-medium text-text-p">{formatNaira(w.amountKobo)} · {w.userId?.name} <span className="text-xs text-text-m">({w.userId?.role})</span></p>
              <p className="text-xs text-text-m">{w.bankName || w.bankCode} · {w.accountNumber} · {w.accountName || 'name not verified'} · {new Date(w.createdAt).toLocaleString()}</p></div>
            <div className="flex items-center gap-2"><Badge color={STATUS_COLOR[w.status]}>{w.status}</Badge>
              {w.status === 'REQUESTED' && <Button size="sm" loading={approve.isPending} onClick={() => approve.mutate(w._id)}>Approve</Button>}
              {w.status === 'APPROVED' && <Button size="sm" loading={paid.isPending} onClick={() => paid.mutate(w._id)}>Mark paid</Button>}
              {['REQUESTED', 'APPROVED'].includes(w.status) && <Button size="sm" variant="ghost" onClick={() => askReject(w._id)}>Reject</Button>}</div>
          </Card>))}</div>}
      </QueryState>
    </div>
  )
}
