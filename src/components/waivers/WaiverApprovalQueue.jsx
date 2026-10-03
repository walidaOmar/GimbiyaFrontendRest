import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import api from '../../api/index.js'
import { Card, Badge } from '../ui/index.jsx'
import toast from 'react-hot-toast'

export function WaiverApprovalQueue() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/waivers/requests/pending')
      .then((res) => setRequests(Array.isArray(res.data.requests) ? res.data.requests : []))
      .catch((err) => {
        setRequests([])
        toast.error(err.response?.data?.message || 'Could not load waiver requests')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const decide = async (requestId, action) => {
    setProcessingId(requestId)
    try {
      await api.post(`/waivers/requests/${requestId}/${action}`)
      toast.success(action === 'approve' ? 'Approved - 6-hour window started' : 'Rejected')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not ${action}`)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return <p className="text-xs text-text-m">Loading pending requests...</p>
  if (requests.length === 0) return <p className="text-xs text-text-m">No pending waiver requests.</p>

  return (
    <div className="flex flex-col gap-2">
      {requests.map((request) => (
        <Card key={request._id} className="p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{request.affiliateId?.name}</p>
            <Badge color="amber">{request.targetUserIds.length} target(s)</Badge>
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {request.targetUserIds.map((user, index) => (
              <span key={user._id || user || index} className="font-mono text-xs text-text-m">
                {user.name || user.publicId || user}
              </span>
            ))}
          </div>
          {request.reason && <p className="mb-2 text-xs italic text-text-m">&quot;{request.reason}&quot;</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => decide(request._id, 'approve')}
              disabled={processingId === request._id}
              className="flex items-center gap-1 rounded border border-success/30 bg-success/20 px-3 py-1.5 text-xs text-success disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button
              type="button"
              onClick={() => decide(request._id, 'reject')}
              disabled={processingId === request._id}
              className="flex items-center gap-1 rounded border border-danger/30 bg-danger/20 px-3 py-1.5 text-xs text-danger disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
