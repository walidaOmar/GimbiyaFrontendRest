import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, ShieldCheck, Wallet, LifeBuoy, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { publicIdApi, ceoApi } from '../../../api/index.js'
import { useAuthStore } from '../../../store/authStore.js'
import { Card, StatCard } from '../../../components/ui/index.jsx'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { TierBadge } from '../mall/PublicIdKyc.jsx'
import { getRegionLabel } from '../../../config/regions.js'

export function DeskLookupPage() {
  const [publicId, setPublicId] = useState('')
  const [found, setFound] = useState(null)
  const lookup = useMutation({
    mutationFn: () => publicIdApi.lookup(publicId.trim()).then((response) => response.data.data),
    onSuccess: setFound,
    onError: (error) => { setFound(null); toast.error(error.response?.data?.message || 'No user with this Public ID') },
  })
  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Gimbiya Desk" title="Public ID lookup" description="Find a customer to help with verification, orders, payments or deliveries. Read-only." />
      <Card>
        <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (publicId.trim()) lookup.mutate() }}>
          <input className="input flex-1" placeholder="Customer Public ID" value={publicId} onChange={(event) => setPublicId(event.target.value)} />
          <button className="btn btn-primary" disabled={lookup.isPending}><Search className="w-4 h-4" /> Find</button>
        </form>
        {found && (
          <div className="mt-4 p-4 bg-midnight border border-border rounded-btn space-y-2">
            <p className="font-medium text-text-p">{found.name}</p>
            <p className="font-mono text-xs text-text-m">{found.publicId} · {found.role}</p>
            <div className="flex items-center gap-3"><TierBadge tier={found.kycTier} /><span className="text-xs text-text-m">{getRegionLabel(found.assignedState)}</span></div>
          </div>
        )}
      </Card>
    </div>
  )
}

export function DeskOverviewPage() {
  const user = useAuthStore((state) => state.user)
  const canSeeEscrow = ['auditor', 'super_admin'].includes(user?.role)
  const escrow = useQuery({
    queryKey: ['desk-escrow'],
    queryFn: () => ceoApi.escrowSummary().then((response) => response.data),
    enabled: canSeeEscrow,
  })
  return (
    <div>
      <PageHeader eyebrow="Gimbiya Desk" title="Desk overview" description="The controlled support channel — so affiliate officers never become informal customer support." />
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <StatCard label="Public ID lookup" value="Ready" icon={ShieldCheck} />
        {canSeeEscrow && <StatCard label="Escrow entries" value={(escrow.data?.summary || escrow.data?.entries || []).length} icon={Wallet} />}
        <StatCard label="Tickets & escalations" value="Soon" icon={LifeBuoy} color="text-warning" />
      </div>
      {canSeeEscrow && <QueryState query={escrow} isEmpty={() => false}>
        {(data) => <Card><p className="section-label mb-2">Escrow summary</p><pre className="text-xs text-text-m overflow-x-auto">{JSON.stringify(data.summary || data.entries || data, null, 2)}</pre></Card>}
      </QueryState>}
      <Card className="mt-6 flex gap-3 border-brass/20"><Info className="w-5 h-5 text-brass shrink-0" /><p className="text-sm text-text-m">Tickets, escalations and announcements need dedicated backend endpoints (gap B8) and are intentionally not faked here.</p></Card>
    </div>
  )
}
