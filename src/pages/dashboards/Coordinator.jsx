import { useState }        from 'react'
import { useQuery }         from '@tanstack/react-query'
import { motion }           from 'framer-motion'
import { Users, Store, TrendingUp, MapPin, RefreshCw } from 'lucide-react'
import { userApi }          from '../../api/index.js'
import { useAuthStore }     from '../../store/authStore.js'
import {
  Card, StatCard, Badge, StatusBadge,
  EmptyState, Skeleton, GlowDot,
} from '../../components/ui/index.jsx'

export function CoordinatorDashboard() {
  const user  = useAuthStore(s => s.user)
  const state = user?.assignedState || 'Kano'

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['coord-users', state],
    queryFn:  () => userApi.list({ assignedState: state, limit: 50 }).then(r => r.data),
    refetchInterval: 60000,
  })

  const users       = usersData?.users || []
  const merchants   = users.filter(u => u.role === 'business_owner')
  const riders      = users.filter(u => u.role === 'delivery')
  const pendingKyc  = users.filter(u => u.kycStatus === 'PENDING')

  const ROLE_COLORS = {
    business_owner: '#3B82F6',
    delivery:       '#F59E0B',
    stock_manager:  '#10B981',
    affiliate:      '#EC4899',
    buyer:          '#06B6D4',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">State Coordination Node</p>
          <h1 className="font-display text-3xl font-bold text-text-p">
            {state} Regional Hub
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlowDot color="#8B5CF6" size={8} />
          <span className="font-mono text-xs text-role-coord tracking-wider">
            {state.toUpperCase()} NODE ACTIVE
          </span>
          <button onClick={refetch} className="btn-icon ml-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"     value={users.length}      icon={Users}     color="text-role-coord" />
        <StatCard label="Merchants"       value={merchants.length}   icon={Store}     color="text-role-merchant" />
        <StatCard label="Active Riders"   value={riders.length}      icon={MapPin}    color="text-role-rider" />
        <StatCard label="KYC Pending"     value={pendingKyc.length}  icon={TrendingUp} color="text-warning" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">User Registry — {state}</p>
          <span className="font-mono text-xs text-text-m">{users.length} total</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-btn" />)}
          </div>
        ) : !users.length ? (
          <EmptyState icon={Users} title="No Users"
            description={`No registered users in ${state} yet.`} />
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <motion.div key={u._id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-midnight rounded-btn border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
                    style={{
                      background: `${ROLE_COLORS[u.role] || '#9B9BB8'}15`,
                      border:     `1px solid ${ROLE_COLORS[u.role] || '#9B9BB8'}40`,
                      color:       ROLE_COLORS[u.role] || '#9B9BB8',
                    }}
                  >
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-text-p truncate">{u.name}</p>
                    <p className="font-mono text-[10px] text-text-d truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <Badge color={
                    u.role === 'business_owner' ? 'blue'
                    : u.role === 'delivery'     ? 'amber'
                    : 'muted'
                  }>
                    {u.role.replace('_', ' ')}
                  </Badge>
                  <StatusBadge status={u.kycStatus} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
