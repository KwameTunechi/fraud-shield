import { withTimeout, withRetry, createCircuitBreaker } from '../utils/async.js'
import { AuthError, NetworkError, AppError } from '../errors/index.js'

const BASE_URL = import.meta.env.VITE_API_URL

// Access token lives in memory only — never localStorage.
// Memory is invisible to XSS payloads and is cleared automatically on tab close.
let accessToken = null

export function setAccessToken(token) { accessToken = token }
export function getAccessToken() { return accessToken }
export function clearAccessToken() { accessToken = null }

async function rawRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // sends the httpOnly refresh token cookie
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : {}

  if (response.ok) return body

  if (response.status === 429) {
    throw new NetworkError(body.error || 'Too many requests', {
      statusCode: 429, endpoint: path, retryable: false,
    })
  }
  if (response.status === 401) {
    throw new AuthError(body.error || 'Unauthorized')
  }
  if (response.status >= 500) {
    throw new NetworkError(body.error || 'Server error', {
      statusCode: response.status, endpoint: path,
    })
  }
  throw new AppError(body.error || 'Request failed', { code: `HTTP_${response.status}` })
}

async function tryRefresh() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) return false
    const { accessToken: newToken } = await response.json()
    setAccessToken(newToken)
    return true
  } catch {
    return false
  }
}

const breaker = createCircuitBreaker({ failureThreshold: 5, resetAfterMs: 30_000 })

export async function request(path, options = {}) {
  const operation = () => withTimeout(
    withRetry(() => rawRequest(path, options), {
      maxAttempts: 2,
      baseDelayMs: 300,
      shouldRetry: (err) => !(err instanceof AuthError),
    }),
    8000
  )
  try {
    return await breaker.call(operation)
  } catch (err) {
    // On 401, attempt one silent token refresh then retry
    if (err instanceof AuthError) {
      const refreshed = await tryRefresh()
      if (refreshed) return await rawRequest(path, options)
      clearAccessToken()
    }
    throw err
  }
}

export const api = {
  get:    (path)       => request(path, { method: 'GET' }),
  post:   (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
}
