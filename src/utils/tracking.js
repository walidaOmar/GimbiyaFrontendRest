export function formatKobo(value = 0) {
  return `₦${(Number(value || 0) / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}

export function percent(value = 0) {
  return `${Math.round(Number(value || 0))}%`
}

export function listFrom(data, keys = []) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}
