import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, MapPin, ShieldCheck, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { publicIdApi, relationshipApi } from '../../../api/index.js'
import { useAuthStore } from '../../../store/authStore.js'
import { Card, Badge, Modal, StatCard } from '../../../components/ui/index.jsx'
import { PageHeader, QueryState, Tabs } from '../../../components/ui/Polish.jsx'
import { TierBadge } from '../mall/PublicIdKyc.jsx'
import { LIFECYCLE, deriveLifecycle, healthScore } from '../../../utils/relationship.js'
import { getRegionLabel } from '../../../config/regions.js'

const INTERACTIONS = ['MARKET_VISIT', 'PURCHASE', 'SUPPORT', 'REFERRAL', 'WAIVER', 'BUSINESS_UPGRADE']
const message = (error, fallback) => error?.response?.data?.message || fallback
const formatDate = (date) => (date ? new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : '—')

function usePortfolio() {
  return useQuery({
    queryKey: ['relationships-mine'],
    queryFn: () => relationshipApi.mine().then((response) => response.data.data || []),
  })
}

function ConsumerFinder() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [publicId, setPublicId] = useState('')
  const [found, setFound] = useState(null)

  const lookup = useMutation({
    mutationFn: () => publicIdApi.lookup(publicId.trim()).then((response) => response.data.data),
    onSuccess: setFound,
    onError: (error) => { setFound(null); toast.error(message(error, 'No user with this Public ID')) },
  })
  const upgrade = useMutation({
    mutationFn: (type) => publicIdApi.upgradeTier(found._id, type).then((response) => response.data),
    onSuccess: (response) => {
      toast.success('Verification updated')
      setFound((current) => ({ ...current, kycTier: response.data?.kycTier ?? response.kycTier ?? current.kycTier }))
    },
    onError: (error) => toast.error(message(error, 'Could not update verification')),
  })
  const create = useMutation({
    mutationFn: () => relationshipApi.create({ consumerId: found._id, consumerPublicId: found.publicId, region: user.assignedState }),
    onSuccess: () => {
      toast.success('Relationship started')
      queryClient.invalidateQueries({ queryKey: ['relationships-mine'] })
      setFound(null)
      setPublicId('')
    },
    onError: (error) => toast.error(message(error, 'Could not start relationship')),
  })

  return (
    <Card className="mb-6">
      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (publicId.trim()) lookup.mutate() }}>
        <input className="input flex-1" placeholder="Enter consumer Public ID" value={publicId} onChange={(event) => setPublicId(event.target.value)} />
        <button className="btn btn-primary" disabled={lookup.isPending}><Search className="w-4 h-4" /> Find</button>
      </form>
      {found && (
        <div className="mt-4 p-4 bg-midnight border border-border rounded-btn flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium text-text-p">{found.name}</p>
            <p className="text-xs text-text-m font-mono">{found.publicId} · {found.role}</p>
            <div className="mt-2 flex items-center gap-2"><TierBadge tier={found.kycTier} /><span className="text-xs text-text-m flex items-center gap-1"><MapPin className="w-3 h-3" />{getRegionLabel(found.assignedState)}</span></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost btn-sm" disabled={upgrade.isPending || found.kycTier >= 2} onClick={() => upgrade.mutate('NIN')}>Verify NIN</button>
            <button className="btn btn-ghost btn-sm" disabled={upgrade.isPending || found.kycTier < 2 || found.kycTier >= 3} onClick={() => upgrade.mutate('BVN')} title={found.kycTier < 2 ? 'Verify NIN first' : ''}>Verify BVN</button>
            <button className="btn btn-primary btn-sm" disabled={create.isPending} onClick={() => create.mutate()}><UserPlus className="w-4 h-4" /> Start relationship</button>
          </div>
        </div>
      )}
    </Card>
  )
}

function InteractionModal({ rel, onClose }) {
  const queryClient = useQueryClient()
  const [type, setType] = useState('MARKET_VISIT')
  const [note, setNote] = useState('')
  const save = useMutation({
    mutationFn: () => relationshipApi.interact(rel._id, { type, note }),
    onSuccess: () => {
      toast.success('Interaction logged')
      queryClient.invalidateQueries({ queryKey: ['relationships-mine'] })
      onClose()
    },
    onError: (error) => toast.error(message(error, 'Could not log interaction')),
  })
  return (
    <Modal open={Boolean(rel)} onClose={onClose} title={`Log interaction · ${rel?.consumerPublicId || ''}`}>
      <div className="space-y-3">
        <select className="input w-full" value={type} onChange={(event) => setType(event.target.value)}>{INTERACTIONS.map((interaction) => <option key={interaction} value={interaction}>{interaction.replace('_', ' ')}</option>)}</select>
        <textarea className="input w-full resize-none" rows={3} placeholder="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
        <div className="flex justify-end gap-2"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={save.isPending} onClick={() => save.mutate()}>Save</button></div>
      </div>
    </Modal>
  )
}

