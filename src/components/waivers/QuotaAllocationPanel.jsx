import { useState } from 'react'
import { Search, Send } from 'lucide-react'
import api from '../../api/index.js'
import { Card, Button } from '../ui/index.jsx'
import toast from 'react-hot-toast'

export function QuotaAllocationPanel({ onAllocated }) {
  const [publicIdInput, setPublicIdInput] = useState('')
  const [coordinator, setCoordinator] = useState(null)
  const [totalSlots, setTotalSlots] = useState('')
  const [budgetNaira, setBudgetNaira] = useState('')
  const [note, setNote] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const lookupCoordinator = async () => {
    const publicId = publicIdInput.trim().toUpperCase()
    if (!publicId) return
    setLookingUp(true)
    try {
      const res = await api.get(`/public-ids/${publicId}`)
      if (res.data.data.role !== 'developer_coordinator') {
        toast.error('This Public ID does not belong to a coordinator')
        return
      }
      setCoordinator(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Not found')
    } finally {
      setLookingUp(false)
    }
  }

  const submit = async () => {
    const slots = Number(totalSlots)
    const budget = Number(budgetNaira)
    if (!coordinator || !Number.isInteger(slots) || slots < 1) {
      toast.error('Select a coordinator and enter a positive whole-number slot count')
      return
    }
    if (budgetNaira && (!Number.isFinite(budget) || budget < 0)) {
      toast.error('Enter a valid non-negative budget')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/waivers/quotas', {
        coordinatorId: coordinator._id,
        totalSlots: slots,
        budgetKobo: (budget || 0) * 100,
        note,
      })
      toast.success(`Quota allocated to ${coordinator.name}`)
      setCoordinator(null)
      setTotalSlots('')
      setBudgetNaira('')
      setNote('')
      setPublicIdInput('')
      onAllocated?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not allocate quota')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="font-mono text-xs uppercase text-text-m">Allocate Waiver Quota</p>
      {!coordinator ? (
        <div className="flex gap-2">
          <input
            value={publicIdInput}
            onChange={(event) => setPublicIdInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                lookupCoordinator()
              }
            }}
            placeholder="Coordinator's GM-XXXXXXXX"
            className="input flex-1 font-mono text-sm"
          />
          <button type="button" onClick={lookupCoordinator} disabled={lookingUp} aria-label="Find coordinator" className="btn-icon h-10 w-10">
            <Search className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-btn bg-surface-h p-2">
          <span className="text-sm">{coordinator.name} - {coordinator.assignedState}</span>
          <button type="button" onClick={() => setCoordinator(null)} className="text-xs text-text-m underline">Change</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input type="number" min="1" step="1" value={totalSlots} onChange={(event) => setTotalSlots(event.target.value)} placeholder="Total slots" className="input" />
        <input type="number" min="0" step="0.01" value={budgetNaira} onChange={(event) => setBudgetNaira(event.target.value)} placeholder="Budget (₦, optional)" className="input" />
      </div>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note (optional)" rows={2} className="input w-full resize-none" />
      <Button variant="primary" onClick={submit} loading={submitting} iconRight={<Send className="h-4 w-4" />}>
        Allocate
      </Button>
    </Card>
  )
}
