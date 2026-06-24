const BASE_URL = import.meta.env.VITE_API_URL
const REFRESH_KEY = 'fs_customer_refresh'

let customerAccessToken = null

export function setCustomerToken(t) { customerAccessToken = t }
export function clearCustomerToken() { customerAccessToken = null }
export function getCustomerToken() { return customerAccessToken }

export function saveRefresh(token) { localStorage.setItem(REFRESH_KEY, token) }
export function loadRefresh() { return localStorage.getItem(REFRESH_KEY) }
export function clearRefresh() { localStorage.removeItem(REFRESH_KEY) }

async function tryRefresh() {
  const stored = loadRefresh()
  if (!stored) return false
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setCustomerToken(data.accessToken)
    if (data.refreshToken) saveRefresh(data.refreshToken)
    return true
  } catch { return false }
}

async function raw(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (customerAccessToken) headers.Authorization = `Bearer ${customerAccessToken}`

  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers })
  const text = await res.text()
  const body = text ? JSON.parse(text) : {}

  if (res.ok) return body
  const err = new Error(body.error || `HTTP ${res.status}`)
  err.status = res.status
  throw err
}

export async function capi(path, opts = {}) {
  try {
    return await raw(path, opts)
  } catch (err) {
    if (err.status === 401) {
      const ok = await tryRefresh()
      if (ok) return await raw(path, opts)
      clearCustomerToken()
      clearRefresh()
    }
    throw err
  }
}

export const customerApi = {
  get:    (path)       => capi(path, { method: 'GET' }),
  post:   (path, body) => capi(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    (path, body) => capi(path, { method: 'PUT',   body: JSON.stringify(body) }),
}
