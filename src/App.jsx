import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider }        from '@tanstack/react-query'
import { Toaster }                                 from 'react-hot-toast'
import { Suspense, lazy, useEffect }               from 'react'

import { AuthProvider, RequireAuth, RequireGuest, ROLE_ROUTES } from './context/AuthContext.jsx'
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
const CheckoutPaymentPanel = lazy(() => import('./pages/dashboards/CheckoutPaymentPanel.jsx').then(m => ({ default: m.CheckoutPaymentPanel })))
const StockDashboard   = lazy(() => import('./pages/dashboards/operations/StockDashboard.jsx').then(m => ({ default: m.StockDashboard })))
const RiderDashboard   = lazy(() => import('./pages/dashboards/operations/RiderDashboard.jsx').then(m => ({ default: m.RiderDashboard })))
const AffiliateDashboard = lazy(() => import('./pages/dashboards/AffiliateTrackingDashboard.jsx'))
const CoordinatorDashboard = lazy(() => import('./pages/dashboards/CoordinatorTrackingDashboard.jsx'))
const PROPERTY_MODULE_ENABLED = import.meta.env.VITE_ENABLE_PROPERTY_MODULE === 'true'
const PropertyAdminDashboard = PROPERTY_MODULE_ENABLED
  ? lazy(() => import('./pages/dashboards/PropertyAdminDashboard.jsx'))
  : null
const DealInitiatorDashboard = lazy(() => import('./pages/dashboards/DealInitiatorDashboard.jsx'))
const ProductManager = lazy(() => import('./pages/dashboards/ProductManager.jsx'))
const StaffManagement = lazy(() => import('./pages/dashboards/StaffManagement.jsx'))
const StaffOnboarding = lazy(() => import('./pages/dashboards/StaffOnboarding.jsx'))
const StoreOnboarding = lazy(() => import('./pages/dashboards/StoreOnboarding.jsx'))
const StoresView = lazy(() => import('./components/stores/StoresView.jsx'))
const UnifiedMarketplace = lazy(() => import('./pages/UnifiedMarketplace.jsx'))
const PropertyDetail = PROPERTY_MODULE_ENABLED ? lazy(() => import('./pages/PropertyDetail.jsx')) : null

const HQ_ROLES = ['ceo', 'super_admin', 'auditor', 'support']
const CEO_ROLES = ['ceo', 'super_admin']
const COORDINATOR_ROLES = ['developer_coordinator']
const STAFF_ROLES = ['super_admin', 'developer_coordinator']
const STORE_ONBOARDING_ROLES = ['developer_coordinator']
const MERCHANT_ROLES = ['business_owner', 'manager']
const PROPERTY_ADMIN_ROLES = ['property_admin']
const DEAL_INITIATOR_ROLES = ['deal_initiator']
const PRODUCT_MANAGER_ROLES = ['business_owner']
const STOCK_ROLES = ['stock_manager']
const RIDER_ROLES = ['delivery']
const AFFILIATE_ROLES = ['affiliate']
const BUYER_ROLES = ['buyer']

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
  return <Navigate to={user ? (ROLE_ROUTES[user.role] || '/dashboard/mall') : '/login'} replace />
}

function PublicLayout({ children }) {
  return <div className="min-h-screen bg-midnight"><Navbar />{children}</div>
}

