import api from './index.js'

export const revenueApi = {
  current: () => api.get('/revenue'),
  history: () => api.get('/revenue/history'),
  publish: (data) => api.post('/revenue', data),
}

export const inviteApi = {
  create: (data) => api.post('/invites', data),
  list: (params) => api.get('/invites', { params }),
  revoke: (id) => api.post(`/invites/${id}/revoke`),
  preview: (token) => api.get(`/invites/public/${encodeURIComponent(token)}`),
  accept: (token, data) => api.post(`/invites/public/${encodeURIComponent(token)}/accept`, data),
}

export const performanceApi = {
  affiliates: (params) => api.get('/performance/affiliates', { params }),
  setReferral: (storeId, affiliateId) => api.put(`/performance/stores/${storeId}/referral`, { affiliateId }),
}

export const waiverProductsApi = {
  setProducts: (quotaId, eligibleProductIds) => api.put(`/waivers/quotas/${quotaId}/products`, { eligibleProductIds }),
}
