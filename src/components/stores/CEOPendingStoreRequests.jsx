import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Building2, MapPin, User, CheckCircle, XCircle, Users, Package, Truck } from 'lucide-react'
import { storeApi } from '../../api/index.js'
import toast from 'react-hot-toast'

export default function CEOPendingStoreRequests({ onSelect }) {
  const qc = useQueryClient()
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pending-store-requests'],
    queryFn: () => storeApi.pendingRequests({ limit: 50 }).then((r) => r.data),
    refetchInterval: 15000,
  })

  const approveMut = useMutation({
    mutationFn: (id) => storeApi.approveRequest(id, {}),
    onSuccess: (res) => {
      toast.success(`Store approved! ${res.data.staff?.length || 0} staff accounts created.`)
      qc.invalidateQueries(['pending-store-requests'])
      qc.invalidateQueries(['stores'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Approval failed'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => storeApi.rejectRequest(id, { reason }),
    onSuccess: () => {
      toast.success('Request rejected')
      setRejecting(null)
      setReason('')
      qc.invalidateQueries(['pending-store-requests'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Rejection failed'),
  })

  const requests = data?.requests || []

  if (isLoading) return <div className="p-8 text-center text-text-m animate-pulse">Loading pending requests...</div>

  if (!requests.length) {
    return (
      <div className="p-8 text-center border border-dashed border-border rounded-xl">
        <Clock className="w-10 h-10 text-text-d mx-auto mb-3" />
        <p className="text-text-m text-sm">No pending store requests</p>
        <p className="text-text-d text-xs mt-1">Coordinators will submit stores for your approval</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req._id} className="bg-surface-l border border-border rounded-xl p-4 hover:border-brass/30 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-text-p">{req.businessName}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-m">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.primaryState}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {req.businessEmail}</span>
                  <span className="capitalize px-1.5 py-0.5 rounded-full bg-surface-h text-text-d">{req.commerceSegment?.replace('_', ' ')}</span>
                </div>
                <p className="text-[10px] text-text-d mt-1">
                  Submitted by: {req.submittedBy?.name} ({req.submittedBy?.assignedState}) · {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => approveMut.mutate(req._id)}
                disabled={approveMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => setRejecting(req._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium hover:bg-red-500/20"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>

          <div className="bg-midnight/20 rounded-lg p-3 mb-3">
            <p className="text-[10px] font-mono text-text-d uppercase mb-2">Proposed Staff ({req.staffSlots?.length || 0})</p>
            <div className="flex flex-wrap gap-2">
              {req.staffSlots?.map((s, i) => (
                <span key={i} className="text-[10px] bg-surface-h px-2 py-1 rounded flex items-center gap-1 text-text-m">
                  {s.role === 'manager' && <User className="w-3 h-3 text-brass" />}
                  {s.role === 'stock_manager' && <Package className="w-3 h-3 text-purple-400" />}
                  {s.role === 'delivery' && <Truck className="w-3 h-3 text-cyan-400" />}
                  {s.fullName} · {s.assignedState} {s.buildingFloor}
                </span>
              ))}
            </div>
          </div>

          {rejecting === req._id && (
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
              <button
                onClick={() => { setRejecting(null); setReason('') }}
                className="px-3 py-2 text-text-m text-sm hover:text-text-p"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
