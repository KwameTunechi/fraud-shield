// ---------------------------------------------------------------------------
// Pure risk-scoring helpers extracted from LiveTransactions and Dashboard.
// All functions are side-effect-free and fully unit-testable.
// ---------------------------------------------------------------------------

/** Returns status badge colours for a transaction status string. */
export function statusStyle(status) {
  switch (status) {
    case 'Safe':    return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
    case 'Review':  return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
    case 'Blocked': return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
    default:        return { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' }
  }
}

/** Returns a hex colour for a numeric risk score (0–100). */
export function riskColor(score) {
  if (score < 30) return '#16a34a'   // green  — low
  if (score < 60) return '#d97706'   // amber  — medium
  return '#dc2626'                   // red    — high
}

/** Returns a hex colour for a transaction category string. */
export function catColor(category) {
  return category === 'AGENT' ? '#8b5cf6' : '#3b82f6'
}

/** Returns a human-readable risk band label. */
export function riskLabel(score) {
  if (score < 30) return 'Low'
  if (score < 60) return 'Medium'
  return 'High'
}

/** Classifies a numeric risk score into a severity tier object. */
export function classifyRisk(score) {
  return { score, label: riskLabel(score), color: riskColor(score) }
}

/** Filters a transactions array by status. Empty string = all. */
export function filterByStatus(transactions, status) {
  if (!status) return transactions
  return transactions.filter((t) => t.status === status)
}

/** Filters a transactions array to those whose risk score meets a threshold. */
export function filterByMinRisk(transactions, minRisk) {
  return transactions.filter((t) => t.risk >= minRisk)
}
