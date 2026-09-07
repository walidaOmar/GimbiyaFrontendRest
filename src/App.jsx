import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider }        from '@tanstack/react-query'
import { Toaster }                                 from 'react-hot-toast'
import { Suspense, lazy, useEffect }               from 'react'

import { AuthProvider, RequireAuth, RequireGuest, RoleGuard } from './context/AuthContext.jsx'
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
const CEODashboard     = lazy(() => import('./pages/dashboards/CEOBrassDashboard.jsx'))
const BuyerDashboard   = lazy(() => import('./pages/dashboards/Buyer.jsx'))
const MerchantDashboard= lazy(() => import('./pages/dashboards/Merchant.jsx'))
const StockDashboard   = lazy(() => import('./pages/dashboards/Operations.jsx').then(m => ({ default: m.StockDashboard })))
const RiderDashboard   = lazy(() => import('./pages/dashboards/Operations.jsx').then(m => ({ default: m.RiderDashboard })))
const AffiliateDashboard = lazy(() => import('./pages/dashboards/AffiliateTrackingDashboard.jsx'))
const CoordinatorDashboard = lazy(() => import('./pages/dashboards/CoordinatorTrackingDashboard.jsx'))
const PropertyAdminDashboard = lazy(() => import('./pages/dashboards/PropertyAdminDashboard.jsx'))
const DealInitiatorDashboard = lazy(() => import('./pages/dashboards/DealInitiatorDashboard.jsx'))
const ProductManager = lazy(() => import('./pages/dashboards/ProductManager.jsx'))
const StaffManagement = lazy(() => import('./pages/dashboards/StaffManagement.jsx'))
const StaffOnboarding = lazy(() => import('./pages/dashboards/StaffOnboarding.jsx'))
const StoreOnboarding = lazy(() => import('./pages/dashboards/StoreOnboarding.jsx'))
const SovereignMarketWorkspace = lazy(() => import('./pages/dashboards/SovereignMarketWorkspace.jsx'))
const UnifiedMarketplace = lazy(() => import('./pages/UnifiedMarketplace.jsx'))
const PropertyDetail = lazy(() => import('./pages/PropertyDetail.jsx'))

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
    ceo:                   '/dashboard/ceo',
    super_admin:           '/dashboard/ceo',
    developer_coordinator: '/dashboard/coordinator',
    business_owner:        '/dashboard/merchant',
    property_admin:        '/dashboard/property-admin',
    deal_initiator:       '/dashboard/deal-initiator',
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

function DeepLinkHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get('ref')
    const productId = params.get('product')

    if (ref) {
      localStorage.setItem('affiliateRef', ref)
    }

    if (productId) {
      navigate(`/product/${productId}?ref=${ref || ''}`)
    }
  }, [location, navigate])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <DeepLinkHandler />
            <Routes>
              {/* Public */}
              <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
              <Route path="/login" element={<RequireGuest><PublicLayout><Login /></PublicLayout></RequireGuest>} />
              <Route path="/register" element={<RequireGuest><PublicLayout><Register /></PublicLayout></RequireGuest>} />
              <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
              <Route path="/reset-password/:token" element={<PublicLayout><ResetPassword /></PublicLayout>} />
              <Route path="/unauthorized" element={<PublicLayout><div className="min-h-[70vh] flex items-center justify-center"><div className="card text-center"><p className="section-label mb-2">Access denied</p><h1 className="font-display text-2xl font-bold">Unauthorized</h1><p className="text-text-m mt-2">Your role cannot access this dashboard.</p></div></div></PublicLayout>} />

              {/* Protected dashboards */}
              <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                <Route index element={<DashboardRedirect />} />
                <Route path="ceo"          element={<RoleGuard allowed={['ceo', 'super_admin']}><CEODashboard /></RoleGuard>} />
                <Route path="ceo/kyc"      element={<RoleGuard allowed={['ceo', 'super_admin']}><CEODashboard /></RoleGuard>} />
                <Route path="ceo/escrow"   element={<RoleGuard allowed={['ceo', 'super_admin']}><CEODashboard /></RoleGuard>} />
                <Route path="ceo/metrics"  element={<RoleGuard allowed={['ceo', 'super_admin']}><CEODashboard /></RoleGuard>} />
                <Route path="ceo/stores"   element={<RoleGuard allowed={['ceo', 'super_admin']}><CEODashboard /></RoleGuard>} />
                <Route path="ceo/pending"  element={<RoleGuard allowed={['ceo', 'super_admin']}><CEODashboard /></RoleGuard>} />
                <Route path="ceo/users"    element={<RoleGuard allowed={['ceo', 'super_admin']}><CEODashboard /></RoleGuard>} />
                <Route path="ceo/waivers"  element={<RoleGuard allowed={['ceo', 'super_admin']}><CEODashboard /></RoleGuard>} />
                <Route path="ceo/incubator-:view" element={<RoleGuard allowed={['ceo', 'super_admin']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="ceo/wallet" element={<RoleGuard allowed={['ceo', 'super_admin']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="ceo/team" element={<RoleGuard allowed={['ceo', 'super_admin']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="ceo/reports" element={<RoleGuard allowed={['ceo', 'super_admin', 'auditor', 'support']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="coordinator"  element={<RoleGuard allowed={['developer_coordinator']}><CoordinatorDashboard /></RoleGuard>} />
                <Route path="coordinator/stores" element={<RoleGuard allowed={['developer_coordinator']}><CoordinatorDashboard /></RoleGuard>} />
                <Route path="coordinator/staff"  element={<RoleGuard allowed={['developer_coordinator']}><CoordinatorDashboard /></RoleGuard>} />
                <Route path="coordinator/incubator-:view" element={<RoleGuard allowed={['developer_coordinator']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="coordinator/wallet" element={<RoleGuard allowed={['developer_coordinator']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="coordinator/team" element={<RoleGuard allowed={['developer_coordinator']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="coordinator/reports" element={<RoleGuard allowed={['developer_coordinator']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="staff" element={<RequireAuth allowedRoles={['super_admin', 'developer_coordinator']}><StaffManagement /></RequireAuth>} />
                <Route path="staff/onboard" element={<RequireAuth allowedRoles={['super_admin', 'developer_coordinator']}><StaffOnboarding /></RequireAuth>} />
                <Route path="stores/onboard" element={<RequireAuth allowedRoles={['super_admin', 'developer_coordinator', 'affiliate']}><StoreOnboarding /></RequireAuth>} />
                <Route path="merchant"           element={<MerchantDashboard />} />
                <Route path="merchant/listings"  element={<MerchantDashboard />} />
                <Route path="merchant/settlement"element={<MerchantDashboard />} />
                <Route path="merchant/analytics" element={<MerchantDashboard />} />
                <Route path="merchant/reports" element={<RequireAuth allowedRoles={['business_owner']}><SovereignMarketWorkspace /></RequireAuth>} />
                <Route path="property-admin" element={<RequireAuth allowedRoles={['property_admin']}><PropertyAdminDashboard /></RequireAuth>} />
                <Route path="deal-initiator" element={<RequireAuth allowedRoles={['deal_initiator']}><DealInitiatorDashboard /></RequireAuth>} />
                <Route path="product-manager" element={<RequireAuth allowedRoles={['business_owner']}><ProductManager /></RequireAuth>} />
                <Route path="stock"        element={<StockDashboard />} />
                <Route path="stock/manifest" element={<StockDashboard />} />
                <Route path="stock/audit"  element={<StockDashboard />} />
                <Route path="rider"        element={<RiderDashboard />} />
                <Route path="rider/active" element={<RiderDashboard />} />
                <Route path="affiliate"           element={<RoleGuard allowed={['affiliate']}><AffiliateDashboard /></RoleGuard>} />
                <Route path="affiliate/campaigns" element={<RoleGuard allowed={['affiliate']}><AffiliateDashboard /></RoleGuard>} />
                <Route path="affiliate/payouts"   element={<RoleGuard allowed={['affiliate']}><AffiliateDashboard /></RoleGuard>} />
                <Route path="affiliate/incubator-:view" element={<RoleGuard allowed={['affiliate']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="affiliate/wallet" element={<RoleGuard allowed={['affiliate']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="affiliate/team" element={<RoleGuard allowed={['affiliate']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="affiliate/reports" element={<RoleGuard allowed={['affiliate']}><SovereignMarketWorkspace /></RoleGuard>} />
                <Route path="buyer"        element={<BuyerDashboard />} />
              </Route>

              {/* Marketplace routes */}
              <Route path="/marketplace" element={<PublicLayout><UnifiedMarketplace /></PublicLayout>} />
              <Route path="/properties/:id" element={<PublicLayout><PropertyDetail /></PublicLayout>} />

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
