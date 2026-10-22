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
  verifyEmail:   (code, email) => api.post('/auth/verify-email', { code, email }),
  forgotPassword:(email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  checkAuth:     ()      => api.get('/auth/check-auth'),
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
export const productApi = {
  getCatalog:  (params) => api.get('/products', { params }),
  getAll:      (params) => api.get('/products', { params }),
  getOne:      (id)     => api.get(`/products/${id}`),
  publish:     (data)   => api.post('/products', data),
  create:      (data)   => api.post('/products', data),
  myListings:  (params) => api.get('/products/merchant/my-listings', { params }),
  getMyListings: (params) => api.get('/products/merchant/my-listings', { params }),
  updatePrice: (id, priceKobo) => api.patch(`/products/${id}/price`, { priceKobo }),
  toggle:      (id, isActive)  => api.patch(`/products/${id}/toggle`, { isActive }),
  analytics:   ()       => api.get('/products/merchant/analytics'),
  getAnalytics: ()      => api.get('/products/merchant/analytics'),
  analyticsV2: ()       => api.get('/products/merchant/analytics-v2'),
  settlement:  (params) => api.get('/products/merchant/settlement', { params }),
}

// ── PROPERTIES (isolated module) ──────────────────────────────────────────────
export const propertyApi = {
  getPublic: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.patch(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getMyListings: (params) => api.get('/properties/admin/my-listings', { params }),
  getDashboard: () => api.get('/properties/admin/dashboard'),
  getDealInitiatorDashboard: () => api.get('/properties/deal-initiator/dashboard'),
  createInquiry: (id, data) => api.post(`/properties/${id}/inquire`, data),
  assignInquiry: (id, data) => api.patch(`/properties/inquiries/${id}/assign`, data),
  updateInquiryStatus: (id, data) => api.patch(`/properties/inquiries/${id}/status`, data),
}

// ── ORDERS (V1: cart coupon + fulfillment-coupon bulk pay) ─────────────────────
export const orderApi = {
  getCart:     ()       => api.get('/orders/cart'),
  updateCart:  (data)   => api.post('/orders/cart', data),
  applyCoupon: (code)   => api.post('/orders/cart/coupon', { code }),
  removeCoupon:()       => api.delete('/orders/cart/coupon'),
  checkout:    (data)   => api.post('/orders/checkout', data),
  history:     (params) => api.get('/orders/history', { params }),
  getOne:      (id)     => api.get(`/orders/${id}`),
  cancel:      (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  getByCoupon: (couponCode) => api.get(`/orders/coupon/${encodeURIComponent(couponCode)}`),
  bulkFulfillmentPay: (data) => api.post('/orders/bulk-payment', data),
}

// ── STOCK ─────────────────────────────────────────────────────────────────────
export const stockApi = {
  manifest:    (params) => api.get('/stock/manifest', { params }),
  adjust:      (data)   => api.post('/stock/adjust', data),
  inbound:     (data)   => api.post('/stock/inbound', data),
  auditLog:    (productId, params) => api.get(`/stock/audit/${productId}`, { params }),
}

// ── STORES (created only via request: coordinator submits → super_admin approves)
export const storeApi = {
  list:            (params) => api.get('/stores', { params }),
  getOne:          (id)     => api.get(`/stores/${id}`),
  submitRequest:   (data)   => api.post('/stores/requests', data, { timeout: 120000 }),
  pendingRequests: (params) => api.get('/stores/requests/pending', { params }),
  getRequest:      (id)     => api.get(`/stores/requests/${id}`),
  approveRequest:  (id, data) => api.post(`/stores/requests/${id}/approve`, data),
  rejectRequest:   (id, data) => api.post(`/stores/requests/${id}/reject`, data),
  update:          (storeId, data) => api.patch(`/stores/${storeId}`, data),
  createBranch:    (storeId, data) => api.post(`/stores/${storeId}/branches`, data),
  updateBranch:    (branchId, data) => api.patch(`/stores/branches/${branchId}`, data),
  availableStaff:  (params) => api.get('/stores/staff/available', { params }),
}

// ── DELIVERY ──────────────────────────────────────────────────────────────────
export const deliveryApi = {
  jobs:        ()     => api.get('/delivery/jobs'),
  active:      ()     => api.get('/delivery/active'),
  claim:       (orderId)   => api.post('/delivery/claim', { orderId }),
  handover:    (data)      => api.post('/delivery/handover', data),
  location:    (data)      => api.post('/delivery/location', data),
}

// ── CEO / GROUP HQ (escrow is read-only) ──────────────────────────────────────
export const ceoApi = {
  metrics:       ()       => api.get('/ceo/metrics'),
  telemetry:     (params) => api.get('/ceo/telemetry', { params }),
  kycQueue:      (params) => api.get('/ceo/kyc', { params }),
  adjudicate:    (data)   => api.post('/ceo/kyc/adjudicate', data),
  revokeAccess:  (data)   => api.post('/ceo/users/revoke', data),
  escrowSummary: (params) => api.get('/ceo/escrow', { params }),
}

// ── TRACKING ─────────────────────────────────────────────────────────────────
export const trackingApi = {
  me:          () => api.get('/tracking/me'),
  affiliate:   () => api.get('/tracking/affiliate/summary'),
  coordinator: () => api.get('/tracking/coordinator/region'),
}

// ── AFFILIATE (campaigns / invoices) ──────────────────────────────────────────
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
}

// ── WAIVERS ─────────────────────────────────────────────────────────────────
export const waiverApi = {
  getQuotas:         (params) => api.get('/waivers/quotas', { params }),
  allocateQuota:     (data) => api.post('/waivers/quotas', data),
  getMyQuota:        () => api.get('/waivers/my-quota'),
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
  getById:     (id)   => api.get(`/users/${id}`),
  updateRole:  (id, data) => api.patch(`/users/${id}/role`, data),
}

// ═══ V2 CONTRACT CLIENTS (wired into UI in P3) ═══════════════════════════════
export const publicIdApi = {
  me:          ()         => api.get('/public-ids/me'),
  lookup:      (publicId) => api.get(`/public-ids/${encodeURIComponent(publicId)}`),
  upgradeTier: (userId, verificationType) => api.post(`/public-ids/${userId}/kyc-tier`, { verificationType }),
}

export const relationshipApi = {
  create:   (data) => api.post('/relationships', data),
  interact: (relationshipId, data) => api.post(`/relationships/${relationshipId}/interactions`, data),
  mine:     () => api.get('/relationships/mine'),
  regional: () => api.get('/relationships/regional'),
}

export const cartV2Api = {
  getCart:        () => api.get('/cart-v2'),
  addItem:        (data) => api.post('/cart-v2/items', data),
  removeItem:     (cartItemId) => api.delete(`/cart-v2/items/${cartItemId}`),
  addService:     (cartItemId, offeringId) => api.post(`/cart-v2/items/${cartItemId}/services`, { offeringId }),
  removeService:  (cartItemId, serviceIndex) => api.delete(`/cart-v2/items/${cartItemId}/services/${serviceIndex}`),
  checkout:       (data) => api.post('/cart-v2/checkout', data),
  myFulfillmentGroups: () => api.get('/cart-v2/fulfillment-groups/mine'),
  confirmFulfillmentGroup: (groupId) => api.post(`/cart-v2/fulfillment-groups/${groupId}/confirm`),
}

export const paymentApi = {
  initiate: (data) => api.post('/payments/initiate', data),
}

export const deliveryV2Api = {
  available: () => api.get('/delivery-v2/jobs/available'),
  mine:      () => api.get('/delivery-v2/jobs/mine'),
  claim:     (data) => api.post('/delivery-v2/jobs/claim', data),
  finalize:  (data) => api.post('/delivery-v2/jobs/finalize', data),
  location:  (data) => api.post('/delivery-v2/jobs/location', data),
}

export const serviceCatalogApi = {
  offerings:      (params) => api.get('/service-catalog/offerings', { params }),
  slots:          (params) => api.get('/service-catalog/slots', { params }),
  myOfferings:    () => api.get('/service-catalog/offerings/mine'),
  createOffering: (data) => api.post('/service-catalog/offerings', data),
  updateOffering: (offeringId, data) => api.patch(`/service-catalog/offerings/${offeringId}`, data),
  createSlot:     (data) => api.post('/service-catalog/slots', data),
  assignSlot:     (data) => api.post('/service-catalog/slots/assign', data),
}

export const groupOrderApi = {
  create: (data) => api.post('/group-orders', data),
  join:   (fulfillmentCode, data) => api.post(`/group-orders/${fulfillmentCode}/join`, data),
  byCode: (code) => api.get(`/group-orders/code/${code}`),
  open:   (params) => api.get('/group-orders/open', { params }),
  mine:   () => api.get('/group-orders/my'),
}

// ── REGIONS (Region → State → Market → Commercial Node) ──────────────────────
export const regionApi = {
  tree:       () => api.get('/regions/tree'),
  overview:   (params) => api.get('/regions/overview', { params }),
  updateNode: (key, data) => api.patch(`/regions/nodes/${encodeURIComponent(key)}`, data),
}

export default api
