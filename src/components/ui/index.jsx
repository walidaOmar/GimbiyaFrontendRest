import { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

// ── BUTTON ────────────────────────────────────────────────────────────────────
export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, icon, iconRight, className = '', ...props
}) {
  const base    = 'btn'
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
  }
  const sizes = {
    sm: 'btn-sm',
    md: '',
    icon: 'btn-icon',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'brass', dot = false }) {
  const colors = {
    brass:   'badge-brass',
    green:   'badge-green',
    amber:   'badge-amber',
    red:     'badge-red',
    purple:  'badge-purple',
    blue:    'badge-blue',
    muted:   'badge-muted',
  }
  return (
    <span className={colors[color] || 'badge-muted'}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  )
}

// Status → badge color mapping
export const STATUS_COLORS = {
  PENDING:       'amber',
  CONFIRMED:     'blue',
  PROCESSING:    'purple',
  DISPATCHED:    'purple',
  DELIVERED:     'green',
  CANCELLED:     'red',
  REFUNDED:      'amber',
  DISPUTED:      'red',
  APPROVED:      'green',
  REJECTED:      'red',
  LOCKED:        'brass',
  RELEASED:      'green',
}

export function StatusBadge({ status }) {
  return <Badge color={STATUS_COLORS[status] || 'muted'}>{status}</Badge>
}

// ── CARD ──────────────────────────────────────────────────────────────────────
export function Card({ children, glow = false, hover = false, className = '', onClick }) {
  return (
    <div
      className={`${glow ? 'card-glow' : hover ? 'card-hover' : 'card'} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, change, color = 'text-brass', icon: Icon, mini }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className={`stat-value mt-1 ${color}`}>{value}</p>
          {change && <p className="font-mono text-xs text-text-m mt-1">{change}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-btn bg-brass/10">
            <Icon className="w-5 h-5 text-brass" />
          </div>
        )}
      </div>
    </Card>
  )
}

// ── INPUT ─────────────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className = '', ...props }, ref
) {
  return (
    <div className="space-y-1.5">
      {label && <label className="input-label">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-m">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          className={`input ${Icon ? 'pl-10' : ''} ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger font-body">{error}</p>}
      {hint && !error && <p className="text-xs text-text-m font-body">{hint}</p>}
    </div>
  )
})

// ── SELECT ────────────────────────────────────────────────────────────────────
export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="input-label">{label}</label>}
      <select
        className={`input appearance-none ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      >
        {options.map(({ value, label: l }) => (
          <option key={value} value={value} className="bg-surface">
            {l}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-midnight/80 glass"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* Panel */}
          <motion.div
            className={`relative w-full ${sizes[size]} bg-surface border border-border rounded-card shadow-card z-10`}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display text-lg font-bold text-text-p">{title}</h3>
              <button onClick={onClose} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Body */}
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 6, color = 'border-brass' }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full border-2 ${color} border-t-transparent animate-spin`}
    />
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-surface-h border border-border flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-text-m" />
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-text-p mb-2">{title}</h3>
      {description && <p className="text-text-m text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}

// ── GLOW DOT ─────────────────────────────────────────────────────────────────
export function GlowDot({ color = '#00D98B', size = 6 }) {
  return (
    <span
      className="inline-block rounded-full animate-pulse"
      style={{
        width:     size, height: size,
        background: color,
        boxShadow: `0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color}40`,
      }}
    />
  )
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-surface-h rounded-btn animate-pulse ${className}`} />
  )
}
