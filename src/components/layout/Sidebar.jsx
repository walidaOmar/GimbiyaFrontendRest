import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Users,
  BarChart3, TrendingUp, Warehouse, MapPin,
  Link2, FileCheck, ChevronRight,
  Target, UserPlus, Building2, ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore.js'
import { GlowDot }     from '../ui/index.jsx'

const PROPERTY_MODULE_ENABLED = import.meta.env.VITE_ENABLE_PROPERTY_MODULE === 'true'

// Role → nav items
const NAV_CONFIG = {
  super_admin: [
    { label: 'Group HQ',         path: '/dashboard/hq',              icon: LayoutDashboard },
    { label: 'KYC Adjudication', path: '/dashboard/hq/kyc',          icon: FileCheck },
    { label: 'Stores',           path: '/dashboard/hq/stores',       icon: Warehouse },
    { label: 'Escrow Summary',   path: '/dashboard/hq/escrow',       icon: TrendingUp },
    { label: 'System Metrics',   path: '/dashboard/hq/metrics',      icon: BarChart3 },
    { label: 'Users',            path: '/dashboard/hq/users',        icon: Users },
    { label: 'Staff Management', path: '/dashboard/staff',          icon: UserPlus },
    { label: 'Store Onboarding', path: '/dashboard/stores/onboard',  icon: Building2 },
    { label: 'Pending Review',   path: '/dashboard/hq/pending',     icon: FileCheck },
    { label: 'Waivers',          path: '/dashboard/hq/waivers',     icon: Users },
  ],
  developer_coordinator: [
    { label: 'Regional Hub',   path: '/dashboard/coordinator',        icon: LayoutDashboard },
    { label: 'Storefronts',    path: '/dashboard/coordinator/stores', icon: Package },
    { label: 'Staff',          path: '/dashboard/coordinator/staff',  icon: Users },
    { label: 'Staff Onboarding', path: '/dashboard/staff/onboard',     icon: UserPlus },
    { label: 'Store Onboarding', path: '/dashboard/stores/onboard',     icon: Building2 },
  ],
  business_owner: [
    { label: 'Store Overview', path: '/dashboard/merchant',              icon: LayoutDashboard },
    { label: 'My Listings',    path: '/dashboard/merchant/listings',     icon: Package },
    { label: 'Settlement',     path: '/dashboard/merchant/settlement',   icon: TrendingUp },
    { label: 'Analytics',      path: '/dashboard/merchant/analytics',    icon: BarChart3 },
    { label: 'Product Manager', path: '/dashboard/product-manager',     icon: Package },
  ],
  property_admin: [
    { label: 'Portfolio', path: '/dashboard/property-admin', icon: LayoutDashboard },
  ],
  deal_initiator: [
    { label: 'My Deals', path: '/dashboard/deal-initiator', icon: Target },
  ],
  stock_manager: [
    { label: 'Warehouse',      path: '/dashboard/stock',             icon: Warehouse },
    { label: 'Manifest',       path: '/dashboard/stock/manifest',    icon: Package },
    { label: 'Audit Log',      path: '/dashboard/stock/audit',       icon: FileCheck },
  ],
  delivery: [
    { label: 'Job Stream',     path: '/dashboard/rider',         icon: Truck },
    { label: 'Active Jobs',    path: '/dashboard/rider/active',  icon: MapPin },
  ],
  affiliate: [
    { label: 'Overview',       path: '/dashboard/affiliate',              icon: LayoutDashboard },
    { label: 'Campaigns',      path: '/dashboard/affiliate/campaigns',    icon: Link2 },
    { label: 'Payouts',        path: '/dashboard/affiliate/payouts',      icon: TrendingUp },
    { label: 'Store Onboarding', path: '/dashboard/stores/onboard',        icon: Building2 },
  ],
  buyer: [
    { label: 'My Orders',      path: '/dashboard/mall',            icon: ShoppingCart },
    { label: 'Browse Shop',    path: '/shop',                      icon: Package },
  ],
}

NAV_CONFIG.ceo = NAV_CONFIG.super_admin
NAV_CONFIG.manager = NAV_CONFIG.business_owner
NAV_CONFIG.auditor = [{ label: 'Group HQ', path: '/dashboard/hq', icon: LayoutDashboard }]
NAV_CONFIG.support = NAV_CONFIG.auditor

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
            (path && path !== '/dashboard/mall' && location.pathname.startsWith(path + '/')) ||
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
