import { createContext, useContext, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'

const AuthContext = createContext(null)

// Role → default dashboard route
export const ROLE_ROUTES = {
  super_admin:            '/dashboard/ceo',
  developer_coordinator:  '/dashboard/coordinator',
  business_owner:         '/dashboard/merchant',
  stock_manager:          '/dashboard/stock',
  delivery:               '/dashboard/rider',
  affiliate:              '/dashboard/affiliate',
  buyer:                  '/dashboard/buyer',
  manager:                '/dashboard/merchant',
  auditor:                '/dashboard/ceo',
  support:                '/dashboard/ceo',
}

export function AuthProvider({ children }) {
  const { checkAuth, isLoading, isChecked } = useAuthStore()

  useEffect(() => {
    checkAuth()

    // Listen for forced logouts from API interceptor
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

// ── Route Guards ──────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login */
export function RequireAuth({ children }) {
  const user      = useAuthStore((s) => s.user)
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    if (!user) navigate('/login', { state: { from: location }, replace: true })
  }, [user, navigate, location])

  if (!user) return null
  return children
}

/** Redirects authenticated users away from auth pages */
export function RequireGuest({ children }) {
  const user     = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      const dest = ROLE_ROUTES[user.role] || '/dashboard/buyer'
      navigate(dest, { replace: true })
    }
  }, [user, navigate])

  if (user) return null
  return children
}

/** Requires specific role(s) */
export function RequireRole({ roles, children, fallback = null }) {
  const user = useAuthStore((s) => s.user)
  if (!user || !roles.includes(user.role)) return fallback
  return children
}

export function useAuth() {
  return useContext(AuthContext)
}
