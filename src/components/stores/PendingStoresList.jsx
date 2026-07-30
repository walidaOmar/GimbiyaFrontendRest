import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, Building2, MapPin, User, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { storeApi } from '../../api/index.js'
import toast from 'react-hot-toast'

export default function PendingStoresList({ onSelect }) {
  const qc = useQueryClient()
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['pending-stores'],
    queryFn: () => storeApi.pending({ limit: 50 }).then((r) => r.data),
    refetchInterval: 15000,
  })

  const verifyMut = useMutation({
    mutationFn: (id) => storeApi.verify(id, {}),
    onSuccess: () => {
      toast.success('Store verified successfully')
      qc.invalidateQueries(['pending-stores'])
      qc.invalidateQueries(['stores'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Verification failed'),
  })

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => storeApi.reject(id, { reason }),
    onSuccess: () => {
      toast.success('Store rejected')
      setRejecting(null)
      setReason('')
      qc.invalidateQueries(['pending-stores'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Rejection failed'),
  })

  if (isLoading) return <div className="p-8 text-center text-text-m animate-pulse">Loading pending requests...</div>

  const stores = data?.stores || []

  if (!stores.length) return (
    <div className="p-8 text-center border border-dashed border-border rounded-xl">
      <Clock className="w-10 h-10 text-text-d mx-auto mb-3" />
      <p className="text-text-m text-sm">No pending store requests</p>
      <p className="text-text-d text-xs mt-1">New onboardings will appear here</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {stores.map((store) => (
        <div key={store._id} className="bg-surface-l border border-border rounded-xl p-4 hover:border-brass/30 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-text-p">{store.businessName}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-m">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.primaryState}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {store.businessEmail}</span>
                </div>
                <p className="text-[10px] text-text-d mt-1">Submitted by: {store.onboardedBy?.name || 'CEO'} · {new Date(store.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => verifyMut.mutate(store._id)}
                disabled={verifyMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Verify
              </button>
              <button
                onClick={() => setRejecting(store._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button onClick={() => onSelect?.(store)} className="p-1.5 hover:bg-surface-h rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-text-d" />
              </button>
            </div>
          </div>

          {rejecting === store._id && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Rejection reason"
                  className="flex-1 bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p focus:border-red-500 outline-none"
                />
                <button
                  onClick={() => rejectMut.mutate({ id: store._id, reason })}
                  disabled={!reason || rejectMut.isPending}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 disabled:opacity-50"
                >
                  Confirm Reject
                </button>
                <button onClick={() => { setRejecting(null); setReason('') }} className="px-3 py-2 text-text-m text-sm hover:text-text-p">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
