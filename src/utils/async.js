import { NetworkError } from '../errors/index.js'

/**
 * Wraps a promise with a hard timeout.
 * Rejects with NetworkError if the promise does not settle within `ms`.
 */
export async function withTimeout(promise, ms, label = 'operation') {
  let timerId
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(
      () => reject(new NetworkError(`${label} timed out after ${ms}ms`, { retryable: true })),
      ms
    )
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timerId)
  }
}

/**
 * Retries an async factory function up to `maxAttempts` times using
 * exponential back-off with optional jitter.
 *
 * @param {() => Promise<T>} fn - Factory that returns the promise to retry.
 * @param {{ maxAttempts?: number, baseDelayMs?: number, shouldRetry?: (e: Error) => boolean }} options
 */
export async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 200, shouldRetry = () => true } = {}) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === maxAttempts || !shouldRetry(err)) throw err
      const delay = baseDelayMs * 2 ** (attempt - 1)
      await sleep(delay)
    }
  }
  throw lastError
}

/**
 * Simple circuit breaker. Opens after `failureThreshold` consecutive
 * failures and resets after `resetAfterMs`.
 */
export function createCircuitBreaker({ failureThreshold = 3, resetAfterMs = 10_000 } = {}) {
  let failures = 0
  let openedAt = null

  return {
    get state() {
      if (openedAt === null) return 'closed'
      if (Date.now() - openedAt >= resetAfterMs) { this.reset(); return 'closed' }
      return 'open'
    },

    async call(fn) {
      if (this.state === 'open') {
        throw new NetworkError('Circuit breaker is open — service temporarily unavailable', { retryable: false })
      }
      try {
        const result = await fn()
        this.reset()
        return result
      } catch (err) {
        failures++
        if (failures >= failureThreshold) openedAt = Date.now()
        throw err
      }
    },

    reset() { failures = 0; openedAt = null },
    get failures() { return failures },
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
