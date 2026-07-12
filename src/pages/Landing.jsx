import { useState } from 'react'
import { Link }      from 'react-router-dom'
import { motion }    from 'framer-motion'
import {
  ArrowRight, ShieldCheck, Zap, Globe, ChevronDown,
  Store, Truck, TrendingUp,
} from 'lucide-react'
import { LiveTicker } from '../components/layout/LiveTicker.jsx'
import { useMallStore } from '../store/mallStore.js'

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  show:   (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.5 } }),
}

const STATS = [
  { value: '3',      label: 'Nigerian States' },
  { value: '7',      label: 'Operational Roles' },
  { value: '98.5%',  label: 'Fulfillment Rate' },
  { value: '₦500M',  label: 'Year 1 GMV Target' },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Escrow-Protected Payments',
    desc:  'Funds are locked until OTP-verified delivery. Buyers and merchants are both protected on every transaction.',
    color: '#00D98B',
  },
  {
    icon: Zap,
    title: 'Real-Time Commerce',
    desc:  'Live inventory updates, instant order tracking, and GPS-based delivery confirmation across all regions.',
    color: '#C8A84B',
  },
  {
    icon: Globe,
    title: 'Multi-State Operations',
    desc:  'Unified platform spanning Abuja, Kano, and Kaduna with strict regional data isolation and governance.',
    color: '#8B5CF6',
  },
]

const ROLES = [
  { icon: Store, label: 'Merchants',  desc: 'Manage listings, pricing, and settlements', color: '#3B82F6' },
  { icon: Truck, label: 'Riders',     desc: 'Claim jobs, deliver, earn tips',           color: '#F59E0B' },
  { icon: TrendingUp, label: 'Affiliates', desc: 'Create campaigns and earn commission', color: '#EC4899' },
]

