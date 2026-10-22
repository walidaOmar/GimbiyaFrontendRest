import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Users,
  BarChart3, TrendingUp, Warehouse, MapPin,
  Link2, FileCheck, ChevronRight, ShieldCheck, Ticket, Repeat, Search,
  Wallet, Store, ClipboardList, ShoppingBag,
  Target, UserPlus, Building2, ChevronDown, Percent, Mail,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore.js'
import { GlowDot }     from '../ui/index.jsx'

const ROOT_PATHS = ['/dashboard/mall', '/dashboard/hq', '/dashboard/coordinator', '/dashboard/affiliate', '/dashboard/rider', '/dashboard/merchant', '/dashboard/desk', '/dashboard/stock']
const PROPERTY_MODULE_ENABLED = import.meta.env.VITE_ENABLE_PROPERTY_MODULE === 'true'

const NAV_CONFIG = {
  super_admin: [
    { label: 'Executive Overview', path: '/dashboard/hq', icon: LayoutDashboard },
    { label: 'Revenue Architecture', path: '/dashboard/hq/revenue', icon: Percent },
    { label: 'Waiver Quotas', path: '/dashboard/hq/waivers', icon: Ticket },
    { label: 'Affiliate Performance', path: '/dashboard/hq/affiliate-performance', icon: TrendingUp },
    { label: 'Invitations', path: '/dashboard/hq/invites', icon: Mail },
    { label: 'Users', path: '/dashboard/hq/users', icon: Users },
    { label: 'Stores', path: '/dashboard/hq/stores', icon: Warehouse },
    { label: 'Pending Stores', path: '/dashboard/hq/pending', icon: ClipboardList },
    { label: 'KYC', path: '/dashboard/hq/kyc', icon: FileCheck },
    { label: 'Escrow', path: '/dashboard/hq/escrow', icon: TrendingUp },
    { label: 'Metrics', path: '/dashboard/hq/metrics', icon: BarChart3 },
    { label: 'Gimbiya Desk', path: '/dashboard/desk', icon: Search },
  ],
  developer_coordinator: [
    { label: 'Regional Overview', path: '/dashboard/coordinator/overview', icon: LayoutDashboard },
    { label: 'Tracking', path: '/dashboard/coordinator', icon: BarChart3 },
    { label: 'Market Operations', path: '/dashboard/coordinator/market-operations', icon: MapPin },
    { label: 'Storefronts', path: '/dashboard/coordinator/stores', icon: Store },
    { label: 'Affiliate Network', path: '/dashboard/coordinator/affiliate-network', icon: Users },
    { label: 'Waiver Requests', path: '/dashboard/coordinator/waiver-requests', icon: Ticket },
    { label: 'Allocation', path: '/dashboard/coordinator/allocations', icon: Wallet },
    { label: 'Relationships', path: '/dashboard/coordinator/relationships', icon: Repeat },
    { label: 'Performance', path: '/dashboard/coordinator/performance', icon: TrendingUp },
    { label: 'Affiliate Performance', path: '/dashboard/coordinator/affiliate-performance', icon: Target },
    { label: 'Invitations', path: '/dashboard/coordinator/invites', icon: Mail },
    { label: 'Reports', path: '/dashboard/coordinator/reports', icon: ClipboardList },
    { label: 'Request a Store', path: '/dashboard/stores/onboard', icon: Building2 },
    { label: 'Staff', path: '/dashboard/coordinator/staff', icon: UserPlus },
  ],
  business_owner: [
    { label: 'Store Overview', path: '/dashboard/merchant', icon: LayoutDashboard },
    { label: 'My Listings', path: '/dashboard/merchant/listings', icon: Package },
    { label: 'Fulfillment', path: '/dashboard/merchant/fulfillment', icon: Truck },
    { label: 'Settlement', path: '/dashboard/merchant/settlement', icon: TrendingUp },
    { label: 'Analytics', path: '/dashboard/merchant/analytics', icon: BarChart3 },
    { label: 'Product Manager', path: '/dashboard/product-manager', icon: Package },
  ],
  property_admin: [{ label: 'Portfolio', path: '/dashboard/property-admin', icon: LayoutDashboard }],
  deal_initiator: [{ label: 'My Deals', path: '/dashboard/deal-initiator', icon: Target }],
  stock_manager: [
    { label: 'Warehouse', path: '/dashboard/stock', icon: Warehouse },
    { label: 'Manifest', path: '/dashboard/stock/manifest', icon: Package },
    { label: 'Audit Log', path: '/dashboard/stock/audit', icon: FileCheck },
  ],
  delivery: [
    { label: 'Available Jobs', path: '/dashboard/rider', icon: Truck },
    { label: 'My Deliveries', path: '/dashboard/rider/active', icon: MapPin },
    { label: 'Legacy Orders', path: '/dashboard/rider/legacy', icon: Package },
  ],
  affiliate: [
    { label: 'Overview', path: '/dashboard/affiliate', icon: LayoutDashboard },
    { label: 'Relationships', path: '/dashboard/affiliate/relationships', icon: Repeat },
    { label: 'Market Visits', path: '/dashboard/affiliate/market-visits', icon: MapPin },
    { label: 'Waiver Requests', path: '/dashboard/affiliate/waiver-requests', icon: Ticket },
    { label: 'Retention', path: '/dashboard/affiliate/retention', icon: ShieldCheck },
    { label: 'Campaigns', path: '/dashboard/affiliate/campaigns', icon: Link2 },
    { label: 'Payouts', path: '/dashboard/affiliate/payouts', icon: TrendingUp },
  ],
  buyer: [
    { label: 'My Orders', path: '/dashboard/mall', icon: ShoppingCart },
    { label: 'Cart', path: '/dashboard/mall/cart', icon: ShoppingBag },
    { label: 'Public ID', path: '/dashboard/mall/public-id', icon: ShieldCheck },
    { label: 'Marketplace', path: '/marketplace', icon: Package },
  ],
}

