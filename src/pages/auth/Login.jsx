import { useState }       from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion }          from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore }    from '../../store/authStore.js'
import { Button, Input }   from '../../components/ui/index.jsx'
import { ROLE_ROUTES }     from '../../context/AuthContext.jsx'
import toast               from 'react-hot-toast'

export default function Login() {
  const navigate            = useNavigate()
  const location            = useLocation()
  const { login }           = useAuthStore()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoad]  = useState(false)
  const [errors, setErrors] = useState({})

  const from = location.state?.from?.pathname || null

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoad(true)
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.name}!`)
      const dest = from || ROLE_ROUTES[user.role] || '/dashboard/buyer'
      navigate(dest, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      toast.error(msg)
      if (msg.toLowerCase().includes('password')) {
        setErrors({ password: msg })
      } else {
        setErrors({ email: msg })
      }
    } finally {
      setLoad(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0D4A3A 0%, #050510 60%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6 group">
            <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto drop-shadow-[0_0_20px_rgba(200,168,75,0.4)] group-hover:drop-shadow-[0_0_30px_rgba(200,168,75,0.6)] transition-all">
              <circle cx="40" cy="40" r="38" fill="#0D4A3A" stroke="#C8A84B" strokeWidth="2"/>
              <path d="M20 52 L26 32 L34 44 L40 26 L46 44 L54 32 L60 52 Z"
                    fill="none" stroke="#C8A84B" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="20" cy="52" r="2.5" fill="#C8A84B"/>
              <circle cx="40" cy="26" r="2.5" fill="#C8A84B"/>
              <circle cx="60" cy="52" r="2.5" fill="#C8A84B"/>
              <line x1="16" y1="58" x2="64" y2="58" stroke="#C8A84B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-p mb-1">Welcome Back</h1>
          <p className="font-body text-text-m text-sm">Sign in to your Gimbiya Mall account</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-card p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={form.email}
              onChange={(e) => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })) }}
              error={errors.email}
              autoComplete="email"
              autoFocus
            />

            <div className="space-y-1.5">
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-m" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-danger' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-m hover:text-brass transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="font-mono text-xs text-text-m hover:text-brass transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
              iconRight={!loading && <ArrowRight className="w-4 h-4" />}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="font-body text-sm text-text-m">
              Don't have an account?{' '}
              <Link to="/register" className="text-brass hover:text-brass-l font-semibold transition-colors">
                Create one free →
              </Link>
            </p>
          </div>
        </div>

        {/* Sandbox hint */}
        <div className="mt-4 p-3 bg-surface-h border border-border/50 rounded-card">
          <p className="font-mono text-[10px] text-text-d text-center tracking-wide">
            NEW HERE? Create an account above — email verification required
          </p>
        </div>
      </motion.div>
    </div>
  )
}
