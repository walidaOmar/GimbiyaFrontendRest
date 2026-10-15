import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Store, Wrench, TrendingUp, Repeat, Truck, Ticket, MapPin, Download, Building2 } from 'lucide-react'
import { regionApi, storeApi, userApi, relationshipApi, waiverApi } from '../../../api/index.js'
import { useAuthStore } from '../../../store/authStore.js'
import { useRegionTree } from '../../../hooks/useRegionTree.js'
import { Card, StatCard, Badge } from '../../../components/ui/index.jsx'
import { PageHeader, QueryState } from '../../../components/ui/Polish.jsx'
import { LIFECYCLE, deriveLifecycle, healthScore } from '../../../utils/relationship.js'
import { formatNaira } from '../../../utils/index.js'

const when = (date) => (date ? new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—')

function useOverview() {
  return useQuery({ queryKey: ['region-overview'], queryFn: () => regionApi.overview().then((response) => response.data.data) })
}

function NodeHeader({ title, description, actions }) {
  const user = useAuthStore((state) => state.user)
  const { path } = useRegionTree()
  return <PageHeader eyebrow={path(user?.assignedState)} title={title} description={description} actions={actions} />
}

export function RegionalOverview() {
  const query = useOverview()
  return (
    <div>
      <NodeHeader title="Regional overview" description="Territory health across your commercial node." />
      <QueryState query={query}>
        {(data) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Regional GMV" value={formatNaira(data.gmvKobo)} icon={TrendingUp} />
              <StatCard label="Active affiliates" value={data.activeAffiliates} icon={Users} color="text-role-affiliate" />
              <StatCard label="Consumers reached" value={data.consumers} icon={Users} color="text-role-buyer" />
              <StatCard label="Active relationships" value={data.activeRelationships} icon={Repeat} />
              <StatCard label="Merchants" value={data.merchants} icon={Store} color="text-role-merchant" />
              <StatCard label="Service providers" value={data.services} icon={Wrench} />
              <StatCard label="Fulfilment success" value={data.fulfilment?.successRate == null ? '—' : `${data.fulfilment.successRate}%`} icon={Truck} color="text-success" />
              <StatCard label="Waiver utilisation" value={data.waiver ? `${data.waiver.utilisationPct}%` : '—'} icon={Ticket} color="text-warning" />
            </div>
            <Card><p className="section-label mb-2">Repeat activity</p><p className="text-sm text-text-m"><span className="text-text-p font-semibold">{data.repeatRelationships}</span> relationships have made two or more purchases.</p></Card>
          </div>
        )}
      </QueryState>
    </div>
  )
}

export function MarketOperations() {
  const user = useAuthStore((state) => state.user)
  const { byKey } = useRegionTree()
  const node = byKey[user?.assignedState]
  return (
    <div>
      <NodeHeader title="Market operations" description="Your commercial node, its floors and operating hours." />
      {node ? (
        <Card className="grid sm:grid-cols-2 gap-4">
          {[['Region', node.region], ['State', node.state], ['Market', node.market], ['Node', node.name], ['Floors', (node.floors || []).join(', ') || '—'], ['Hours', node.operatingHours ? `${node.operatingHours.open} – ${node.operatingHours.close}` : '—']].map(([key, value]) => (
            <div key={key}><p className="section-label">{key}</p><p className="text-text-p mt-1 flex items-center gap-2">{key === 'Node' && <MapPin className="w-4 h-4 text-brass" />}{value}</p></div>
          ))}
        </Card>
      ) : <Card className="text-sm text-text-m">Node details are not set up yet.</Card>}
    </div>
  )
}

export function Storefronts() {
  const query = useQuery({ queryKey: ['stores', 'region'], queryFn: () => storeApi.list({ status: 'VERIFIED', limit: 50 }).then((response) => response.data.stores || []) })
  return (
    <div>
      <NodeHeader title="Storefronts" description="Verified stores in your node." actions={<Link to="/dashboard/stores/onboard" className="btn btn-primary btn-sm"><Building2 className="w-4 h-4" /> Request new store</Link>} />
      <QueryState query={query} isEmpty={(stores) => !stores.length} empty={{ title: 'No verified stores yet', icon: Store }}>
        {(stores) => <div className="space-y-2">{stores.map((store) => <Card key={store._id} className="flex items-center justify-between"><div><p className="font-medium text-text-p">{store.businessName}</p><p className="text-xs text-text-m">{store.businessEmail}</p></div><Badge color="blue">{(store.commerceSegment || store.businessType || '').replace('_', ' ')}</Badge></Card>)}</div>}
      </QueryState>
    </div>
  )
}

export function AffiliateNetwork() {
  const query = useQuery({ queryKey: ['affiliate-network'], queryFn: () => userApi.list({ role: 'affiliate', limit: 100 }).then((response) => response.data.users || []) })
  return (
    <div>
      <NodeHeader title="Affiliate network" description="Affiliate officers operating in your node." />
      <QueryState query={query} isEmpty={(users) => !users.length} empty={{ title: 'No affiliates yet', icon: Users }}>
        {(users) => <div className="space-y-2">{users.map((user) => <Card key={user._id} className="flex items-center justify-between"><div><p className="font-medium text-text-p">{user.name}</p><p className="text-xs text-text-m">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p></div><Badge color={user.isActive ? 'green' : 'muted'}>{user.isActive ? 'Active' : 'Inactive'}</Badge></Card>)}</div>}
      </QueryState>
    </div>
  )
}

