const DAY = 86400000
const days = (date) => (date ? (Date.now() - new Date(date).getTime()) / DAY : Infinity)

export const LIFECYCLE = {
  NEW: { label: 'New', color: 'blue' },
  ACTIVE: { label: 'Active', color: 'green' },
  ENGAGED: { label: 'Engaged', color: 'purple' },
  PURCHASING: { label: 'Purchasing', color: 'amber' },
  RETAINED: { label: 'Retained', color: 'green' },
  DORMANT: { label: 'Dormant', color: 'muted' },
  REACTIVATION: { label: 'Reactivation', color: 'amber' },
}

export function deriveLifecycle(relationship) {
  const history = relationship?.interactionHistory || []
  const purchases = history.filter((entry) => entry.type === 'PURCHASE')
  const recent = history.filter((entry) => days(entry.occurredAt) <= 30)
  const idle = days(relationship?.lastActivityAt)

  if (idle > 30) return 'DORMANT'
  const gapBefore = history.length > 1
    ? days(history[history.length - 2]?.occurredAt) - days(history[history.length - 1]?.occurredAt)
    : 0
  if (gapBefore > 30 && days(history[history.length - 1]?.occurredAt) <= 14) return 'REACTIVATION'
  if (purchases.length >= 2 && days(relationship?.lastPurchaseAt) <= 60) return 'RETAINED'
  if (days(relationship?.lastPurchaseAt) <= 30) return 'PURCHASING'
  if (recent.length >= 3) return 'ENGAGED'
  if (days(relationship?.startedAt) <= 7) return 'NEW'
  return 'ACTIVE'
}

export function healthScore(relationship) {
  const history = relationship?.interactionHistory || []
  const purchases = history.filter((entry) => entry.type === 'PURCHASE').length
  const recency = Math.max(0, 40 - days(relationship?.lastActivityAt))
  const depth = Math.min(30, history.length * 5)
  const repeat = Math.min(30, purchases * 15)
  return Math.round(Math.min(100, recency + depth + repeat))
}
