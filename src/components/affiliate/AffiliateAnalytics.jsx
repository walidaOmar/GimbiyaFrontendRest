import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, MousePointer, Users, ShoppingCart, DollarSign } from 'lucide-react'
import { affiliateApi } from '../../api/index.js'

export default function AffiliateAnalytics() {
  const [period, setPeriod] = useState('30')
  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-analytics', period],
    queryFn: () => affiliateApi.getAnalytics({ days: period }).then((r) => r.data),
  })

  const stats = data?.analytics

  if (isLoading) return <div className="p-8 text-center text-text-m animate-pulse">Loading analytics...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-text-p">Performance Analytics</h3>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-midnight border border-border rounded-lg px-3 py-2 text-sm text-text-p">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<MousePointer className="w-5 h-5" />} label="Total Clicks" value={stats?.totalClicks || 0} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="Conversions" value={stats?.conversions || 0} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Conversion Rate" value={stats?.conversionRate || '0%'} color="text-brass" bg="bg-brass/10" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Onboarded" value={stats?.totalOnboarded || 0} color="text-purple-400" bg="bg-purple-500/10" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenue" value={`₦${(stats?.totalRevenueNaira || 0).toLocaleString()}`} color="text-cyan-400" bg="bg-cyan-500/10" />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Referral Orders" value={stats?.totalReferralOrders || 0} color="text-amber-400" bg="bg-amber-500/10" />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-surface-l border border-border rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-text-p">{value}</p>
      <p className="text-xs text-text-m mt-1">{label}</p>
    </div>
  )
}
