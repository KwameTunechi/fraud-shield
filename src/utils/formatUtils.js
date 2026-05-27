// ---------------------------------------------------------------------------
// Formatting helpers — pure functions, no side effects.
// ---------------------------------------------------------------------------

/** Zero-pads a number to at least 2 digits. */
export function pad(n) {
  return String(n).padStart(2, '0')
}

/** Formats a Date as HH:MM:SS. */
export function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** Formats a Date as a long human-readable date string. */
export function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

/** Formats a GHS amount string. Accepts a numeric value or a pre-formatted string. */
export function formatGhsCurrency(value) {
  if (typeof value === 'string') return value
  return `₵${value.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Truncates a string with an ellipsis if it exceeds maxLength. */
export function truncate(str, maxLength) {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 1)}…`
}

/** Returns initials from a full name (up to 2 chars). */
export function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}
