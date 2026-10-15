import { create } from 'zustand'
import { STATE_OPTIONS } from '../config/regions.js'
import { useCartV2 } from './cartV2Store.js'

const v2 = () => useCartV2.getState()

export const useMallStore = create((set, get) => ({
  // Region and floor selection
  selectedState: STATE_OPTIONS[1].value,
  selectedFloor: 'LEVEL_1',
  setSelectedState: (state) => set({ selectedState: state }),
  setSelectedFloor: (floor) => set({ selectedFloor: floor }),

  // Cart (optimistic local state)
  cartItems: [],
  cartCount: () => get().cartItems.reduce((s, i) => s + i.quantity, 0),
  cartTotal: () => get().cartItems.reduce(
    (sum, item) => sum + item.priceKobo * item.quantity + (item.serviceItems || []).reduce((serviceSum, service) => serviceSum + service.priceKobo, 0),
    0
  ),

  addToCart: (product, quantity = 1) => {
    v2().add(product, quantity)
    set((state) => {
      const existing = state.cartItems.find((i) => i.productId === product._id)
      if (existing) {
        return {
          cartItems: state.cartItems.map((i) =>
            i.productId === product._id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        }
      }
      return {
        cartItems: [
          ...state.cartItems,
          {
            productId:   product._id,
            name:        product.name,
            priceKobo:   product.priceKobo,
            imageUrls:   product.imageUrls,
            quantity,
          },
        ],
      }
    })
  },

  removeFromCart: async (productId) => {
    const removed = await v2().remove(productId)
    if (!removed) return
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.productId !== productId),
    }))
  },

  updateCartQty: (productId, quantity) => {
    v2().setQty(productId, quantity)
    if (quantity < 1) return get().removeFromCart(productId)
    set((state) => ({
      cartItems: state.cartItems.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }))
  },

  addServiceToCartItem: (productId, offering) => {
    v2().addService(productId, { offeringId: offering._id, serviceType: offering.serviceType, priceKobo: offering.priceKobo })
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.productId === productId
          ? { ...item, serviceItems: [...(item.serviceItems || []), {
            offeringId: offering._id,
            serviceType: offering.serviceType,
            priceKobo: offering.priceKobo,
          }] }
          : item
      ),
    }))
  },

  removeServiceFromCartItem: async (productId, offeringId) => {
    const removed = await v2().removeService(productId, offeringId)
    if (!removed) return
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.productId === productId
          ? { ...item, serviceItems: (item.serviceItems || []).filter((service) => service.offeringId !== offeringId) }
          : item
      ),
    }))
  },

  clearCart: () => { v2().clear(); set({ cartItems: [] }) },

  // SSE connection
  sseConnection: null,
  setSseConnection: (conn) => set({ sseConnection: conn }),
}))
