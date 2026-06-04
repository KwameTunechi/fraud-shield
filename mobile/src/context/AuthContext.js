// mobile/src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, tokens } from '../api/client'
import { API_URL } from '../config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [pendingUser, setPendingUser] = useState(null) // set after OTP/PIN, cleared after biometric
  const [loading,     setLoading]     = useState(true)

  // On app start: try to restore the session from the saved refresh token.
  // If it works, the user goes straight to the main app — no biometric needed.
  useEffect(() => {
    async function restore() {
      const refresh = await tokens.loadRefresh()
      if (!refresh) { setLoading(false); return }
      try {
        const refreshed = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        })
        if (refreshed.ok) {
          const { accessToken } = await refreshed.json()
          tokens.setAccess(accessToken)
          const me = await api.get('/api/auth/me')
          setUser({
            id:         me.id,
            phone:      me.phone_number,
            fullName:   me.full_name,
            balance:    me.balance,
            trustScore: me.trust_score,
          })
        } else {
          await tokens.clearRefresh()
        }
      } catch {
        await tokens.clearRefresh()
      }
      setLoading(false)
    }
    restore()
  }, [])

  // Step 1: request OTP via SMS
  async function requestOtp(phone) {
    return api.post('/api/auth/customer/request-otp', { phone })
  }

  // Step 2a: verify OTP — stores tokens + pendingUser, does NOT set user yet.
  // The caller should navigate to SetPin (if pinSetup === true) then Biometric.
  async function verifyOtp(phone, code) {
    const result = await api.post('/api/auth/customer/verify-otp', { phone, code })
    tokens.setAccess(result.accessToken)
    await tokens.saveRefresh(result.refreshToken)
    setPendingUser(result.user)
    return result // caller checks result.pinSetup
  }

  // Step 2b: PIN-only sign-in for returning users who skip OTP
  async function loginWithPin(phone, pin) {
    const result = await api.post('/api/auth/customer/verify-pin', { phone, pin })
    tokens.setAccess(result.accessToken)
    await tokens.saveRefresh(result.refreshToken)
    setPendingUser(result.user)
    return result
  }

  // Step 3: set PIN for newly registered users (after OTP verification)
  async function setPin(pin) {
    await api.post('/api/auth/customer/set-pin', { pin })
    // Update pendingUser so pinSetup flag is cleared
    if (pendingUser) setPendingUser({ ...pendingUser, pinSetup: false })
  }

  // Final step: called by BiometricScreen after successful biometric check.
  // Promotes pendingUser → user, which triggers AppNavigator to show MainNavigator.
  function completeBiometric() {
    setUser(pendingUser)
    setPendingUser(null)
  }

  async function signOut() {
    try {
      const refresh = await tokens.loadRefresh()
      if (refresh) await api.post('/api/auth/signout', { refreshToken: refresh })
    } catch { /* best effort */ }
    tokens.clearAccess()
    await tokens.clearRefresh()
    setUser(null)
    setPendingUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, pendingUser, loading,
      requestOtp, verifyOtp, loginWithPin,
      setPin, completeBiometric, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be called inside AuthProvider')
  return ctx
}
