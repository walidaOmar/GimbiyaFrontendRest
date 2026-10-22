import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { performanceApi } from '../../../api/v21.js'
import { useAuthStore } from '../../../store/authStore.js'
import { STATE_OPTIONS, getRegionLabel } from '../../../config/regions.js'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { Card, Badge } from '../../../components/ui/index.jsx'

const naira = (kobo) => `₦${Math.round((kobo || 0) / 100).toLocaleString()}`

function lagosMonthNow() {
  const date = new Date(Date.now() + 3600 * 1000)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function Bar({ pct }) {
  const width = Math.max(0, Math.min(100, pct))
  return (
    <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
      <div className="h-full bg-brass" style={{ width: `${width}%` }} />
    </div>
  )
}

export default function AffiliatePerformance() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isCoordinator = user?.role === 'developer_coordinator'
  const [node, setNode] = useState(isCoordinator ? user.assignedState : STATE_OPTIONS[0].value)
  const [month, setMonth] = useState(lagosMonthNow())

  const query = useQuery({
    queryKey: ['affiliate-performance', node, month],
    queryFn: () => performanceApi.affiliates({ node, month }).then((response) => response.data),
  })

  const assign = useMutation({
    mutationFn: ({ storeId, affiliateId }) => performanceApi.setReferral(storeId, affiliateId || null),
    onSuccess: () => { toast.success('Saved'); queryClient.invalidateQueries({ queryKey: ['affiliate-performance'] }) },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not save'),
  })

  return (
    <div>
      <PageHeader
        eyebrow={isCoordinator ? 'Regional operations' : 'Group HQ'}
        title="Affiliate officer performance"
        description="Retail stores each officer brought in, how many are active shops (5 delivered orders in the month), and delivered sales against the ₦100,000 monthly target. Months follow Lagos time."
        actions={
          <>
            {!isCoordinator && (
              <select className="input" value={node} onChange={(event) => setNode(event.target.value)}>
                {STATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            )}
            <input type="month" className="input" value={month} onChange={(event) => setMonth(event.target.value)} />
          </>
        }
      />

      <QueryState query={query} rows={4}>
        {(data) => (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <p className="section-label mb-1">Active shops · {getRegionLabel(data.node)}</p>
                <p className="font-display text-2xl font-bold">{data.summary.activeShops} <span className="text-sm text-text-m">/ {data.summary.activeShopsTarget}</span></p>
                <Bar pct={(data.summary.activeShops / data.summary.activeShopsTarget) * 100} />
              </Card>
              <Card>
                <p className="section-label mb-1">Delivered sales</p>
                <p className="font-display text-2xl font-bold">{naira(data.summary.gmvKobo)} <span className="text-sm text-text-m">/ {naira(data.summary.gmvTargetKobo)}</span></p>
                <Bar pct={(data.summary.gmvKobo / data.summary.gmvTargetKobo) * 100} />
              </Card>
              <Card>
                <p className="section-label mb-1">Verified stores</p>
                <p className="font-display text-2xl font-bold">{data.summary.verifiedStores}</p>
                <p className="text-xs text-text-m mt-1">{data.summary.unattributedStores} not yet credited to an officer</p>
              </Card>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold mb-3">Officers</h2>
              {data.affiliates.length === 0 && <p className="text-sm text-text-m">No active affiliate officers in this market yet. Invite some from Invitations.</p>}
              <div className="space-y-2">
                {data.affiliates.map((affiliate) => (
                  <Card key={affiliate.affiliateId}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-medium">{affiliate.name}</p>
                        <p className="text-xs text-text-m">{affiliate.publicId || affiliate.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-text-m">
                        <span>Stores <b className="text-text-p">{affiliate.storesOnboarded}</b></span>
                        <span>Retail <b className="text-text-p">{affiliate.retailStores}</b></span>
                        <span>Active <b className="text-text-p">{affiliate.activeShops}</b></span>
                        <span>Sales <b className="text-text-p">{naira(affiliate.gmvKobo)}</b></span>
                        <Badge color={affiliate.attainmentPct >= 100 ? 'green' : affiliate.attainmentPct >= 50 ? 'amber' : 'red'}>{affiliate.attainmentPct}% of target</Badge>
                      </div>
                    </div>
                    <Bar pct={affiliate.attainmentPct} />
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold mb-1">Stores and who brought them in</h2>
              <p className="text-xs text-text-m mb-3">Credit each store to the affiliate officer who onboarded it. This drives the numbers above.</p>
              <div className="space-y-2">
                {data.stores.map((store) => (
                  <Card key={store.storeId} className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{store.businessName}</p>
                      <p className="text-xs text-text-m">{store.businessType} · {store.deliveredOrders} delivered · {naira(store.gmvKobo)} {store.isActiveShop && <Badge color="green">Active shop</Badge>}</p>
                    </div>
                    <select className="input max-w-[220px]" value={store.referredByAffiliateId || ''}
                      onChange={(event) => assign.mutate({ storeId: store.storeId, affiliateId: event.target.value })}>
                      <option value="">Not credited</option>
                      {data.affiliates.map((affiliate) => <option key={affiliate.affiliateId} value={affiliate.affiliateId}>{affiliate.name}</option>)}
                    </select>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  )
}
