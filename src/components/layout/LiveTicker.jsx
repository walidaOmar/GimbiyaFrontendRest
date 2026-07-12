import { GlowDot } from '../ui/index.jsx'

const TICKER_ITEMS = [
  { label: '● ABUJA NODE',   value: 'ONLINE',     color: '#00D98B' },
  { label: 'GMV TODAY',      value: '₦2.84M',     color: '#C8A84B' },
  { label: '● KANO NODE',    value: 'OPTIMIZED',  color: '#00D98B' },
  { label: 'ORDERS',         value: '1,204',      color: '#C8A84B' },
  { label: '● KADUNA NODE',  value: 'SECURE',     color: '#00D98B' },
  { label: 'MERCHANTS',      value: '847',        color: '#C8A84B' },
  { label: 'RIDERS ACTIVE',  value: '63',         color: '#F59E0B' },
  { label: 'ESCROW LOCKED',  value: '₦8.4M',      color: '#C8A84B' },
  { label: 'KYC PENDING',    value: '12',         color: '#F59E0B' },
  { label: 'DELIVERIES',     value: '98.7% OTD',  color: '#00D98B' },
]

export function LiveTicker({ dark = false }) {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS] // duplicate for seamless loop

  return (
    <div
      className={`overflow-hidden border-y py-2 ${
        dark
          ? 'border-border bg-surface'
          : 'border-white/10 bg-black/20'
      }`}
    >
      <div
        className="flex gap-12 whitespace-nowrap animate-ticker"
        style={{ width: 'max-content' }}
      >
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <span
              className="font-mono text-[11px] tracking-widest"
              style={{ color: item.color.includes('#00D') || item.color.includes('#F5') ? item.color : '#9B9BB8' }}
            >
              {item.label}
            </span>
            <span className="font-mono text-[11px] font-bold" style={{ color: item.color }}>
              {item.value}
            </span>
            <span className="text-white/20 mx-2">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