function LifecycleBadge({ rel }) {
  const key = deriveLifecycle(rel)
  return <Badge color={LIFECYCLE[key].color}>{LIFECYCLE[key].label}</Badge>
}

export function RelationshipsPage() {
  const query = usePortfolio()
  const [active, setActive] = useState(null)
  return (
    <div>
      <PageHeader eyebrow="Affiliate operations" title="Relationships" description="Every consumer you look after. Health reflects recency, interactions and repeat purchases — not sales targets." />
      <ConsumerFinder />
      <QueryState query={query} isEmpty={(data) => !data.length} empty={{ title: 'No relationships yet', description: 'Find a consumer by Public ID to start one.' }}>
        {(relationships) => (
          <div className="space-y-2">
            {relationships.map((relationship) => (
              <Card key={relationship._id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-text-p">{relationship.consumerPublicId}</p>
                  <p className="text-xs text-text-m">{getRegionLabel(relationship.region)} · last activity {formatDate(relationship.lastActivityAt)} · {relationship.interactionHistory?.length || 0} interactions</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-text-m">Health {healthScore(relationship)}</span>
                  <LifecycleBadge rel={relationship} />
                  <button className="btn btn-ghost btn-sm" onClick={() => setActive(relationship)}>Log interaction</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
      <InteractionModal rel={active} onClose={() => setActive(null)} />
    </div>
  )
}

export function MarketVisitsPage() {
  const query = usePortfolio()
  return (
    <div>
      <PageHeader eyebrow="Affiliate operations" title="Market visits" description="Every in-person visit you have logged, newest first." />
      <QueryState query={query} isEmpty={(relationships) => !relationships.some((relationship) => relationship.interactionHistory?.some((entry) => entry.type === 'MARKET_VISIT'))} empty={{ title: 'No visits logged', icon: MapPin }}>
        {(relationships) => {
          const visits = relationships.flatMap((relationship) => (relationship.interactionHistory || [])
            .filter((entry) => entry.type === 'MARKET_VISIT')
            .map((entry) => ({ ...entry, publicId: relationship.consumerPublicId, region: relationship.region })))
            .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
          return <div className="space-y-2">{visits.map((visit, index) => <Card key={index} className="flex items-center justify-between"><div><p className="font-mono text-sm">{visit.publicId}</p><p className="text-xs text-text-m">{visit.note || 'Market visit'} · {getRegionLabel(visit.region)}</p></div><span className="text-xs text-text-d">{formatDate(visit.occurredAt)}</span></Card>)}</div>
        }}
      </QueryState>
    </div>
  )
}

export function RetentionPage() {
  const query = usePortfolio()
  const [tab, setTab] = useState('ALL')
  return (
    <div>
      <PageHeader eyebrow="Affiliate operations" title="Retention" description="Where each relationship sits in its lifecycle." />
      <QueryState query={query} isEmpty={(relationships) => !relationships.length} empty={{ title: 'No relationships to analyse yet', icon: Activity }}>
        {(relationships) => {
          const tagged = relationships.map((relationship) => ({ relationship, key: deriveLifecycle(relationship) }))
          const counts = Object.keys(LIFECYCLE).map((key) => ({ id: key, label: LIFECYCLE[key].label, count: tagged.filter((item) => item.key === key).length }))
          const shown = tab === 'ALL' ? tagged : tagged.filter((item) => item.key === tab)
          return (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <StatCard label="Relationships" value={relationships.length} icon={ShieldCheck} />
                <StatCard label="Avg health" value={Math.round(relationships.reduce((total, relationship) => total + healthScore(relationship), 0) / relationships.length)} icon={Activity} />
                <StatCard label="Retained" value={counts.find((item) => item.id === 'RETAINED').count} />
                <StatCard label="Dormant" value={counts.find((item) => item.id === 'DORMANT').count} color="text-warning" />
              </div>
              <Tabs value={tab} onChange={setTab} tabs={[{ id: 'ALL', label: 'All', count: relationships.length }, ...counts]} />
              <div className="space-y-2">{shown.map(({ relationship }) => <Card key={relationship._id} className="flex items-center justify-between"><span className="font-mono text-sm">{relationship.consumerPublicId}</span><div className="flex items-center gap-3"><span className="text-xs text-text-m">last {formatDate(relationship.lastActivityAt)}</span><LifecycleBadge rel={relationship} /></div></Card>)}</div>
            </>
          )
        }}
      </QueryState>
    </div>
  )
}
