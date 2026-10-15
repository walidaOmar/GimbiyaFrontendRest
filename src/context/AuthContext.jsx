import { createContext, useContext, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'

const AuthContext = createContext(null)

// Role → default dashboard route (single source of truth for every redirect)
export const ROLE_ROUTES = {
  ceo:                    '/dashboard/hq',
  super_admin:            '/dashboard/hq',
  developer_coordinator:  '/dashboard/coordinator',
  business_owner:         '/dashboard/merchant',
  property_admin:         '/dashboard/property-admin',
  deal_initiator:         '/dashboard/deal-initiator',
  stock_manager:          '/dashboard/stock',
  delivery:               '/dashboard/rider',
  affiliate:              '/dashboard/affiliate',
  buyer:                  '/dashboard/mall',
  manager:                '/dashboard/merchant',
  auditor:                '/dashboard/desk',
  support:                '/dashboard/desk',
}

export function AuthProvider({ children }) {
  const { checkAuth, isLoading, isChecked } = useAuthStore()

  useEffect(() => {
    checkAuth()

    const handler = () => useAuthStore.getState().logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  if (isLoading && !isChecked) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-brass border-t-transparent animate-spin" />
          <span className="font-mono text-xs text-text-m tracking-widest uppercase">
            Initialising...
          </span>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>
}

// The backend's role middleware remains the security boundary; this guard
// controls client-side navigation and sends users to their own dashboard.
export function RequireAuth({ children, roles = null }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location }, replace: true })
      return
    }

    if (roles && !roles.includes(user.role)) {
      navigate(ROLE_ROUTES[user.role] || '/dashboard/mall', { replace: true })
    }
  }, [user, navigate, location, roles])

  if (!user) return null
  if (roles && !roles.includes(user.role)) return null
  return children
}

export function RequireGuest({ children }) {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate(ROLE_ROUTES[user.role] || '/dashboard/mall', { replace: true })
    }
  }, [user, navigate])

  if (user) return null
  return children
}

export function useAuth() {
  return useContext(AuthContext)
}
