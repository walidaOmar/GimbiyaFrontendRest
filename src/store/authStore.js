import { create } from 'zustand'
import { authApi } from '../api/index.js'

export const useAuthStore = create((set, get) => ({
  user:        null,
  isLoading:   true,   // true on app boot until checkAuth resolves
  isChecked:   false,

  // ── Actions ────────────────────────────────────────────────────────────
  setUser: (user) => set({ user }),

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const { data } = await authApi.checkAuth()
      set({ user: data.user, isLoading: false, isChecked: true })
    } catch {
      set({ user: null, isLoading: false, isChecked: true })
    }
  },

  login: async (credentials) => {
    const { data } = await authApi.login(credentials)
    set({ user: data.user })
    return data.user
  },

  logout: async () => {
    await authApi.logout()
    set({ user: null })
  },

  // Computed helpers
  isAuthenticated: () => !!get().user,
  userRole:        () => get().user?.role,
  userState:       () => get().user?.assignedState,
}))
