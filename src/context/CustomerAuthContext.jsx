import { createContext, useContext, useEffect, useState } from 'react'
import {
  customerApi, setCustomerToken, clearCustomerToken,
  saveRefresh, loadRefresh, clearRefresh,
} from '../api/customerClient.js'

const BASE_URL = import.meta.env.VITE_API_URL
const CustomerAuthContext = createContext(null)

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function restore() {
      const stored = loadRefresh()
      if (!stored) { setLoading(false); return }
      try {
        const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: stored }),
        })
        if (res.ok) {
          const data = await res.json()
          setCustomerToken(data.accessToken)
          if (data.refreshToken) saveRefresh(data.refreshToken)
          const me = await customerApi.get('/api/auth/me')
          setCustomer(normalize(me))
        } else {
          clearRefresh()
        }
      } catch { /* network error — keep stored token for next load */ }
      setLoading(false)
    }
    restore()
  }, [])

  function normalize(u) {
    return {
      id:         u.id,
      phone:      u.phone_number ?? u.phone,
      fullName:   u.full_name   ?? u.fullName ?? 'Customer',
      balance:    u.balance     ?? 0,
      trustScore: u.trust_score ?? u.trustScore ?? 0,
      mfaEnabled: u.mfa_enabled ?? u.mfaEnabled ?? false,
    }
  }

  async function requestOtp(phone) {
    return customerApi.post('/api/auth/customer/request-otp', { phone })
  }

  async function verifyOtp(phone, code) {
    const result = await customerApi.post('/api/auth/customer/verify-otp', { phone, code })
    setCustomerToken(result.accessToken)
    saveRefresh(result.refreshToken)
    return result
  }

  function activateUser(raw) {
    setCustomer(normalize(raw))
  }

  async function setPin(pin) {
    await customerApi.post('/api/auth/customer/set-pin', { pin })
    setCustomer(prev => prev ? { ...prev, mfaEnabled: true } : prev)
  }

  async function refreshCustomer() {
    try {
      const me = await customerApi.get('/api/auth/me')
      setCustomer(normalize(me))
    } catch { /* best effort */ }
  }

  async function signOut() {
    try {
      const stored = loadRefresh()
      if (stored) await customerApi.post('/api/auth/signout', { refreshToken: stored })
    } catch { /* best effort */ }
    clearCustomerToken()
    clearRefresh()
    setCustomer(null)
  }

  return (
    <CustomerAuthContext.Provider value={{
      customer, loading,
      requestOtp, verifyOtp, activateUser, setPin,
      refreshCustomer, signOut,
    }}>
      {children}
    </CustomerAuthContext.Provider>
  )
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth must be used inside CustomerAuthProvider')
  return ctx
}
