import axios from 'axios'
import toast from 'react-hot-toast'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,          // sends httpOnly cookie on every request
  timeout: 15000,
})

// ── REQUEST INTERCEPTOR ───────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    }
    return config
  },
  (error)  => Promise.reject(error)
)

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    const status  = error.response?.status
    const message = error.response?.data?.message || 'Something went wrong'

    if (status === 401) {
      // Clear local state — let AuthContext handle redirect
      window.dispatchEvent(new CustomEvent('auth:logout'))
    } else if (status === 403) {
      toast.error('You do not have permission to do that.')
    } else if (status === 429) {
      toast.error('Too many requests. Please slow down.')
    } else if (status >= 500) {
      toast.error('Server error. Please try again.')
    }

    return Promise.reject(error)
  }
)

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup:        (data)  => api.post('/auth/signup', data),
  login:         (data)  => api.post('/auth/login', data),
  logout:        ()      => api.post('/auth/logout'),
  verifyEmail:   (code)  => api.post('/auth/verify-email', { code }),
  forgotPassword:(email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  checkAuth:     ()      => api.get('/auth/check-auth'),
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
export const productApi = {
  getCatalog:  (params) => api.get('/products', { params }),
  getOne:      (id)     => api.get(`/products/${id}`),
  publish:     (data)   => api.post('/products', data),
  myListings:  (params) => api.get('/products/merchant/my-listings', { params }),
  updatePrice: (id, priceKobo) => api.patch(`/products/${id}/price`, { priceKobo }),
  toggle:      (id, isActive)  => api.patch(`/products/${id}/toggle`, { isActive }),
  analytics:   ()       => api.get('/products/merchant/analytics'),
  settlement:  (params) => api.get('/products/merchant/settlement', { params }),
}

// ── ORDERS ────────────────────────────────────────────────────────────────────
export const orderApi = {
  getCart:     ()       => api.get('/orders/cart'),
  updateCart:  (data)   => api.post('/orders/cart', data),
  checkout:    (data)   => api.post('/orders/checkout', data),
  history:     (params) => api.get('/orders/history', { params }),
  getOne:      (id)     => api.get(`/orders/${id}`),
  cancel:      (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
}

// ── STOCK ─────────────────────────────────────────────────────────────────────
export const stockApi = {
  manifest:    (params) => api.get('/stock/manifest', { params }),
  adjust:      (data)   => api.post('/stock/adjust', data),
  inbound:     (data)   => api.post('/stock/inbound', data),
  auditLog:    (productId, params) => api.get(`/stock/audit/${productId}`, { params }),
}

// ── STORES ───────────────────────────────────────────────────────────────────
export const storeApi = {
  list:            (params) => api.get('/stores', { params }),
  getOne:          (id)     => api.get(`/stores/${id}`),
  pending:         (params) => api.get('/stores/pending', { params }),
  verify:          (id, data) => api.post(`/stores/${id}/verify`, data),
  reject:          (id, data) => api.post(`/stores/${id}/reject`, data),
  onboard:         (data)   => api.post('/stores/onboard', data),
  submitRequest:   (data)   => api.post('/stores/requests', data),
  pendingRequests: (params) => api.get('/stores/requests/pending', { params }),
  getRequest:      (id)     => api.get(`/stores/requests/${id}`),
  approveRequest:  (id, data) => api.post(`/stores/requests/${id}/approve`, data),
  rejectRequest:   (id, data) => api.post(`/stores/requests/${id}/reject`, data),
  createBranch:    (storeId, data) => api.post(`/stores/${storeId}/branches`, data),
  availableStaff:  (params) => api.get('/stores/available-staff', { params }),
}

export const onboardingApi = {
  submitRequest: (data) => api.post('/onboarding/requests', data),
}

// ── DELIVERY ──────────────────────────────────────────────────────────────────
export const deliveryApi = {
  jobs:        ()     => api.get('/delivery/jobs'),
  active:      ()     => api.get('/delivery/active'),
  claim:       (orderId)   => api.post('/delivery/claim', { orderId }),
  handover:    (data)      => api.post('/delivery/handover', data),
  location:    (data)      => api.post('/delivery/location', data),
}

// ── CEO ───────────────────────────────────────────────────────────────────────
export const ceoApi = {
  metrics:     ()     => api.get('/ceo/metrics'),
  telemetry:   (params) => api.get('/ceo/telemetry', { params }),
  kycQueue:    (params) => api.get('/ceo/kyc', { params }),
  adjudicate:  (data) => api.post('/ceo/kyc/adjudicate', data),
  revokeAccess:(data) => api.post('/ceo/users/revoke', data),
  escrow:      (params) => api.get('/ceo/escrow', { params }),
}

// ── AFFILIATE ─────────────────────────────────────────────────────────────────
export const affiliateApi = {
  campaigns:      ()       => api.get('/affiliate/campaigns'),
  create:         (data)   => api.post('/affiliate/campaigns', data),
  analytics:      ()       => api.get('/affiliate/analytics'),
  getAnalytics:   (params) => api.get('/affiliate/analytics', { params }),
  trackClick:     (code)   => api.get(`/affiliate/click/${code}`),
  recordClick:    (data)   => api.post('/affiliate/clicks', data),
  getClickHistory:(params) => api.get('/affiliate/clicks/history', { params }),
  getInvoices:    ()       => api.get('/affiliate/invoices'),
  getInvoice:     (code)   => api.get(`/affiliate/invoices/${code}`),
  summary:        ()       => api.get('/affiliate/summary'),
  markPayout:     (id)     => api.post(`/affiliate/payouts/${id}/mark-paid`),
}

// ── WAIVERS ─────────────────────────────────────────────────────────────────
export const waiverApi = {
  getQuotas:         () => api.get('/waivers/quotas'),
  allocateQuota:     (data) => api.post('/waivers/quotas', data),
  getMyQuota:        () => api.get('/waivers/quotas/me'),
  getPendingRequests:() => api.get('/waivers/requests/pending'),
  approveRequest:    (id) => api.post(`/waivers/requests/${id}/approve`),
  rejectRequest:     (id, data) => api.post(`/waivers/requests/${id}/reject`, data),
  myCoupons:         () => api.get('/waivers/my-coupons'),
  submitRequest:     (data) => api.post('/waivers/requests', data),
  validateCoupon:    (code) => api.get(`/waivers/coupons/validate/${encodeURIComponent(code)}`),
}

// ── USERS ─────────────────────────────────────────────────────────────────────
export const userApi = {
  me:          ()     => api.get('/users/me'),
  updateMe:    (data) => api.patch('/users/me', data),
  list:        (params) => api.get('/users', { params }),
  updateRole:  (id, data) => api.patch(`/users/${id}/role`, data),
}

export default api