export function Allocations() {
  const query = useQuery({ queryKey: ['my-quota'], queryFn: () => waiverApi.getMyQuota().then((response) => response.data.quota) })
  return (
    <div>
      <NodeHeader title="Regional allocation" description="Waiver quota allocated to you by Group HQ." />
      <QueryState query={query} isEmpty={(quota) => !quota} empty={{ title: 'No active quota', description: 'HQ has not allocated a waiver quota to you, or it has expired.', icon: Ticket }}>
        {(quota) => {
          const used = quota.usedSlots || 0
          const pct = quota.totalSlots ? Math.round((used / quota.totalSlots) * 100) : 0
          return (
            <Card className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="section-label">Total slots</p><p className="font-display text-2xl text-text-p">{quota.totalSlots}</p></div>
                <div><p className="section-label">Used</p><p className="font-display text-2xl text-text-p">{used}</p></div>
                <div><p className="section-label">Budget</p><p className="font-display text-2xl text-brass">{formatNaira(quota.budgetKobo)}</p></div>
              </div>
              <div><div className="h-2 bg-midnight rounded-full overflow-hidden"><div className="h-full bg-brass" style={{ width: `${pct}%` }} /></div><p className="text-xs text-text-m mt-1">{pct}% used · expires {when(quota.expiresAt)}</p></div>
            </Card>
          )
        }}
      </QueryState>
    </div>
  )
}

export function RegionalRelationships() {
  const query = useQuery({ queryKey: ['relationships-regional'], queryFn: () => relationshipApi.regional().then((response) => response.data.data || []) })
  return (
    <div>
      <NodeHeader title="Commercial relationships" description="Every affiliate–consumer relationship in your node." />
      <QueryState query={query} isEmpty={(relationships) => !relationships.length} empty={{ title: 'No relationships yet', icon: Repeat }}>
        {(relationships) => <div className="space-y-2">{relationships.map((relationship) => {
          const lifecycle = deriveLifecycle(relationship)
          return <Card key={relationship._id} className="flex items-center justify-between"><span className="font-mono text-sm">{relationship.consumerPublicId}</span><div className="flex items-center gap-3"><span className="text-xs text-text-m font-mono">Health {healthScore(relationship)} · {when(relationship.lastActivityAt)}</span><Badge color={LIFECYCLE[lifecycle].color}>{LIFECYCLE[lifecycle].label}</Badge></div></Card>
        })}</div>}
      </QueryState>
    </div>
  )
}

export function RegionalPerformance() {
  const overview = useOverview()
  const relationships = useQuery({ queryKey: ['relationships-regional'], queryFn: () => relationshipApi.regional().then((response) => response.data.data || []) })
  return (
    <div>
      <NodeHeader title="Regional performance" description="Territory KPIs and relationship health." />
      <QueryState query={overview}>
        {(data) => (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card><p className="section-label">Consumer coverage</p><p className="font-display text-3xl text-text-p mt-1">{data.consumers}</p><p className="text-xs text-text-m">{data.activeRelationships} currently active</p></Card>
            <Card><p className="section-label">Merchant & service coverage</p><p className="font-display text-3xl text-text-p mt-1">{data.merchants + data.services}</p><p className="text-xs text-text-m">{data.merchants} merchants · {data.services} services</p></Card>
          </div>
        )}
      </QueryState>
      <QueryState query={relationships} isEmpty={(items) => !items.length} empty={{ title: 'No relationship data yet' }}>
        {(items) => {
          const counts = Object.keys(LIFECYCLE).map((key) => ({ key, count: items.filter((item) => deriveLifecycle(item) === key).length }))
          const max = Math.max(1, ...counts.map((item) => item.count))
          return <Card><p className="section-label mb-3">Lifecycle distribution</p><div className="space-y-2">{counts.map((item) => <div key={item.key} className="flex items-center gap-3 text-sm"><span className="w-28 text-text-m">{LIFECYCLE[item.key].label}</span><div className="flex-1 h-2 bg-midnight rounded-full overflow-hidden"><div className="h-full bg-brass" style={{ width: `${(item.count / max) * 100}%` }} /></div><span className="w-8 text-right font-mono text-xs">{item.count}</span></div>)}</div></Card>
        }}
      </QueryState>
    </div>
  )
}

export function RegionalReports() {
  const relationships = useQuery({ queryKey: ['relationships-regional'], queryFn: () => relationshipApi.regional().then((response) => response.data.data || []) })
  const download = () => {
    const rows = [
      ['consumerPublicId', 'region', 'lifecycle', 'health', 'lastActivityAt', 'interactions'],
      ...(relationships.data || []).map((relationship) => [
        relationship.consumerPublicId,
        relationship.region,
        deriveLifecycle(relationship),
        healthScore(relationship),
        relationship.lastActivityAt,
        relationship.interactionHistory?.length || 0,
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'regional-relationships.csv'
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div>
      <NodeHeader title="Reports" description="Export your node's data." />
      <Card className="flex items-center justify-between"><div><p className="text-text-p font-medium">Commercial relationships</p><p className="text-xs text-text-m">CSV with lifecycle and health per consumer</p></div><button className="btn btn-primary btn-sm" disabled={!relationships.data?.length} onClick={download}><Download className="w-4 h-4" /> Download CSV</button></Card>
    </div>
  )
}