function CheckoutPaymentRoute() {
  const { orderId } = useParams()
  return <PublicLayout><CheckoutPaymentPanel orderId={orderId} /></PublicLayout>
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
                <Route path="hq" element={<RequireAuth roles={HQ_ROLES}><CEODashboard /></RequireAuth>} />
                <Route path="hq/kyc" element={<RequireAuth roles={CEO_ROLES}><CEODashboard /></RequireAuth>} />
                <Route path="hq/escrow" element={<RequireAuth roles={CEO_ROLES}><CEODashboard /></RequireAuth>} />
                <Route path="hq/metrics" element={<RequireAuth roles={CEO_ROLES}><CEODashboard /></RequireAuth>} />
                <Route path="hq/stores" element={<RequireAuth roles={CEO_ROLES}><StoresView /></RequireAuth>} />
                <Route path="hq/pending" element={<RequireAuth roles={CEO_ROLES}><StoresView /></RequireAuth>} />
                <Route path="hq/users" element={<RequireAuth roles={CEO_ROLES}><CEODashboard /></RequireAuth>} />
                <Route path="hq/waivers" element={<RequireAuth roles={CEO_ROLES}><CEODashboard /></RequireAuth>} />
                <Route path="coordinator" element={<RequireAuth roles={COORDINATOR_ROLES}><CoordinatorDashboard /></RequireAuth>} />
                <Route path="coordinator/stores" element={<RequireAuth roles={COORDINATOR_ROLES}><CoordinatorDashboard /></RequireAuth>} />
                <Route path="coordinator/staff" element={<RequireAuth roles={COORDINATOR_ROLES}><CoordinatorDashboard /></RequireAuth>} />
                <Route path="staff" element={<RequireAuth roles={STAFF_ROLES}><StaffManagement /></RequireAuth>} />
                <Route path="staff/onboard" element={<RequireAuth roles={COORDINATOR_ROLES}><StaffOnboarding /></RequireAuth>} />
                <Route path="stores/onboard" element={<RequireAuth roles={STORE_ONBOARDING_ROLES}><StoreOnboarding /></RequireAuth>} />
                <Route path="merchant" element={<RequireAuth roles={MERCHANT_ROLES}><MerchantDashboard /></RequireAuth>} />
                <Route path="merchant/listings" element={<RequireAuth roles={MERCHANT_ROLES}><MerchantDashboard /></RequireAuth>} />
                <Route path="merchant/settlement" element={<RequireAuth roles={MERCHANT_ROLES}><MerchantDashboard /></RequireAuth>} />
                <Route path="merchant/analytics" element={<RequireAuth roles={MERCHANT_ROLES}><MerchantDashboard /></RequireAuth>} />
                <Route path="merchant/fulfillment" element={<RequireAuth roles={MERCHANT_ROLES}><MerchantDashboard /></RequireAuth>} />
                {PROPERTY_MODULE_ENABLED && <Route path="property-admin" element={<RequireAuth roles={PROPERTY_ADMIN_ROLES}><PropertyAdminDashboard /></RequireAuth>} />}
                <Route path="deal-initiator" element={<RequireAuth roles={DEAL_INITIATOR_ROLES}><DealInitiatorDashboard /></RequireAuth>} />
                <Route path="product-manager" element={<RequireAuth roles={PRODUCT_MANAGER_ROLES}><ProductManager /></RequireAuth>} />
                <Route path="stock" element={<RequireAuth roles={STOCK_ROLES}><StockDashboard /></RequireAuth>} />
                <Route path="stock/manifest" element={<RequireAuth roles={STOCK_ROLES}><StockDashboard /></RequireAuth>} />
                <Route path="stock/audit" element={<RequireAuth roles={STOCK_ROLES}><StockDashboard /></RequireAuth>} />
                <Route path="rider" element={<RequireAuth roles={RIDER_ROLES}><RiderDashboard /></RequireAuth>} />
                <Route path="rider/active" element={<RequireAuth roles={RIDER_ROLES}><RiderDashboard /></RequireAuth>} />
                <Route path="affiliate" element={<RequireAuth roles={AFFILIATE_ROLES}><AffiliateDashboard /></RequireAuth>} />
                <Route path="affiliate/campaigns" element={<RequireAuth roles={AFFILIATE_ROLES}><AffiliateDashboard /></RequireAuth>} />
                <Route path="affiliate/payouts" element={<RequireAuth roles={AFFILIATE_ROLES}><AffiliateDashboard /></RequireAuth>} />
                <Route path="mall" element={<RequireAuth roles={BUYER_ROLES}><BuyerDashboard /></RequireAuth>} />
              </Route>

              {/* Marketplace routes */}
              <Route path="/marketplace" element={<PublicLayout><UnifiedMarketplace /></PublicLayout>} />
              {PROPERTY_MODULE_ENABLED && <Route path="/properties/:id" element={<PublicLayout><PropertyDetail /></PublicLayout>} />}

              {/* Shop routes */}
              <Route path="/shop" element={<PublicLayout><BuyerDashboard /></PublicLayout>} />
              <Route path="/cart" element={<RequireAuth><PublicLayout><BuyerDashboard /></PublicLayout></RequireAuth>} />
              <Route path="/checkout/payment/:orderId" element={<RequireAuth roles={BUYER_ROLES}><CheckoutPaymentRoute /></RequireAuth>} />

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
