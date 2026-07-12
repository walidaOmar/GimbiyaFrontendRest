import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Menu, X, ChevronDown, LogOut,
  User, LayoutDashboard, Bell,
} from 'lucide-react'
import { useAuthStore }  from '../../store/authStore.js'
import { useMallStore }  from '../../store/mallStore.js'
import { ROLE_ROUTES }   from '../../context/AuthContext.jsx'
import { GlowDot }       from '../ui/index.jsx'
import toast             from 'react-hot-toast'

const STATES = ['Abuja', 'Kano', 'Kaduna']

export function Navbar() {
  const navigate            = useNavigate()
  const location            = useLocation()
  const { user, logout }    = useAuthStore()
  const { cartItems, selectedState, setSelectedState } = useMallStore()
  const [menuOpen, setMenu] = useState(false)
  const [userMenu, setUser] = useState(false)

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)
  const isDashboard = location.pathname.startsWith('/dashboard')

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const dashboardRoute = user ? (ROLE_ROUTES[user.role] || '/dashboard/buyer') : '/login'

  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 glass bg-midnight/90">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="relative w-9 h-9">
            {/* Simplified logo mark — golden crown crown */}
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <circle cx="18" cy="18" r="17" fill="#0D4A3A" stroke="#C8A84B" strokeWidth="1.5"/>
              <polygon
                points="18,8 22,16 28,13 24,22 12,22 8,13 14,16"
                fill="none" stroke="#C8A84B" strokeWidth="1.5" strokeLinejoin="round"
              />
              <circle cx="18" cy="26" r="1.5" fill="#C8A84B"/>
            </svg>
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-bold text-lg text-text-p group-hover:text-brass transition-colors">
              Gimbiya Mall
            </span>
            <span className="block font-mono text-[9px] text-text-m tracking-[0.2em] uppercase leading-none">
              Strategic Ecosystem
            </span>
          </div>
        </Link>

        {/* ── State Selector (non-dashboard) ── */}
        {!isDashboard && (
          <div className="hidden md:flex items-center gap-1 bg-surface-h border border-border rounded-btn px-1 py-1">
            {STATES.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedState(s)}
                className={`px-3 py-1.5 rounded-[6px] font-mono text-xs transition-all duration-150 ${
                  selectedState === s
                    ? 'bg-brass text-midnight font-bold'
                    : 'text-text-m hover:text-brass'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2 ml-auto">

          {/* Cart — buyer only */}
          {user?.role === 'buyer' && (
            <Link
              to="/cart"
              className="relative btn-icon"
              aria-label={`Cart — ${cartCount} items`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-brass text-midnight rounded-full text-[10px] font-bold flex items-center justify-center font-mono"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </Link>
          )}

          {user ? (
            <>
              {/* Dashboard link */}
              <Link
                to={dashboardRoute}
                className="hidden sm:flex btn btn-ghost text-xs gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUser(!userMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-btn hover:bg-surface-h transition-colors"
                  aria-expanded={userMenu}
                >
                  <div className="w-8 h-8 rounded-full bg-brass/20 border border-brass/40 flex items-center justify-center">
                    <span className="font-display font-bold text-brass text-sm">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block font-body text-sm text-text-p max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-text-m transition-transform ${userMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border rounded-card shadow-card z-50"
                      onMouseLeave={() => setUser(false)}
                    >
                      <div className="p-3 border-b border-border">
                        <p className="font-body text-sm font-semibold text-text-p truncate">{user.name}</p>
                        <p className="font-mono text-xs text-text-m truncate">{user.email}</p>
                        <div className="mt-1.5">
                          <span className="badge-brass text-[10px]">{user.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="p-1">
                        <Link
                          to="/profile"
                          onClick={() => setUser(false)}
                          className="nav-item text-xs"
                        >
                          <User className="w-3.5 h-3.5" />
                          My Profile
                        </Link>
                        <Link
                          to={dashboardRoute}
                          onClick={() => setUser(false)}
                          className="nav-item text-xs"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="nav-item text-xs w-full text-danger hover:text-danger hover:bg-danger/10"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"    className="btn btn-ghost text-sm hidden sm:flex">Sign In</Link>
              <Link to="/register" className="btn btn-primary text-sm">Get Started</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="btn-icon sm:hidden"
            onClick={() => setMenu(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden border-t border-border overflow-hidden bg-surface"
          >
            <div className="p-4 space-y-1">
              {/* State selector */}
              <div className="flex gap-1 mb-3 bg-midnight rounded-btn p-1">
                {STATES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSelectedState(s); setMenu(false) }}
                    className={`flex-1 py-1.5 rounded-[6px] font-mono text-xs transition-all ${
                      selectedState === s ? 'bg-brass text-midnight font-bold' : 'text-text-m'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {!user ? (
                <>
                  <Link to="/login"    onClick={() => setMenu(false)} className="nav-item">Sign In</Link>
                  <Link to="/register" onClick={() => setMenu(false)} className="nav-item text-brass">Get Started</Link>
                </>
              ) : (
                <>
                  <Link to={dashboardRoute} onClick={() => setMenu(false)} className="nav-item">Dashboard</Link>
                  <button onClick={handleLogout} className="nav-item text-danger w-full text-left">Sign Out</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
