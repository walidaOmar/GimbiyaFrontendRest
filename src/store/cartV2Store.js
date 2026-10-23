import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { cartV2Api } from '../api/index.js'

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback

export const useCartV2 = create(persist(
  (set, get) => ({
    ownerId: null,
    items: [],

    bindUser: (userId) => {
      const ownerId = get().ownerId
      if (ownerId && ownerId !== userId) set({ ownerId: userId, items: [] })
      else if (!ownerId) set({ ownerId: userId })
    },
    // One cart = one market. Returns { ok, message } so the caller can show the reason.
    add: (product, quantity = 1) => {
      const state = get()
      const node = state.items[0]?.assignedState
      if (node && product.assignedState && node !== product.assignedState) {
        return { ok: false, message: `Your cart already has items from ${node}. Check out or clear it before shopping in ${product.assignedState}.` }
      }
      const minQty = product.minimumOrderQuantity || 1
      const found = state.items.find((item) => item.productId === product._id)
      const nextQty = Math.max(minQty, (found?.quantity || 0) + quantity)
      if (product.stock != null && nextQty > product.stock) return { ok: false, message: `Only ${product.stock} available.` }
      if (found) {
        set({ items: state.items.map((item) => item.productId === product._id ? { ...item, quantity: nextQty } : item) })
      } else {
        set({
          items: [...state.items, {
            productId: product._id,
            name: product.name,
            priceKobo: product.priceKobo,
            imageUrl: product.imageUrls?.[0] || product.imageUrl,
            assignedState: product.assignedState,
            minimumOrderQuantity: minQty,
            stock: product.stock,
            quantity: nextQty,
            services: [],
          }],
        })
      }
      return { ok: true }
    },
    setQty: (productId, quantity) => {
      const item = get().items.find((entry) => entry.productId === productId)
      const minQty = item?.minimumOrderQuantity || 1
      if (quantity < 1) return get().remove(productId)
      const next = Math.max(minQty, quantity)
      if (item?.stock != null && next > item.stock) { toast.error(`Only ${item.stock} available.`); return }
      set((state) => ({ items: state.items.map((entry) => entry.productId === productId ? { ...entry, quantity: next } : entry) }))
    },
    remove: async (productId) => {
      const item = get().items.find((entry) => entry.productId === productId)
      if (item?.cartItemId) {
        try {
          await cartV2Api.removeItem(item.cartItemId)
        } catch (error) {
          toast.error(errorMessage(error, 'Could not remove this item from your saved cart.'))
          return false
        }
      }
      set((state) => ({ items: state.items.filter((entry) => entry.productId !== productId) }))
      return true
    },
    setCartItemId: (productId, cartItemId) => set((state) => ({
      items: state.items.map((item) => item.productId === productId ? { ...item, cartItemId } : item),
    })),
    addService: (productId, service) => {
      const item = get().items.find((entry) => entry.productId === productId)
      if (item?.services.some((entry) => entry.offeringId === service.offeringId)) return { ok: false, message: 'That service is already on this item.' }
      set((state) => ({ items: state.items.map((entry) => entry.productId === productId ? { ...entry, services: [...entry.services, service] } : entry) }))
      return { ok: true }
    },
    removeService: async (productId, offeringId) => {
      const item = get().items.find((entry) => entry.productId === productId)
      const serviceIndex = item?.services.findIndex((service) => service.offeringId === offeringId) ?? -1
      const service = item?.services[serviceIndex]
      if (item?.cartItemId && service?.synced) {
        try {
          await cartV2Api.removeService(item.cartItemId, serviceIndex)
        } catch (error) {
          toast.error(errorMessage(error, 'Could not remove this service from your saved cart.'))
          return false
        }
      }
      set((state) => ({
        items: state.items.map((entry) => entry.productId === productId
          ? { ...entry, services: entry.services.filter((serviceItem) => serviceItem.offeringId !== offeringId) }
          : entry),
      }))
      return true
    },
    markServiceSynced: (productId, offeringId) => set((state) => ({
      items: state.items.map((item) => item.productId === productId
        ? { ...item, services: item.services.map((service) => service.offeringId === offeringId ? { ...service, synced: true } : service) }
        : item),
    })),
    clear: () => set({ items: [] }),
    count: () => get().items.reduce((count, item) => count + item.quantity, 0),
    total: () => get().items.reduce((total, item) => total + item.priceKobo * item.quantity + item.services.reduce((sum, service) => sum + (service.priceKobo || 0), 0), 0),
  }),
  { name: 'gimbiya-cart-v2', partialize: (state) => ({ ownerId: state.ownerId, items: state.items }) }
))
