import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Ticket, Wallet, RefreshCw, ArrowRight, BadgeCheck, ShoppingBag, BarChart3, FileText, Link2, Plus } from 'lucide-react'
import { affiliateApi } from '../../api/index.js'
import AffiliateWaiverPanel from '../../components/waivers/AffiliateWaiverPanel.jsx'
import AffiliateShop from '../../components/affiliate/AffiliateShop.jsx'
import AffiliateOnboardingModal from '../../components/affiliate/AffiliateOnboardingModal.jsx'
import AffiliateAnalytics from '../../components/affiliate/AffiliateAnalytics.jsx'
import AffiliateInvoicePanel from '../../components/affiliate/AffiliateInvoicePanel.jsx'
import DeepLinkGenerator from '../../components/affiliate/DeepLinkGenerator.jsx'
import { Card, StatCard, Badge, EmptyState, Skeleton, GlowDot } from '../../components/ui/index.jsx'
import { useAuthStore } from '../../store/authStore.js'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Users },
  { id: 'waivers', label: 'Waiver Requests', icon: Ticket },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'onboarding', label: 'Onboarding', icon: Plus },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'links', label: 'Deep Links', icon: Link2 },
]

export default function AffiliateDashboard() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [showOnboardModal, setShowOnboardModal] = useState(false)

  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['affiliate-summary'],
    queryFn: () => affiliateApi.summary().then(r => r.data),
    refetchInterval: 30000,
  })

  const stats = useMemo(() => ({
    referrals: summary?.referralsCount || 0,
    payout: summary?.pendingPayoutNaira || 0,
    approvals: summary?.approvedReferrals || 0,
    waivers: summary?.waiverCount || 0,
  }), [])

  const markMut = useMutation({
    mutationFn: (id) => affiliateApi.markPayout(id),
    onSuccess: () => {
      toast.success('Affiliate payout marked')
      qc.invalidateQueries(['affiliate-summary'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update payout'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">Growth Network</p>
          <h1 className="font-display text-3xl font-bold text-text-p">Affiliate Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 bg-surface-h border border-border rounded-card px-4 py-2">
          <GlowDot color="#EC4899" size={8} />
          <span className="font-mono text-xs text-role-affiliate tracking-wider">PARTNER READY</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Referrals" value={stats.referrals} icon={Users} color="text-role-affiliate" />
        <StatCard label="Pending Payout" value={`₦${(stats.payout / 1000).toFixed(1)}K`} icon={Wallet} color="text-success" />
        <StatCard label="Approved" value={stats.approvals} icon={BadgeCheck} color="text-brass" />
        <StatCard label="Waiver Cases" value={stats.waivers} icon={Ticket} color="text-warning" />
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brass/10 text-brass border border-brass/30'
                  : 'text-text-m hover:text-text-p hover:bg-surface-h border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'waivers' ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Waiver Workflow</p>
            <button onClick={() => refetch()} className="btn-icon" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <AffiliateWaiverPanel />
        </Card>
      ) : activeTab === 'shop' ? (
        <AffiliateShop />
      ) : activeTab === 'onboarding' ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-label">Onboard New Members</p>
              <p className="text-xs text-text-m">Onboard retailers, logistics operators, and buyers</p>
            </div>
            <button onClick={() => setShowOnboardModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brass text-midnight rounded-lg text-sm font-bold hover:bg-brass/90">
              <Plus className="w-4 h-4" /> New Onboarding
            </button>
          </div>
          <p className="text-sm text-text-m">Use the button above to submit onboarding requests for your network.</p>
        </Card>
      ) : activeTab === 'analytics' ? (
        <AffiliateAnalytics />
      ) : activeTab === 'invoices' ? (
        <AffiliateInvoicePanel />
      ) : activeTab === 'links' ? (
        <DeepLinkGenerator />
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">Partner Snapshot</p>
            <button onClick={() => refetch()} className="btn-icon" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-btn" />)}
            </div>
          ) : !summary ? (
            <EmptyState icon={Users} title="No activity yet" description="Your affiliate activity will appear here." />
          ) : (
            <div className="space-y-2">
              <div className="rounded-btn border border-border bg-midnight p-3 flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-semibold text-text-p">Referral momentum</p>
                  <p className="font-mono text-[10px] text-text-d">Track new users and unlocked payouts.</p>
                </div>
                <Badge color="pink">Live</Badge>
              </div>
              <div className="rounded-btn border border-border bg-midnight p-3 flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-semibold text-text-p">Pending commissions</p>
                  <p className="font-mono text-[10px] text-text-d">₦{(stats.payout || 0).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => markMut.mutate(summary._id)}
                  disabled={markMut.isPending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {markMut.isPending ? 'Updating...' : <>Mark paid <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      <AffiliateOnboardingModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        userState={user?.assignedState}
      />
    </div>
  )
}
