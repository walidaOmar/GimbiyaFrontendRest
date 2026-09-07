import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronDown, Search, UserPlus, Users } from 'lucide-react'
import { userApi } from '../../api/index.js'
import { Badge, Button, Card, EmptyState, Input, Skeleton, StatusBadge } from '../../components/ui/index.jsx'
import { useAuthStore } from '../../store/authStore.js'
import { getRegionLabel } from '../../config/regions.js'

const ROLE_COLORS = { business_owner: 'blue', manager: 'blue', developer_coordinator: 'purple', delivery: 'amber', stock_manager: 'green', affiliate: 'purple' }

export default function StaffManagement() {
  const user = useAuthStore((state) => state.user)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [expanded, setExpanded] = useState(null)
  const params = { search, role, ...(user?.role === 'developer_coordinator' ? { assignedState: user.assignedState } : {}) }
  const { data, isLoading } = useQuery({ queryKey: ['staff', params], queryFn: () => userApi.staff(params).then((response) => response.data), staleTime: 30000 })
  const staff = data?.users || data?.staff || data?.items || []

  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4 flex-wrap"><div><p className="section-label mb-1">People and permissions</p><h1 className="font-display text-3xl font-bold">Staff Management</h1><p className="text-sm text-text-m mt-2">{user?.role === 'developer_coordinator' ? `${getRegionLabel(user.assignedState)} staff registry` : 'All platform staff registry'}</p></div><Link to="/dashboard/staff/onboard" className="btn btn-primary"><UserPlus className="w-4 h-4" /> Onboard Staff</Link></div>
    <Card><div className="flex flex-wrap gap-3"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or phone" icon={Search} className="min-w-64" /><select value={role} onChange={(event) => setRole(event.target.value)} className="input w-48"><option value="">All roles</option><option value="business_owner">Business Owner</option><option value="manager">Manager</option><option value="delivery">Delivery</option><option value="stock_manager">Stock Manager</option><option value="affiliate">Affiliate</option></select></div></Card>
    {isLoading ? <Card><div className="space-y-2">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16" />)}</div></Card> : !staff.length ? <Card><EmptyState icon={Users} title="No staff found" description="Try another search or onboard a new team member." /></Card> : <Card><div className="space-y-2">{staff.map((member) => { const isOpen = expanded === member._id; return <div key={member._id} className="border border-border rounded-btn overflow-hidden"><button className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-surface-h" onClick={() => setExpanded(isOpen ? null : member._id)}><div className="flex items-center gap-3 min-w-0"><div className="w-9 h-9 rounded-full bg-brass/10 text-brass flex items-center justify-center font-bold">{member.name?.[0]?.toUpperCase()}</div><div className="min-w-0"><p className="font-semibold truncate">{member.name || 'Unnamed user'}</p><p className="text-xs text-text-m truncate">{member.email} {member.phone && `| ${member.phone}`}</p></div></div><div className="flex items-center gap-2 flex-shrink-0"><Badge color={ROLE_COLORS[member.role] || 'muted'}>{member.role?.replaceAll('_', ' ')}</Badge><StatusBadge status={member.kycStatus || member.status || 'PENDING'} /><ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></div></button>{isOpen && <div className="grid sm:grid-cols-2 gap-3 border-t border-border bg-midnight/40 p-4 text-sm"><p><span className="text-text-m">Account:</span> {member.isActive === false ? 'Inactive' : 'Active'}</p><p><span className="text-text-m">State:</span> {member.assignedState || 'Global'}</p><p><span className="text-text-m">Store:</span> {member.store?.name || member.assignedStore?.name || 'Not assigned'}</p><p><span className="text-text-m">Onboarded by:</span> {member.onboardedBy?.name || member.onboardedBy?.email || 'System'}</p><p className="sm:col-span-2"><span className="text-text-m">Notes:</span> {member.onboardingNotes || 'No onboarding notes.'}</p></div>}</div> })}</div></Card>}
  </div>
}
