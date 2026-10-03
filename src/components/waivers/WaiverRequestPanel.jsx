import { useState } from 'react'
import { Search, X, Send } from 'lucide-react'
import api from '../../api/index.js'
import { Card, Button, Badge } from '../ui/index.jsx'
import toast from 'react-hot-toast'

export function WaiverRequestPanel() {
  const [publicIdInput, setPublicIdInput] = useState('')
  const [targets, setTargets] = useState([])
  const [reason, setReason] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const lookupAndAdd = async () => {
    const publicId = publicIdInput.trim().toUpperCase()
    if (!publicId) return
    if (targets.length >= 10) {
      toast.error('Maximum 10 Public IDs per request')
      return
    }

    setLookingUp(true)
    try {
      const res = await api.get(`/public-ids/${publicId}`)
      const user = res.data.data
      if (targets.some((target) => target._id === user._id)) {
        toast.error('Already added')
        return
      }
      setTargets((current) => [...current, user])
      setPublicIdInput('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Public ID not found')
    } finally {
      setLookingUp(false)
    }
  }

  const submit = async () => {
    if (targets.length < 2) {
      toast.error('A waiver request needs at least 2 Public IDs')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/waivers/requests', {
        targetUserIds: targets.map((target) => target._id),
        requestedSlots: targets.length,
        reason,
      })
      toast.success('Waiver request submitted to your coordinator')
      setTargets([])
      setReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="font-mono text-xs uppercase text-text-m">New Waiver Request</p>
      <div className="flex gap-2">
        <input
          value={publicIdInput}
          onChange={(event) => setPublicIdInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              lookupAndAdd()
            }
          }}
          placeholder="GM-10482931"
          className="input flex-1 font-mono text-sm"
        />
        <button
          type="button"
          onClick={lookupAndAdd}
          disabled={lookingUp}
          aria-label="Look up Public ID"
          className="btn-icon h-10 w-10"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {targets.map((target) => (
          <Badge key={target._id} color="muted">
            <span className="flex items-center gap-1">
              {target.publicId} - {target.name}
              <button type="button" aria-label={`Remove ${target.publicId}`} onClick={() => setTargets((current) => current.filter((item) => item._id !== target._id))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          </Badge>
        ))}
      </div>
      <p className="text-xs text-text-m">{targets.length}/10 added (minimum 2 required)</p>

      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason for this waiver request..."
        rows={2}
        className="input w-full resize-none"
      />
      <Button variant="primary" onClick={submit} loading={submitting} iconRight={<Send className="h-4 w-4" />}>
        Submit Request
      </Button>
    </Card>
  )
}