export default function Landing() {
  const { selectedState, setSelectedState } = useMallStore()
  const [floor, setFloor] = useState('LEVEL_1')

  return (
    <div className="min-h-screen bg-midnight">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #155C49 0%, #0D4A3A 35%, #050510 100%)' }}
      >
        {/* Ambient grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(200,168,75,0.15) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(200,168,75,0.15) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radial glow behind logo */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, #C8A84B 0%, transparent 70%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-28 text-center">

          {/* Live status pill */}
          <motion.div
            custom={0} variants={FADE_UP} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 bg-black/30 border border-white/10 rounded-full px-4 py-1.5 mb-10"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-xs text-white/70 tracking-wider">
              PLATFORM LIVE · ABUJA · KANO · KADUNA
            </span>
          </motion.div>

          {/* Logo */}
          <motion.div
            custom={1} variants={FADE_UP} initial="hidden" animate="show"
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt="Gimbiya Mall"
                className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-[0_0_40px_rgba(200,168,75,0.4)]"
                onError={(e) => {
                  // Fallback SVG crown if logo.png not present
                  e.currentTarget.style.display = 'none'
                }}
              />
              {/* SVG fallback logo mark */}
              <svg
                viewBox="0 0 200 200"
                className="w-48 h-48 md:w-64 md:h-64 drop-shadow-[0_0_40px_rgba(200,168,75,0.4)]"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <circle cx="100" cy="100" r="96" fill="#0D4A3A" stroke="#C8A84B" strokeWidth="3"/>
                {/* Crown */}
                <path
                  d="M50 130 L65 80 L85 110 L100 65 L115 110 L135 80 L150 130 Z"
                  fill="none" stroke="#C8A84B" strokeWidth="3" strokeLinejoin="round"
                />
                <circle cx="50"  cy="130" r="5" fill="#C8A84B"/>
                <circle cx="100" cy="65"  r="5" fill="#C8A84B"/>
                <circle cx="150" cy="130" r="5" fill="#C8A84B"/>
                {/* Base line */}
                <line x1="45" y1="140" x2="155" y2="140" stroke="#C8A84B" strokeWidth="3" strokeLinecap="round"/>
                {/* Text */}
                <text x="100" y="168" textAnchor="middle" fontFamily="serif" fontSize="16" fontWeight="bold" fill="#C8A84B" letterSpacing="3">
                  GIMBIYA
                </text>
              </svg>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={2} variants={FADE_UP} initial="hidden" animate="show"
            className="font-display text-5xl md:text-7xl font-black text-white mb-4 leading-none"
          >
            Nigeria's{' '}
            <span className="gold-text animate-glow">Premium</span>
            <br />
            Digital Marketplace
          </motion.h1>

          <motion.p
            custom={3} variants={FADE_UP} initial="hidden" animate="show"
            className="font-body text-lg text-white/60 max-w-2xl mx-auto mb-10 text-balance"
          >
            A governed multi-tenant ecosystem for commerce and logistics — built for Abuja, Kano, and Kaduna.
            Escrow-protected. Real-time. Transparent.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={4} variants={FADE_UP} initial="hidden" animate="show"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="btn btn-primary text-base px-8 py-4 text-midnight font-bold shadow-brass-lg hover:shadow-brass group"
            >
              Start Shopping
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="btn btn-secondary text-base px-8 py-4"
            >
              Sign In to Dashboard
            </Link>
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            custom={6} variants={FADE_UP} initial="hidden" animate="show"
            className="mt-16 flex flex-col items-center gap-1"
          >
            <span className="font-mono text-[10px] text-white/30 tracking-widest">EXPLORE</span>
            <ChevronDown className="w-4 h-4 text-white/30 animate-bounce" />
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }, i) => (
              <motion.div
                key={label}
                custom={i} variants={FADE_UP} initial="hidden" animate="show"
                className="text-center"
              >
                <p className="font-display text-3xl font-black text-brass mb-1">{value}</p>
                <p className="font-mono text-xs text-white/50 uppercase tracking-wider">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE TICKER ────────────────────────────────────────────────────── */}
      <LiveTicker />

      {/* ── FLOOR SWITCHER ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="section-label mb-2">Browse the Mall</p>
          <h2 className="font-display text-4xl font-bold text-text-p">
            Two Sectors. One Ecosystem.
          </h2>
        </div>

        {/* Floor tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-surface border border-border rounded-card p-1 gap-1">
            {[
              { value: 'LEVEL_1', label: 'Level 1 — Commerce', desc: 'Retail & Wholesale' },
              { value: 'LEVEL_2', label: 'Level 2 — Industry', desc: 'Manufacturing & Logistics' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setFloor(value)}
                className={`px-6 py-3 rounded-btn text-sm font-medium transition-all duration-200 ${
                  floor === value
                    ? 'bg-brass text-midnight font-bold shadow-glow-sm'
                    : 'text-text-m hover:text-text-p hover:bg-surface-h'
                }`}
              >
                <span className="block font-body">{label}</span>
                <span className={`block font-mono text-[10px] mt-0.5 ${floor === value ? 'text-midnight/70' : 'text-text-d'}`}>
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* State selector */}
        <div className="flex justify-center gap-2 mb-10">
          {['Abuja', 'Kano', 'Kaduna'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedState(s)}
              className={`px-5 py-2 rounded-full border font-mono text-sm transition-all duration-200 ${
                selectedState === s
                  ? 'border-brass bg-brass/10 text-brass shadow-glow-sm'
                  : 'border-border text-text-m hover:border-brass/40 hover:text-text-p'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* CTA to shop */}
        <div className="text-center">
          <Link
            to={`/shop?state=${selectedState}&floor=${floor}`}
            className="btn btn-primary px-8 py-3 text-base group"
          >
            Browse {selectedState} {floor === 'LEVEL_1' ? 'Commerce' : 'Industry'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="section-label mb-2">Why Gimbiya Mall</p>
            <h2 className="font-display text-4xl font-bold text-text-p">
              Built for Trust. Designed for Scale.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card group hover:border-brass/40 transition-all duration-300 cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-card flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="font-display text-lg font-bold text-text-p mb-2">{title}</h3>
                <p className="font-body text-sm text-text-m leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOIN SECTION ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="section-label mb-2">Join the Ecosystem</p>
          <h2 className="font-display text-4xl font-bold text-text-p">
            Which Role Fits You?
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {ROLES.map(({ icon: Icon, label, desc, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-hover text-center group"
            >
              <div
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
              >
                <Icon className="w-7 h-7 transition-transform group-hover:scale-110 duration-200"
                     style={{ color }} />
              </div>
              <h3 className="font-display text-lg font-bold text-text-p mb-1">{label}</h3>
              <p className="font-body text-xs text-text-m mb-4">{desc}</p>
              <Link
                to="/register"
                className="font-mono text-xs tracking-wider uppercase"
                style={{ color }}
              >
                Join as {label} →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section
        className="py-24 px-4 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, #0D4A3A 0%, #050510 70%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="font-display text-5xl font-black text-white mb-4">
            Ready to{' '}
            <span className="gold-text">Trade?</span>
          </h2>
          <p className="font-body text-white/50 mb-10 text-lg">
            Create your free account and access Nigeria's most secure digital marketplace today.
          </p>
          <Link
            to="/register"
            className="btn btn-primary px-10 py-4 text-lg font-bold shadow-brass-lg group"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-brass">Gimbiya Mall</span>
            <span className="font-mono text-xs text-text-d">Strategic Ecosystem & Governance Architecture</span>
          </div>
          <p className="font-mono text-xs text-text-d">
            © 2026 Gimbiya Mall · Abuja · Kano · Kaduna
          </p>
        </div>
      </footer>
    </div>
  )
}
