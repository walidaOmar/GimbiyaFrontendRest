import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider }        from '@tanstack/react-query'
import { Toaster }                                 from 'react-hot-toast'
import { Suspense, lazy }                          from 'react'

import { AuthProvider, RequireAuth, RequireGuest } from './context/AuthContext.jsx'
import { useAuthStore }                            from './store/authStore.js'
import { Navbar }                                  from './components/layout/Navbar.jsx'
import { DashboardLayout }                         from './components/layout/DashboardLayout.jsx'
import { Spinner }                                 from './components/ui/index.jsx'

// ── Lazy pages ────────────────────────────────────────────────────────────────
const Landing          = lazy(() => import('./pages/Landing.jsx'))
const Login            = lazy(() => import('./pages/auth/Login.jsx'))
const Register         = lazy(() => import('./pages/auth/Register.jsx'))
const ForgotPassword   = lazy(() => import('./pages/auth/ForgotReset.jsx').then(m => ({ default: m.ForgotPassword })))
const ResetPassword    = lazy(() => import('./pages/auth/ForgotReset.jsx').then(m => ({ default: m.ResetPassword })))
const CEODashboard     = lazy(() => import('./pages/dashboards/CEO.jsx'))
const BuyerDashboard   = lazy(() => import('./pages/dashboards/Buyer.jsx'))
const MerchantDashboard= lazy(() => import('./pages/dashboards/Merchant.jsx'))
const StockDashboard   = lazy(() => import('./pages/dashboards/Operations.jsx').then(m => ({ default: m.StockDashboard })))
const RiderDashboard   = lazy(() => import('./pages/dashboards/Operations.jsx').then(m => ({ default: m.RiderDashboard })))
const AffiliateDashboard = lazy(() => import('./pages/dashboards/Operations.jsx').then(m => ({ default: m.AffiliateDashboard })))
const CoordinatorDashboard = lazy(() => import('./pages/dashboards/Coordinator.jsx').then(m => ({ default: m.CoordinatorDashboard })))

// ── Query client ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
})

function PageLoader() {
  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={8} />
        <span className="font-mono text-xs text-text-m tracking-widest uppercase animate-pulse">
          Loading...
        </span>
      </div>
    </div>
  )
}

function DashboardRedirect() {
  const user = useAuthStore(s => s.user)
  const ROUTES = {
    super_admin:           '/dashboard/ceo',
    developer_coordinator: '/dashboard/coordinator',
    business_owner:        '/dashboard/merchant',
    stock_manager:         '/dashboard/stock',
    delivery:              '/dashboard/rider',
    affiliate:             '/dashboard/affiliate',
    buyer:                 '/dashboard/buyer',
  }
  return <Navigate to={user ? (ROUTES[user.role] || '/dashboard/buyer') : '/login'} replace />
}

function PublicLayout({ children }) {
  return <div className="min-h-screen bg-midnight"><Navbar />{children}</div>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
              <Route path="/login" element={<RequireGuest><PublicLayout><Login /></PublicLayout></RequireGuest>} />
              <Route path="/register" element={<RequireGuest><PublicLayout><Register /></PublicLayout></RequireGuest>} />
              <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
              <Route path="/reset-password/:token" element={<PublicLayout><ResetPassword /></PublicLayout>} />

              {/* Protected dashboards */}
              <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                <Route index element={<DashboardRedirect />} />
                <Route path="ceo"          element={<CEODashboard />} />
                <Route path="ceo/kyc"      element={<CEODashboard />} />
                <Route path="ceo/escrow"   element={<CEODashboard />} />
                <Route path="ceo/metrics"  element={<CEODashboard />} />
                <Route path="coordinator"  element={<CoordinatorDashboard />} />
                <Route path="coordinator/stores" element={<CoordinatorDashboard />} />
                <Route path="coordinator/staff"  element={<CoordinatorDashboard />} />
                <Route path="merchant"           element={<MerchantDashboard />} />
                <Route path="merchant/listings"  element={<MerchantDashboard />} />
                <Route path="merchant/settlement"element={<MerchantDashboard />} />
                <Route path="merchant/analytics" element={<MerchantDashboard />} />
                <Route path="stock"        element={<StockDashboard />} />
                <Route path="stock/manifest" element={<StockDashboard />} />
                <Route path="stock/audit"  element={<StockDashboard />} />
                <Route path="rider"        element={<RiderDashboard />} />
                <Route path="rider/active" element={<RiderDashboard />} />
                <Route path="affiliate"           element={<AffiliateDashboard />} />
                <Route path="affiliate/campaigns" element={<AffiliateDashboard />} />
                <Route path="affiliate/payouts"   element={<AffiliateDashboard />} />
                <Route path="buyer"        element={<BuyerDashboard />} />
              </Route>

              {/* Shop routes */}
              <Route path="/shop" element={<PublicLayout><BuyerDashboard /></PublicLayout>} />
              <Route path="/cart" element={<RequireAuth><PublicLayout><BuyerDashboard /></PublicLayout></RequireAuth>} />

              {/* 404 */}
              <Route path="*" element={
                <PublicLayout>
                  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
                    <p className="font-mono text-8xl font-black text-border mb-4">404</p>
                    <h1 className="font-display text-3xl font-bold text-text-p mb-2">Page Not Found</h1>
                    <p className="font-body text-text-m mb-8">The page you're looking for doesn't exist.</p>
                    <a href="/" className="btn btn-primary px-8">Back to Gimbiya Mall</a>
                  </div>
                </PublicLayout>
              } />
            </Routes>
          </Suspense>

          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#0D0D1F', color: '#E8E8F0',
              border: '1px solid #1E1E3F',
              fontFamily: 'Inter, sans-serif', fontSize: '13px',
            },
            success: { iconTheme: { primary: '#00D98B', secondary: '#050510' }, duration: 3000 },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#050510' }, duration: 4000 },
          }} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
