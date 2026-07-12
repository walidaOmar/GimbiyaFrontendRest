import { useState }       from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion }          from 'framer-motion'
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authApi }         from '../../api/index.js'
import { Button, Input, Select } from '../../components/ui/index.jsx'
import toast               from 'react-hot-toast'

const ROLE_OPTIONS = [
  { value: 'buyer',          label: '🛒  Buyer — Shop products across Nigeria' },
  { value: 'business_owner', label: '🏪  Business Owner — Sell on the platform' },
  { value: 'delivery',       label: '🚚  Delivery Rider — Earn from deliveries' },
  { value: 'affiliate',      label: '🔗  Affiliate Partner — Earn commissions' },
]

const STATE_OPTIONS = [
  { value: 'Abuja',  label: 'Abuja — Federal Capital Territory' },
  { value: 'Kano',   label: 'Kano — Commercial North' },
  { value: 'Kaduna', label: 'Kaduna — Industrial Hub' },
]

export default function Register() {
  const navigate       = useNavigate()
  const [step, setStep] = useState(1) // 1=details, 2=verify
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoad]  = useState(false)
  const [verifyCode, setVCode] = useState('')
  const [verifyLoad, setVLoad] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'buyer', assignedState: 'Kano',
  })

  const set = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }))
    setErrors(p => ({ ...p, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name  || form.name.length < 2)  e.name     = 'Name must be at least 2 characters'
    if (!form.email)                           e.email    = 'Email is required'
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoad(true)
    try {
      await authApi.signup(form)
      toast.success('Account created! Check your email for a verification code.')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoad(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!verifyCode || verifyCode.length < 6) {
      toast.error('Enter the 6-digit code from your email')
      return
    }
    setVLoad(true)
    try {
      await authApi.verifyEmail(verifyCode)
      toast.success('Email verified! Welcome to Gimbiya Mall.')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code')
    } finally {
      setVLoad(false)
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
        className="w-full max-w-md"
      >
        {/* Logo */}
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
          <h1 className="font-display text-3xl font-bold text-text-p mb-1">
            {step === 1 ? 'Join Gimbiya Mall' : 'Verify Your Email'}
          </h1>
          <p className="font-body text-text-m text-sm">
            {step === 1
              ? 'Create your free account in seconds'
              : `We sent a 6-digit code to ${form.email}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                step >= s ? 'bg-brass text-midnight' : 'bg-surface border border-border text-text-m'
              }`}>{s}</div>
              {s < 2 && <div className={`w-8 h-px ${step > s ? 'bg-brass' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border rounded-card p-6 shadow-card">

          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <Input label="Full Name" placeholder="Fatima Aliyu" icon={User}
                value={form.name} onChange={set('name')} error={errors.name} autoFocus />

              <Input label="Email Address" type="email" placeholder="you@example.com" icon={Mail}
                value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />

              <Input label="Phone Number" type="tel" placeholder="+234 803 000 0000" icon={Phone}
                value={form.phone} onChange={set('phone')} error={errors.phone} />

              <div className="space-y-1.5">
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-m" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    className={`input pl-10 pr-10 ${errors.password ? 'border-danger' : ''}`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-m hover:text-brass transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
              </div>

              <Select label="I am a..." value={form.role}
                onChange={set('role')} options={ROLE_OPTIONS} />

              <Select label="My Region" value={form.assignedState}
                onChange={set('assignedState')} options={STATE_OPTIONS} />

              <Button type="submit" variant="primary" loading={loading} className="w-full"
                iconRight={!loading && <ArrowRight className="w-4 h-4" />}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <label className="input-label">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVCode(e.target.value.replace(/\D/g, ''))}
                  className="input text-center text-2xl tracking-[0.4em] font-mono"
                  autoFocus
                />
                <p className="text-xs text-text-m text-center">Check your inbox and spam folder</p>
              </div>

              <Button type="submit" variant="primary" loading={verifyLoad} className="w-full"
                iconRight={!verifyLoad && <ArrowRight className="w-4 h-4" />}>
                {verifyLoad ? 'Verifying...' : 'Verify & Continue'}
              </Button>

              <button type="button" onClick={() => setStep(1)}
                className="w-full font-mono text-xs text-text-m hover:text-brass transition-colors text-center mt-2">
                ← Back to registration
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-border text-center">
            <p className="font-body text-sm text-text-m">
              Already have an account?{' '}
              <Link to="/login" className="text-brass hover:text-brass-l font-semibold transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
