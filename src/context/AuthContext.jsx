import { createContext, useContext, useEffect, useState } from 'react'
import { api, setAccessToken, clearAccessToken } from '../api/client.js'

const REFRESH_KEY = 'fs_admin_refresh'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const stored = localStorage.getItem(REFRESH_KEY)
      if (!stored) { setLoading(false); return }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: stored }),
        })
        if (response.ok) {
          const data = await response.json()
          setAccessToken(data.accessToken)
          if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken)
          const me = await api.get('/api/auth/me')
          setAdmin({ id: me.id, email: me.email, fullName: me.full_name ?? me.fullName, role: me.role, mfaEnabled: me.mfa_enabled ?? true })
        } else {
          localStorage.removeItem(REFRESH_KEY)
        }
      } catch {
        // Network error — don't clear the token, let them retry on next load
      }
      setLoading(false)
    }
    checkSession()
  }, [])

  async function signIn(email, password) {
    return api.post('/api/auth/admin/signin', { email, password })
  }

  async function verifyMfa(pendingToken, code) {
    const result = await api.post('/api/auth/admin/verify-mfa', { pendingToken, code })
    setAccessToken(result.accessToken)
    if (result.refreshToken) localStorage.setItem(REFRESH_KEY, result.refreshToken)
    setAdmin(result.admin)
    return result
  }

  async function signOut() {
    try {
      const stored = localStorage.getItem(REFRESH_KEY)
      await api.post('/api/auth/signout', stored ? { refreshToken: stored } : {})
    } catch { /* best effort */ }
    clearAccessToken()
    localStorage.removeItem(REFRESH_KEY)
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, signIn, verifyMfa, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be called inside AuthProvider')
  return ctx
}
