import { useQuery } from '@tanstack/react-query'
import { Activity, MousePointerClick, Wallet, Users } from 'lucide-react'
import { affiliateApi, trackingApi } from '../../api/index.js'
import { Card, EmptyState, Skeleton, StatCard, StatusBadge } from '../../components/ui/index.jsx'
import { formatKobo, listFrom, percent } from '../../utils/tracking.js'

function Progress({ value, max }) {
  const width = Math.min(100, max ? (Number(value || 0) / max) * 100 : 0)
  return <div className="h-2 rounded-full bg-surface-h overflow-hidden"><div className="h-full bg-brass transition-all" style={{ width: `${width}%` }} /></div>
}

export default function AffiliateTrackingDashboard() {
  const me = useQuery({ queryKey: ['tracking-me'], queryFn: () => trackingApi.me().then(r => r.data), refetchInterval: 60000 })
  const summary = useQuery({ queryKey: ['tracking-affiliate'], queryFn: () => trackingApi.affiliate().then(r => r.data), refetchInterval: 60000 })
  const data = summary.data || {}
  const referrals = listFrom(data, ['referrals', 'myReferrals'])
  const target = me.data?.targetKobo ?? data.targetKobo ?? 10000000
  const achieved = me.data?.achievedKobo ?? data.achievedKobo ?? data.salesKobo ?? 0
  const pending = data.pendingPayoutKobo ?? data.payouts?.pendingKobo ?? 0
  const paid = data.paidPayoutKobo ?? data.payouts?.paidKobo ?? 0

  return <div className="space-y-6">
    <header><p className="section-label mb-1">Affiliate Network</p><h1 className="font-display text-3xl font-bold text-text-p">Referral Command</h1><p className="text-text-m mt-1">Your performance, payouts, and referral ledger.</p></header>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Referral sales" value={formatKobo(data.salesKobo ?? data.referralSalesKobo)} icon={Users} />
      <StatCard label="Tracked clicks" value={(data.clicks ?? data.clickCount ?? 0).toLocaleString()} icon={MousePointerClick} color="text-role-affiliate" />
      <StatCard label="Pending payouts" value={formatKobo(pending)} icon={Wallet} color="text-warning" />
      <StatCard label="Paid payouts" value={formatKobo(paid)} icon={Activity} color="text-success" />
    </div>
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1"><p className="section-label">Monthly target</p><div className="flex items-end justify-between mt-4"><strong className="font-mono text-2xl text-brass">{formatKobo(achieved)}</strong><span className="font-mono text-xs text-text-m">of {formatKobo(target)}</span></div><Progress value={achieved} max={target} /><div className="flex justify-between mt-2 text-xs text-text-m"><span>{percent(target ? achieved / target * 100 : 0)} achieved</span><span>{me.data?.status || 'TRACKING'}</span></div></Card>
      <Card className="lg:col-span-2"><p className="section-label mb-4">My referrals</p>{summary.isLoading ? <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div> : !referrals.length ? <EmptyState icon={Users} title="No referrals yet" description="Completed referrals will appear here." /> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-[10px] uppercase tracking-wider text-text-d border-b border-border"><th className="pb-2">Merchant</th><th className="pb-2">State</th><th className="pb-2">GPV contributed</th><th className="pb-2">Date</th></tr></thead><tbody>{referrals.map((referral, index) => <tr key={referral._id || referral.id || index} className="border-b border-border/60 last:border-0"><td className="py-3 text-sm text-text-p">{referral.merchantName || referral.merchant?.name || referral.name || 'Merchant'}</td><td className="py-3 text-xs text-text-m">{referral.state || referral.assignedState || '—'}</td><td className="py-3 text-sm font-mono text-brass">{formatKobo(referral.gpvKobo ?? referral.gpvContributedKobo ?? referral.salesKobo)}</td><td className="py-3 text-xs text-text-m">{referral.date || (referral.createdAt ? new Date(referral.createdAt).toLocaleDateString('en-NG') : '—')}</td></tr>)}</tbody></table></div>}</Card>
    </div>
    {!me.isLoading && me.data?.status && <Card><div className="flex items-center justify-between"><div><p className="section-label">Target status</p><p className="text-sm text-text-m mt-1">Retention {percent(me.data.retentionPercent ?? me.data.retention ?? 0)}</p></div><StatusBadge status={me.data.status} /></div></Card>}
  </div>
}
