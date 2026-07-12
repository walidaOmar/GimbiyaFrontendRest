// ── CURRENCY ──────────────────────────────────────────────────────────────────

/**
 * Format Kobo integer as Nigerian Naira display string
 * e.g. 1250000 → "₦12,500.00"
 */
export function formatNaira(kobo) {
  if (kobo === null || kobo === undefined) return '₦0.00'
  return new Intl.NumberFormat('en-NG', {
    style:                 'currency',
    currency:              'NGN',
    minimumFractionDigits: 2,
  }).format(kobo / 100)
}

/**
 * Format Kobo as compact Naira for dashboards
 * e.g. 142850000 → "₦1.4M"
 */
export function formatNairaCompact(kobo) {
  const naira = kobo / 100
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`
  if (naira >= 1_000)     return `₦${(naira / 1_000).toFixed(1)}K`
  return `₦${naira.toFixed(0)}`
}

/** Convert Naira display input to Kobo integer */
export function nairaToKobo(naira) {
  return Math.round(Number(naira) * 100)
}

/** Convert Kobo to Naira float */
export function koboToNaira(kobo) {
  return kobo / 100
}

// ── DATES ──────────────────────────────────────────────────────────────────────

const DATE_FMT = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric', month: 'short', year: 'numeric',
})

const DATETIME_FMT = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return DATE_FMT.format(new Date(dateStr))
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return DATETIME_FMT.format(new Date(dateStr))
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)   return 'just now'
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days  < 7)   return `${days}d ago`
  return formatDate(dateStr)
}

// ── MISC ──────────────────────────────────────────────────────────────────────

/** Truncate a MongoDB ObjectId for display */
export function shortId(id) {
  return id ? `...${String(id).slice(-6)}` : '—'
}

/** Copy text to clipboard with toast feedback */
export async function copyToClipboard(text, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
