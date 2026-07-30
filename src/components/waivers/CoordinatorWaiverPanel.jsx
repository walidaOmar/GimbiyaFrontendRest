import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, UserCheck, Clock } from 'lucide-react'
import { waiverApi } from '../../api/index.js'
import toast from 'react-hot-toast'

export default function CoordinatorWaiverPanel() {
  const qc = useQueryClient()
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')

  const { data: quotaData } = useQuery({
    queryKey: ['my-quota'],
    queryFn: () => waiverApi.getMyQuota().then((r) => r.data),
  })

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['pending-waiver-requests'],
    queryFn: () => waiverApi.getPendingRequests().then((r) => r.data),
    refetchInterval: 10000,
  })

  const approveMut = useMutation({
    mutationFn: (id) => waiverApi.approveRequest(id),
    onSuccess: () => {
      toast.success('Waiver approved. Coupon generated.')
      qc.invalidateQueries(['pending-waiver-requests'])
      qc.invalidateQueries(['my-quota'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Approval failed'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => waiverApi.rejectRequest(id, { reason }),
    onSuccess: () => {
      toast.success('Request rejected')
      setRejecting(null)
      setReason('')
      qc.invalidateQueries(['pending-waiver-requests'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Rejection failed'),
  })

  const quota = quotaData?.quota
  const requests = requestsData?.requests || []

  return (
    <div className="space-y-6">
      <div className="bg-surface-l border border-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-brass" />
          </div>
          <div>
            <h3 className="font-display font-bold text-text-p">My Waiver Quota</h3>
            <p className="text-xs text-text-m">Allocated by CEO</p>
          </div>
        </div>
        {quota ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-midnight/30 rounded-lg p-3 text-center">
              <p className="text-[10px] font-mono text-text-d uppercase">Total Slots</p>
              <p className="text-xl font-bold text-text-p">{quota.totalSlots}</p>
            </div>
            <div className="bg-midnight/30 rounded-lg p-3 text-center">
              <p className="text-[10px] font-mono text-text-d uppercase">Used</p>
              <p className="text-xl font-bold text-amber-400">{quota.usedSlots}</p>
            </div>
            <div className="bg-midnight/30 rounded-lg p-3 text-center">
              <p className="text-[10px] font-mono text-text-d uppercase">Remaining</p>
              <p className="text-xl font-bold text-emerald-400">{quota.remainingSlots}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-m text-center py-4">No active quota allocated by CEO</p>
        )}
      </div>

      <div>
        <h4 className="font-display font-bold text-text-p mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" /> Pending Waiver Requests
        </h4>
        {isLoading ? (
          <div className="text-center text-text-m py-8">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-xl text-text-m text-sm">
            No pending waiver requests
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req._id} className="bg-surface-l border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-text-p">{req.affiliateId?.name}</p>
                    <p className="text-xs text-text-m">{req.affiliateId?.email}</p>
                    <p className="text-xs text-text-d mt-1">{req.reason || 'No reason provided'}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">
                    {req.requestedSlots} slots
                  </span>
                </div>

                <div className="bg-midnight/20 rounded-lg p-2 mb-3">
                  <p className="text-[10px] font-mono text-text-d uppercase mb-1">Target Buyers</p>
                  <div className="flex flex-wrap gap-1">
                    {req.targetUserIds?.map((u) => (
                      <span key={u._id} className="text-[10px] bg-surface-h px-2 py-0.5 rounded text-text-m">
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>

                {rejecting === req._id ? (
                  <div className="flex gap-2">
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Rejection reason"
                      className="flex-1 bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p focus:border-red-500 outline-none"
                    />
                    <button
                      onClick={() => rejectMut.mutate({ id: req._id, reason })}
                      disabled={!reason || rejectMut.isPending}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button onClick={() => { setRejecting(null); setReason('') }} className="px-3 py-2 text-text-m text-sm">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMut.mutate(req._id)}
                      disabled={approveMut.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setRejecting(req._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/20"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
