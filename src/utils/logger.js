// ---------------------------------------------------------------------------
// Structured logger — emits JSON-shaped entries so log aggregators can index
// fields without regex parsing. Never log sensitive data (passwords, tokens).
// ---------------------------------------------------------------------------

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }

const minLevel = LEVELS[import.meta.env?.VITE_LOG_LEVEL ?? 'info'] ?? LEVELS.info

function entry(level, message, meta = {}) {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    env: import.meta.env?.MODE ?? 'unknown',
    ...sanitize(meta),
  }
}

/** Strip known-sensitive keys so they never reach the output. */
function sanitize(obj) {
  const REDACTED = new Set(['password', 'token', 'secret', 'authorization', 'pin', 'otp'])
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      REDACTED.has(k.toLowerCase()) ? [k, '[REDACTED]'] : [k, v]
    )
  )
}

function emit(level, message, meta) {
  if (LEVELS[level] < minLevel) return
  const record = entry(level, message, meta)
  /* eslint-disable no-console */
  if (level === 'error') console.error(record)
  else if (level === 'warn') console.warn(record)
  else console.log(record)
  /* eslint-enable no-console */
  return record
}

const logger = {
  debug: (message, meta = {}) => emit('debug', message, meta),
  info:  (message, meta = {}) => emit('info',  message, meta),
  warn:  (message, meta = {}) => emit('warn',  message, meta),
  error: (message, meta = {}) => emit('error', message, meta),

  /** Log an AppError with its structured fields. */
  logError(error, context = {}) {
    return this.error(error.message, {
      errorName: error.name,
      errorCode: error.code ?? 'UNKNOWN',
      errorContext: error.context ?? {},
      ...context,
    })
  },

  /** Log an API call outcome. */
  logApiCall({ method, endpoint, statusCode, durationMs, requestId = null }) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    return this[level]('API call', { method, endpoint, statusCode, durationMs, requestId })
  },
}

export default logger
export { sanitize, entry }
