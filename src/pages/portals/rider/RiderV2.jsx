import { useRef, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Truck, MapPin, Package, CheckCircle2, Eraser } from 'lucide-react'
import toast from 'react-hot-toast'
import { deliveryV2Api } from '../../../api/index.js'
import { Card, Badge, Modal } from '../../../components/ui/index.jsx'
import { PageHeader, QueryState, Tabs } from '../../../components/ui/Polish.jsx'

const message = (error, fallback) => error?.response?.data?.message || fallback

function SignaturePad({ onChange }) {
  const ref = useRef(null)
  const drawing = useRef(false)
  const position = (event) => {
    const rect = ref.current.getBoundingClientRect()
    const touch = event.touches?.[0] || event
    return [touch.clientX - rect.left, touch.clientY - rect.top]
  }
  const start = (event) => {
    drawing.current = true
    const context = ref.current.getContext('2d')
    context.beginPath()
    context.moveTo(...position(event))
  }
  const move = (event) => {
    if (!drawing.current) return
    event.preventDefault()
    const context = ref.current.getContext('2d')
    context.lineWidth = 2
    context.lineCap = 'round'
    context.strokeStyle = '#111111'
    context.lineTo(...position(event))
    context.stroke()
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    onChange(ref.current.toDataURL('image/png'))
  }
  const paintBackground = () => {
    const context = ref.current.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, ref.current.width, ref.current.height)
  }
  useEffect(() => { paintBackground() }, [])
  const clear = () => { paintBackground(); onChange('') }
  return (
    <div>
      <canvas ref={ref} width={420} height={140} className="w-full bg-white border border-border rounded-btn touch-none"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={clear}><Eraser className="w-3 h-3" /> Clear</button>
    </div>
  )
}

function HandoverModal({ job, onClose }) {
  const queryClient = useQueryClient()
  const [otp, setOtp] = useState('')
  const [signature, setSignature] = useState('')
  const finalize = useMutation({
    mutationFn: () => deliveryV2Api.finalize({ fulfillmentGroupId: job._id, submittedOtp: otp, signatureBase64: signature }),
    onSuccess: (response) => { toast.success(response.data.message || 'Delivery confirmed'); queryClient.invalidateQueries({ queryKey: ['rider-v2'] }); onClose() },
    onError: (error) => toast.error(message(error, 'Handover failed')),
  })
  return (
    <Modal open={Boolean(job)} onClose={onClose} title={`Handover · ${job?.orderId?.orderRef || ''}`}>
      <div className="space-y-4">
        <div>
          <label className="input-label">Customer's 4-digit code</label>
          <input className="input w-full font-mono text-2xl tracking-[0.5em] text-center" inputMode="numeric" maxLength={4} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} />
        </div>
        <div><label className="input-label">Customer signature</label><SignaturePad onChange={setSignature} /></div>
        <button className="btn btn-primary w-full" disabled={otp.length !== 4 || !signature || finalize.isPending} onClick={() => finalize.mutate()}>Confirm delivery</button>
      </div>
    </Modal>
  )
}

export default function RiderV2({ initialTab = 'available' }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState(initialTab)
  const [handover, setHandover] = useState(null)
  const available = useQuery({ queryKey: ['rider-v2', 'available'], queryFn: () => deliveryV2Api.available().then((response) => response.data.jobs || []), refetchInterval: 20000 })
  const mine = useQuery({ queryKey: ['rider-v2', 'mine'], queryFn: () => deliveryV2Api.mine().then((response) => response.data.deliveries || []), refetchInterval: 20000 })
  const claim = useMutation({
    mutationFn: (id) => deliveryV2Api.claim({ fulfillmentGroupId: id }),
    onSuccess: () => { toast.success('Job claimed'); queryClient.invalidateQueries({ queryKey: ['rider-v2'] }); setTab('mine') },
    onError: (error) => { toast.error(message(error, 'Could not claim job')); queryClient.invalidateQueries({ queryKey: ['rider-v2'] }) },
  })

  useEffect(() => { setTab(initialTab) }, [initialTab])

  useEffect(() => {
    if (!mine.data?.length || !navigator.geolocation) return undefined
    const send = () => navigator.geolocation.getCurrentPosition(
      (position) => mine.data.forEach((job) => deliveryV2Api.location({
        fulfillmentGroupId: job._id,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }).catch(() => {})),
      () => {},
      { maximumAge: 20000 },
    )
    send()
    const timer = setInterval(send, 30000)
    return () => clearInterval(timer)
  }, [mine.data])

  const Job = ({ job, children }) => (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-sm text-text-p flex items-center gap-2"><Package className="w-4 h-4 text-text-m" />{job.orderId?.orderRef}<Badge color={job.groupType === 'SERVICE' ? 'blue' : 'amber'}>{job.groupType || 'PRODUCT'}</Badge></p>
        <p className="text-xs text-text-m flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{job.orderId?.shippingAddress || 'Address on order'}</p>
      </div>
      {children}
    </Card>
  )

  return (
    <div>
      <PageHeader eyebrow="Logistics" title="Delivery jobs" description="Claim a confirmed job, deliver, then confirm with the customer's code and signature." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'available', label: 'Available', count: available.data?.length }, { id: 'mine', label: 'My deliveries', count: mine.data?.length }]} />
      {tab === 'available' ? (
        <QueryState query={available} isEmpty={(jobs) => !jobs.length} empty={{ title: 'No jobs right now', description: 'Confirmed jobs in your node appear here.', icon: Truck }}>
          {(jobs) => <div className="space-y-2">{jobs.map((job) => <Job key={job._id} job={job}><button className="btn btn-primary btn-sm" disabled={claim.isPending} onClick={() => claim.mutate(job._id)}>Claim</button></Job>)}</div>}
        </QueryState>
      ) : (
        <QueryState query={mine} isEmpty={(jobs) => !jobs.length} empty={{ title: 'No active deliveries', icon: Truck }}>
          {(jobs) => <div className="space-y-2">{jobs.map((job) => <Job key={job._id} job={job}><button className="btn btn-primary btn-sm" onClick={() => setHandover(job)}><CheckCircle2 className="w-4 h-4" /> Hand over</button></Job>)}</div>}
        </QueryState>
      )}
      <HandoverModal job={handover} onClose={() => setHandover(null)} />
    </div>
  )
}