NAV_CONFIG.ceo = NAV_CONFIG.super_admin.map((item) => ({ ...item }))
NAV_CONFIG.manager = NAV_CONFIG.business_owner
const DESK_NAV = [
  { label: 'Desk Overview', path: '/dashboard/desk', icon: LayoutDashboard },
  { label: 'Public ID Lookup', path: '/dashboard/desk/public-id-lookup', icon: Search },
]
NAV_CONFIG.auditor = DESK_NAV
NAV_CONFIG.support = DESK_NAV

const ROLE_LABELS = {
  super_admin:            'Global CEO',
  developer_coordinator:  'State Coordinator',
  business_owner:         'Business Owner',
  manager:                'Manager',
  property_admin:         'Property Admin',
  deal_initiator:        'Deal Initiator',
  stock_manager:          'Stock Manager',
  delivery:               'Delivery Rider',
  affiliate:              'Affiliate Partner',
  buyer:                  'Buyer',
  auditor:                'Platform Auditor',
  support:                'Platform Staff',
}

const ROLE_COLORS = {
  super_admin:            '#C8A84B',
  developer_coordinator:  '#8B5CF6',
  business_owner:         '#3B82F6',
  manager:                '#3B82F6',
  property_admin:         '#14B8A6',
  deal_initiator:        '#F59E0B',
  stock_manager:          '#10B981',
  delivery:               '#F59E0B',
  affiliate:              '#EC4899',
  buyer:                  '#06B6D4',
  auditor:                '#10B981',
  support:                '#10B981',
}

export function Sidebar({ collapsed = false }) {
  const location = useLocation()
  const user     = useAuthStore((s) => s.user)
  const [openMenus, setOpenMenus] = useState({})
  if (!user) return null

  const navItems = user.role === 'property_admin' && !PROPERTY_MODULE_ENABLED
    ? []
    : NAV_CONFIG[user.role] || NAV_CONFIG.buyer
  const color    = ROLE_COLORS[user.role] || '#C8A84B'
  const label    = ROLE_LABELS[user.role]  || user.role

  return (
    <aside
      className={`
        flex flex-col bg-surface border-r border-border
        transition-all duration-300 h-full
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Role badge */}
      <div className={`p-4 border-b border-border ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center gap-2.5">
          <GlowDot color={color} size={8} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-widest uppercase"
                 style={{ color }}>
                {label}
              </p>
              <p className="font-body text-xs text-text-m truncate mt-0.5">
                {user.assignedState}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label: l, path, icon: Icon, children }) => {
          const hasActiveChild = children?.some(child => location.pathname === child.path)
          const isExpanded = Boolean(openMenus[l] || hasActiveChild)
          const isActive = location.pathname === path ||
            (path && !ROOT_PATHS.includes(path) && location.pathname.startsWith(path + '/')) ||
            hasActiveChild

          return (
            <div key={path || l}>
              {children ? (
                <button
                  type="button"
                  title={collapsed ? l : undefined}
                  onClick={() => setOpenMenus(menus => ({ ...menus, [l]: !isExpanded }))}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-btn transition-colors duration-150 relative overflow-hidden ${isActive ? 'bg-brass/10 text-brass' : 'text-text-m hover:text-text-p hover:bg-surface-h'}`}
                >
                  {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: color }} />}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="font-body text-sm font-medium truncate">{l}</span>}
                  {!collapsed && <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                </button>
              ) : (
                <Link to={path} title={collapsed ? l : undefined}>
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-btn transition-colors duration-150 relative overflow-hidden ${isActive ? 'bg-brass/10 text-brass' : 'text-text-m hover:text-text-p hover:bg-surface-h'}`}
                  >
                    {isActive && <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: color }} />}
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="font-body text-sm font-medium truncate">{l}</span>}
                    {!collapsed && isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                  </motion.div>
                </Link>
              )}
              {!collapsed && children && isExpanded && (
                <div className="ml-7 mt-1 space-y-0.5 border-l border-border pl-2">
                  {children.map(({ label: childLabel, path: childPath, icon: ChildIcon }) => {
                    const childActive = location.pathname === childPath
                    return <Link key={childPath} to={childPath} className={`flex items-center gap-2 px-2 py-2 rounded-btn text-xs transition-colors ${childActive ? 'text-brass bg-brass/10' : 'text-text-m hover:text-text-p hover:bg-surface-h'}`}><ChildIcon className="w-3.5 h-3.5" /><span className="truncate">{childLabel}</span></Link>
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom — user info */}
      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
            >
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-body text-xs font-semibold text-text-p truncate">{user.name}</p>
              <p className="font-mono text-[10px] text-text-m truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
