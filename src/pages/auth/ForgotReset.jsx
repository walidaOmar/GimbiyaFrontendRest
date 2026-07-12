import { useState }         from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion }            from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import { authApi }           from '../../api/index.js'
import { Button, Input }     from '../../components/ui/index.jsx'
import toast                 from 'react-hot-toast'

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
export function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoad]    = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { toast.error('Email is required'); return }
    setLoad(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      toast.success('Reset link sent — check your inbox')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoad(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0D4A3A 0%, #050510 60%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <svg viewBox="0 0 80 80" className="w-16 h-16 mx-auto drop-shadow-[0_0_20px_rgba(200,168,75,0.4)]">
              <circle cx="40" cy="40" r="38" fill="#0D4A3A" stroke="#C8A84B" strokeWidth="2"/>
              <path d="M20 52 L26 32 L34 44 L40 26 L46 44 L54 32 L60 52 Z"
                    fill="none" stroke="#C8A84B" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="40" cy="26" r="2.5" fill="#C8A84B"/>
              <line x1="16" y1="58" x2="64" y2="58" stroke="#C8A84B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-p mb-1">Forgot Password</h1>
          <p className="font-body text-text-m text-sm">
            Enter your email and we'll send a reset link
          </p>
        </div>

        <div className="bg-surface border border-border rounded-card p-6 shadow-card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30
                              flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-display text-xl font-bold text-text-p mb-2">Email Sent</h3>
              <p className="font-body text-text-m text-sm mb-6">
                Check your inbox at <span className="text-brass">{email}</span> for the password reset link.
                The link expires in 1 hour.
              </p>
              <Link to="/login" className="btn btn-secondary w-full justify-center">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <Button type="submit" variant="primary" loading={loading} className="w-full"
                iconRight={!loading && <ArrowRight className="w-4 h-4" />}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {!sent && (
            <div className="mt-5 pt-4 border-t border-border text-center">
              <Link to="/login" className="font-mono text-xs text-text-m hover:text-brass transition-colors">
                ← Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
export function ResetPassword() {
  const { token }           = useParams()
  const navigate            = useNavigate()
  const [form, setForm]     = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoad]  = useState(false)
  const [errors, setErrors] = useState({})
  const [done, setDone]     = useState(false)

  const validate = () => {
    const e = {}
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoad(true)
    try {
      await authApi.resetPassword(token, form.password)
      setDone(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed — link may have expired')
    } finally {
      setLoad(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0D4A3A 0%, #050510 60%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <svg viewBox="0 0 80 80" className="w-16 h-16 mx-auto drop-shadow-[0_0_20px_rgba(200,168,75,0.4)]">
              <circle cx="40" cy="40" r="38" fill="#0D4A3A" stroke="#C8A84B" strokeWidth="2"/>
              <path d="M20 52 L26 32 L34 44 L40 26 L46 44 L54 32 L60 52 Z"
                    fill="none" stroke="#C8A84B" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="40" cy="26" r="2.5" fill="#C8A84B"/>
              <line x1="16" y1="58" x2="64" y2="58" stroke="#C8A84B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-p mb-1">Reset Password</h1>
          <p className="font-body text-text-m text-sm">Enter your new password below</p>
        </div>

        <div className="bg-surface border border-border rounded-card p-6 shadow-card">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30
                              flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-display text-xl font-bold text-text-p mb-2">Password Reset!</h3>
              <p className="font-body text-text-m text-sm">Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* New password */}
              <div className="space-y-1.5">
                <label className="input-label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-m" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={(e) => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }}
                    className={`input pl-10 pr-10 ${errors.password ? 'border-danger' : ''}`}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-m hover:text-brass transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
              </div>

              {/* Confirm */}
              <div className="space-y-1.5">
                <label className="input-label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-m" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirm}
                    onChange={(e) => { setForm(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: '' })) }}
                    className={`input pl-10 ${errors.confirm ? 'border-danger' : ''}`}
                  />
                </div>
                {errors.confirm && <p className="text-xs text-danger">{errors.confirm}</p>}
              </div>

              <Button type="submit" variant="primary" loading={loading} className="w-full"
                iconRight={!loading && <ArrowRight className="w-4 h-4" />}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
