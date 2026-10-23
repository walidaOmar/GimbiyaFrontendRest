import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { inviteExtraApi } from '../../../api/v21.js'
import { useAuthStore } from '../../../store/authStore.js'
import { getRegionLabel } from '../../../config/regions.js'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { Card, Badge, Button, Modal } from '../../../components/ui/index.jsx'

const TYPE = { retailer: 'Retailer', wholesaler: 'Wholesaler', manufacturer: 'Manufacturer', service_provider: 'Service Provider' }

export default function PendingMerchants() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canDecide = ['super_admin', 'ceo'].includes(user?.role)
  const [detail, setDetail] = useState(null)
  const list = useQuery({ queryKey: ['pending-merchants'], queryFn: () => inviteExtraApi.pendingMerchants().then((r) => r.data.data) })
  const open = async (id) => { try { setDetail((await inviteExtraApi.merchantDetail(id)).data.data) } catch (e) { toast.error(e.response?.data?.message || 'Could not open') } }
  const done = (text) => () => { toast.success(text); setDetail(null); qc.invalidateQueries({ queryKey: ['pending-merchants'] }) }
  const fail = (e) => toast.error(e.response?.data?.message || 'Action failed')
  const verify = useMutation({ mutationFn: (id) => inviteExtraApi.verifyMerchant(id, ''), onSuccess: done('Store approved'), onError: fail })
  const reject = useMutation({ mutationFn: ({ id, note }) => inviteExtraApi.rejectMerchant(id, note), onSuccess: done('Store rejected'), onError: fail })
  const askReject = (id) => { const note = window.prompt('Reason for rejecting:'); if (note) reject.mutate({ id, note }) }

  return (
    <div>
      <PageHeader eyebrow={canDecide ? 'Group HQ' : 'Regional operations'} title="Merchants awaiting approval" description="Merchants who accepted an invitation appear here. Only HQ can approve a store; until then it cannot list products." />
      <QueryState query={list} isEmpty={(d) => !d?.length} empty={{ title: 'No merchants waiting' }}>
        {(rows) => <div className="space-y-2">{rows.map((s) => (
          <Card key={s._id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><p className="text-sm font-medium text-text-p">{s.businessName}</p>
              <p className="text-xs text-text-m">{TYPE[s.businessType]} · {getRegionLabel(s.primaryState)} · {s.businessOwnerId?.email}{s.referredByAffiliateId?.name ? ` · brought by ${s.referredByAffiliateId.name}` : ''}</p></div>
            <div className="flex items-center gap-2"><Badge color="amber">Pending</Badge>{canDecide && <Button size="sm" variant="secondary" onClick={() => open(s._id)}>Review</Button>}</div>
          </Card>))}</div>}
      </QueryState>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.businessName || ''} size="lg">
        {detail && <div className="space-y-3 text-sm">
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {[['Type', TYPE[detail.businessType]], ['Market', getRegionLabel(detail.primaryState)], ['Owner', detail.businessOwnerId?.name], ['Email', detail.businessEmail], ['Phone', detail.businessPhone],
              ['NIN', detail.nin], ['CAC number', detail.cacNumber], ['TIN', detail.tinNumber], ['Business address', detail.businessAddress], ['Home address', detail.homeAddress]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-text-m">{k}</dt><dd className="text-text-p break-words">{v || '-'}</dd></div>))}
          </dl>
          <p className="text-xs text-text-m">Check these against the documents before approving. Approval also verifies the owner for withdrawals.</p>
          <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => askReject(detail._id)}>Reject</Button><Button loading={verify.isPending} onClick={() => verify.mutate(detail._id)}>Approve store</Button></div>
        </div>}
      </Modal>
    </div>
  )
}
