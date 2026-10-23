// Version 2.1 API clients. Kept in their own file so api/index.js stays untouched.
import api from './index.js'

export const revenueApi = {
  current: () => api.get('/revenue'),
  history: () => api.get('/revenue/history'),
  publish: (data) => api.post('/revenue', data),
}

export const inviteApi = {
  create:  (data) => api.post('/invites', data),
  list:    (params) => api.get('/invites', { params }),
  revoke:  (id) => api.post(`/invites/${id}/revoke`),
  preview: (token) => api.get(`/invites/public/${encodeURIComponent(token)}`),
  accept:  (token, data) => api.post(`/invites/public/${encodeURIComponent(token)}/accept`, data),
}

export const performanceApi = {
  affiliates: (params) => api.get('/performance/affiliates', { params }),
  setReferral: (storeId, affiliateId) => api.put(`/performance/stores/${storeId}/referral`, { affiliateId }),
}

export const waiverProductsApi = {
  setProducts: (quotaId, eligibleProductIds) => api.put(`/waivers/quotas/${quotaId}/products`, { eligibleProductIds }),
}

export const inviteExtraApi = {
  options: () => api.get('/invites/options'),
  pendingMerchants: () => api.get('/invites/merchants/pending'),
  merchantDetail: (storeId) => api.get(`/invites/merchants/${storeId}`),
  verifyMerchant: (storeId, note) => api.post(`/invites/merchants/${storeId}/verify`, { note }),
  rejectMerchant: (storeId, note) => api.post(`/invites/merchants/${storeId}/reject`, { note }),
}

export const orderApi = {
  quote: (ref) => api.get('/cart-v2/quote', { params: ref ? { ref } : {} }),
  mine: () => api.get('/cart-v2/orders'),
  byRef: (orderRef) => api.get(`/cart-v2/orders/${encodeURIComponent(orderRef)}`),
  cancel: (orderRef) => api.post(`/cart-v2/orders/${encodeURIComponent(orderRef)}/cancel`),
  myJobs: () => api.get('/cart-v2/my-jobs'),
  completeService: (fulfillmentGroupId, submittedOtp) => api.post('/cart-v2/service-jobs/complete', { fulfillmentGroupId, submittedOtp }),
}

export const walletApi = {
  me: () => api.get('/wallet'),
  banks: () => api.get('/wallet/banks'),
  withdraw: (data) => api.post('/wallet/withdrawals', data),
  adminList: (params) => api.get('/wallet/admin/withdrawals', { params }),
  adminSummary: () => api.get('/wallet/admin/summary'),
  approve: (id) => api.post(`/wallet/admin/withdrawals/${id}/approve`),
  markPaid: (id, note) => api.post(`/wallet/admin/withdrawals/${id}/mark-paid`, { note }),
  reject: (id, note) => api.post(`/wallet/admin/withdrawals/${id}/reject`, { note }),
}

export const subscriptionApi = {
  me: () => api.get('/subscriptions/me'),
  checkout: (tier) => api.post('/subscriptions/checkout', { tier }),
}

export const pricingApi = {
  info: (params) => api.get('/products/pricing-info', { params }),
}
