import { create } from 'zustand'

export const useMallStore = create((set, get) => ({
  // Region and floor selection
  selectedState: 'Kano',
  selectedFloor: 'LEVEL_1',
  setSelectedState: (state) => set({ selectedState: state }),
  setSelectedFloor: (floor) => set({ selectedFloor: floor }),

  // Cart (optimistic local state)
  cartItems: [],
  cartCount: () => get().cartItems.reduce((s, i) => s + i.quantity, 0),
  cartTotal: () => get().cartItems.reduce((s, i) => s + i.priceKobo * i.quantity, 0),

  addToCart: (product, quantity = 1) => {
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

  removeFromCart: (productId) => {
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.productId !== productId),
    }))
  },

  updateCartQty: (productId, quantity) => {
    if (quantity < 1) return get().removeFromCart(productId)
    set((state) => ({
      cartItems: state.cartItems.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    }))
  },

  clearCart: () => set({ cartItems: [] }),

  // SSE connection
  sseConnection: null,
  setSseConnection: (conn) => set({ sseConnection: conn }),
}))
