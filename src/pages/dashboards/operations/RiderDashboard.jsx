import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle, Truck, TrendingUp,
} from 'lucide-react'
import { deliveryApi } from '../../../api/index.js'
import {
  Card, StatCard, Button, Badge,
  Modal, EmptyState, Skeleton,
} from '../../../components/ui/index.jsx'
import toast from 'react-hot-toast'

export function RiderDashboard() {
  const qc = useQueryClient()
  const [handoverModal, setHandover] = useState(null)
  const [otp, setOtp] = useState('')
  const [sigDone, setSigDone] = useState(false)

  const { data: jobsData, isLoading: jobsLoad } = useQuery({
    queryKey: ['rider-jobs'],
    queryFn: () => deliveryApi.jobs().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: activeData } = useQuery({
    queryKey: ['rider-active'],
    queryFn: () => deliveryApi.active().then(r => r.data),
    refetchInterval: 15000,
  })

  const claimMut = useMutation({
    mutationFn: (orderId) => deliveryApi.claim(orderId),
    onSuccess: () => {
      toast.success('Job claimed! Navigate to pickup.')
      qc.invalidateQueries(['rider-jobs'])
      qc.invalidateQueries(['rider-active'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Job no longer available'),
  })

  const handoverMut = useMutation({
    mutationFn: (data) => deliveryApi.handover(data),
    onSuccess: () => {
      toast.success('Delivery confirmed! Escrow released.')
      setHandover(null)
      setOtp('')
      setSigDone(false)
      qc.invalidateQueries(['rider-active'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid OTP'),
  })

  const handleHandover = () => {
    if (otp.length !== 4) { toast.error('Enter the 4-digit OTP from the buyer'); return }
    handoverMut.mutate({
      orderId: handoverModal._id,
      submittedOtp: otp,
      signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    })
  }

  const jobs = jobsData?.jobs || []
  const active = activeData?.deliveries || []

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-1">Logistics Fleet Interface</p>
        <h1 className="font-display text-3xl font-bold text-text-p">Rider Console</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Available Jobs" value={jobs.length} icon={Truck} color="text-role-rider" />
        <StatCard label="Active Delivery" value={active.length} icon={CheckCircle} color="text-warning" />
        <StatCard label="On-Time Rate" value="96.2%" icon={TrendingUp} color="text-success" />
      </div>

      {active.length > 0 && (
        <div className="space-y-3">
          <p className="section-label">Active Deliveries</p>
          {active.map(order => (
            <Card key={order._id} glow>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge color="amber">IN TRANSIT</Badge>
                  <p className="font-mono text-xs text-text-m mt-1">{order.orderRef}</p>
                  <p className="font-body text-sm text-text-p mt-0.5">{order.shippingAddress}</p>
                </div>
                <p className="font-mono text-sm font-bold text-brass">
                  ₦{(order.grossTotalKobo / 100).toLocaleString()}
                </p>
              </div>
              <Button variant="primary" className="w-full"
                onClick={() => setHandover(order)}
                icon={<CheckCircle className="w-4 h-4" />}>
                Initiate OTP Handover
              </Button>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <p className="section-label">Job Stream ({jobs.length} available)</p>
        {jobsLoad ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)
        ) : !jobs.length ? (
          <EmptyState icon={Truck} title="No Jobs Available"
            description="New orders in your region will appear here." />
        ) : (
          jobs.map(order => (
            <Card key={order._id} hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-text-m">{order.orderRef}</p>
                  <p className="font-body text-sm text-text-p mt-0.5">{order.shippingAddress}</p>
                  <p className="font-mono text-[10px] text-text-d mt-1">
                    {order.items?.length} item(s) · {order.assignedState}
                  </p>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="font-mono text-sm font-bold text-brass">
                    ₦{(order.grossTotalKobo / 100).toLocaleString()}
                  </p>
                  <Button variant="secondary" size="sm" className="mt-2"
                    loading={claimMut.isPending}
                    onClick={() => claimMut.mutate(order._id)}>
                    Claim Job
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={!!handoverModal}
        onClose={() => { setHandover(null); setOtp(''); setSigDone(false) }}
        title="Secure OTP Handover">
        {handoverModal && (
          <div className="space-y-4">
            <div className="bg-midnight border border-border rounded-btn p-3">
              <p className="font-mono text-xs text-text-m">Order: {handoverModal.orderRef}</p>
              <p className="font-body text-sm text-text-p mt-1">{handoverModal.shippingAddress}</p>
            </div>

            <div className="space-y-1.5">
              <label className="input-label">4-Digit OTP from Buyer *</label>
              <input
                type="text" maxLength={4}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="input text-center text-3xl tracking-[0.6em] font-mono"
              />
              <p className="font-mono text-[10px] text-text-d text-center">
                Ask the buyer to show you their OTP code
              </p>
            </div>

            <div className="p-3 bg-surface-h border border-border rounded-btn">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sigDone} onChange={e => setSigDone(e.target.checked)}
                  className="rounded" />
                <span className="font-mono text-xs text-text-m">
                  I confirm the buyer has received the package and I have their signature
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setHandover(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1"
                loading={handoverMut.isPending}
                disabled={otp.length !== 4 || !sigDone}
                onClick={handleHandover}
                icon={<CheckCircle className="w-4 h-4" />}>
                Confirm Delivery
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
