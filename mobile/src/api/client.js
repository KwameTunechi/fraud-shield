// mobile/src/api/client.js
// Mobile API client. Uses expo-secure-store for refresh tokens instead of
// httpOnly cookies (which don't exist in React Native).

import * as SecureStore from 'expo-secure-store'
import { API_URL } from '../config'

const REFRESH_KEY = 'fraudshield.refreshToken'

// In-memory access token — cleared when app closes
let accessToken = null

export const tokens = {
  setAccess:    (t)  => { accessToken = t },
  getAccess:    ()   => accessToken,
  clearAccess:  ()   => { accessToken = null },
  saveRefresh:  (t)  => SecureStore.setItemAsync(REFRESH_KEY, t),
  loadRefresh:  ()   => SecureStore.getItemAsync(REFRESH_KEY),
  clearRefresh: ()   => SecureStore.deleteItemAsync(REFRESH_KEY),
}

async function rawRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const text = await response.text()
  const body = text ? JSON.parse(text) : {}
  if (response.ok) return body

  const err = new Error(body.error ?? `Request failed (${response.status})`)
  err.status = response.status
  throw err
}

async function tryRefresh() {
  const refresh = await tokens.loadRefresh()
  if (!refresh) return false
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    if (!response.ok) { await tokens.clearRefresh(); return false }
    const { accessToken: newAccess, refreshToken: newRefresh } = await response.json()
    tokens.setAccess(newAccess)
    if (newRefresh) await tokens.saveRefresh(newRefresh)
    return true
  } catch { return false }
}

export async function request(path, options = {}) {
  try {
    return await rawRequest(path, options)
  } catch (err) {
    if (err.status === 401) {
      const refreshed = await tryRefresh()
      if (refreshed) return await rawRequest(path, options)
    }
    throw err
  }
}

export const api = {
  get:  (path)       => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:  (path, body) => request(path, { method: 'PUT',   body: JSON.stringify(body) }),
}
