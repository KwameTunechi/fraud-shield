import { createContext, useContext, useEffect, useState } from 'react'
import { api, setAccessToken, clearAccessToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount: try to restore session using the httpOnly refresh cookie.
  // If it works the user stays signed in across page refreshes.
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (response.ok) {
          const { accessToken } = await response.json()
          setAccessToken(accessToken)
          const me = await api.get('/api/auth/me')
          // Normalize snake_case from GET /me to match camelCase from verify-mfa
          setAdmin({ id: me.id, email: me.email, fullName: me.full_name ?? me.fullName, role: me.role })
        }
      } catch {
        // Not signed in — that's fine, just fall through
      }
      setLoading(false)
    }
    checkSession()
  }, [])

  // Returns the raw backend response ({ status, pendingToken, otpauthUrl? })
  // so SignIn.jsx can decide which screen to show next.
  async function signIn(email, password) {
    return api.post('/api/auth/admin/signin', { email, password })
  }

  // Completes 2FA. Sets the access token and admin state on success.
  async function verifyMfa(pendingToken, code) {
    const result = await api.post('/api/auth/admin/verify-mfa', { pendingToken, code })
    setAccessToken(result.accessToken)
    setAdmin(result.admin)
    return result
  }

  async function signOut() {
    try { await api.post('/api/auth/signout') } catch { /* best effort */ }
    clearAccessToken()
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
