// mobile/src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { api, tokens } from '../api/client'
import { API_URL } from '../config'

const REMEMBERED_PHONE_KEY = 'fs_remembered_phone'
const STORED_PIN_KEY        = 'fs_stored_pin'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null)
  const [pendingUser,     setPendingUser]      = useState(null)
  const [rememberedPhone, setRememberedPhone]  = useState(null)
  const [biometricType,   setBiometricType]   = useState(null) // 'fingerprint' | 'face' | null
  const [loading,         setLoading]          = useState(true)

  useEffect(() => {
    async function restore() {
      // Load remembered phone
      const stored = await SecureStore.getItemAsync(REMEMBERED_PHONE_KEY)
      if (stored) setRememberedPhone(stored)

      // Check biometric hardware
      const hasHW     = await LocalAuthentication.hasHardwareAsync()
      const enrolled  = await LocalAuthentication.isEnrolledAsync()
      if (hasHW && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
        const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
        setBiometricType(hasFace ? 'face' : 'fingerprint')
      }

      // Try to restore existing session
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
            mfaEnabled: me.mfa_enabled ?? false,
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

  async function saveRememberedPhone(phone) {
    await SecureStore.setItemAsync(REMEMBERED_PHONE_KEY, phone)
    setRememberedPhone(phone)
  }

  async function clearRememberedPhone() {
    await SecureStore.deleteItemAsync(REMEMBERED_PHONE_KEY)
    await SecureStore.deleteItemAsync(STORED_PIN_KEY)
    setRememberedPhone(null)
  }

  // Step 1: request OTP via SMS
  async function requestOtp(phone) {
    return api.post('/api/auth/customer/request-otp', { phone })
  }

  // Step 2a: verify OTP
  async function verifyOtp(phone, code) {
    const result = await api.post('/api/auth/customer/verify-otp', { phone, code })
    tokens.setAccess(result.accessToken)
    await tokens.saveRefresh(result.refreshToken)
    setPendingUser({ ...result.user, mfaEnabled: result.user.mfaEnabled ?? false })
    await saveRememberedPhone(phone)
    return result
  }

  // Step 2b: PIN login
  async function loginWithPin(phone, pin) {
    const result = await api.post('/api/auth/customer/verify-pin', { phone, pin })
    tokens.setAccess(result.accessToken)
    await tokens.saveRefresh(result.refreshToken)
    setPendingUser({ ...result.user, mfaEnabled: result.user.mfaEnabled ?? false })
    await saveRememberedPhone(phone)
    // Store PIN so biometric can use it for future logins
    await SecureStore.setItemAsync(STORED_PIN_KEY, pin)
    return result
  }

  // Step 3: set PIN for new users
  async function setPin(pin) {
    await api.post('/api/auth/customer/set-pin', { pin })
    if (pendingUser) setPendingUser({ ...pendingUser, pinSetup: false, mfaEnabled: true })
    // Store PIN for future biometric use
    const phone = await SecureStore.getItemAsync(REMEMBERED_PHONE_KEY)
    if (phone) await SecureStore.setItemAsync(STORED_PIN_KEY, pin)
  }

  // Biometric authentication.
  // Two paths:
  //   1. MFA path (pendingUser exists): biometric is the second factor after PIN/OTP.
  //      Passes the OS prompt → promotes pendingUser → user.
  //   2. Returning user path (no pendingUser): biometric gates access to the stored
  //      credentials in SecureStore. Passes prompt → reads phone+PIN → calls API.
  async function loginWithBiometric() {
    const check = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm your identity',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    })
    if (!check.success) {
      throw new Error(check.error === 'user_cancel' ? 'Cancelled' : 'Biometric not recognised')
    }

    if (pendingUser) {
      // MFA path: biometric confirmed, promote to full session
      setUser(pendingUser)
      setPendingUser(null)
      return
    }

    // Returning user path: read credentials gated behind biometric
    const phone = await SecureStore.getItemAsync(REMEMBERED_PHONE_KEY)
    const pin   = await SecureStore.getItemAsync(STORED_PIN_KEY)
    if (!phone || !pin) {
      throw new Error('No stored credentials. Please sign in with your PIN first.')
    }
    const result = await api.post('/api/auth/customer/verify-pin', { phone, pin })
    tokens.setAccess(result.accessToken)
    await tokens.saveRefresh(result.refreshToken)
    setUser({
      id:         result.user?.id           ?? '',
      phone:      result.user?.phone        ?? phone,
      fullName:   result.user?.fullName     ?? '',
      balance:    result.user?.balance      ?? 0,
      trustScore: result.user?.trustScore   ?? 0,
      mfaEnabled: result.user?.mfaEnabled   ?? true,
    })
  }

  function skipBiometric() {
    if (pendingUser) { setUser(pendingUser); setPendingUser(null); }
  }

  // Refresh the current user's balance and trust score from the server.
  // Call this after submitting a transaction so the home screen stays in sync.
  async function refreshUser() {
    try {
      const me = await api.get('/api/auth/me')
      setUser(prev => prev ? {
        ...prev,
        balance:    me.balance    ?? prev.balance,
        trustScore: me.trust_score ?? prev.trustScore,
        mfaEnabled: me.mfa_enabled ?? prev.mfaEnabled,
      } : prev)
    } catch { /* best effort — stale balance is not critical */ }
  }

  // In-app biometric challenge — call this anywhere a sensitive action needs MFA.
  // Returns true if verified (or if device has no biometric enrolled).
  // Throws if user cancels or fails too many times.
  async function challengeBiometric(promptMessage) {
    const hasHW    = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    if (!hasHW || !enrolled) return true  // device can't do biometric; let through

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage ?? 'Verify your identity',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    })
    if (!result.success) {
      throw new Error(result.error === 'user_cancel' ? 'Cancelled' : 'Biometric not recognised. Try again.')
    }
    return true
  }

  function completeBiometric() {
    setUser(pendingUser)
    setPendingUser(null)
  }

  // Promote a raw API user object to a full session without depending on
  // pendingUser state. Use this immediately after verifyOtp / loginWithPin
  // so the stale closure value of pendingUser doesn't cause a no-op.
  function activateUser(raw, phone) {
    setUser({
      id:         raw.id,
      phone:      raw.phone_number ?? raw.phone ?? phone ?? '',
      fullName:   raw.full_name   ?? raw.fullName  ?? 'Customer',
      balance:    raw.balance     ?? 0,
      trustScore: raw.trust_score ?? raw.trustScore ?? 0,
      mfaEnabled: raw.mfa_enabled ?? raw.mfaEnabled ?? false,
    })
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
    // rememberedPhone and stored PIN are kept intentionally —
    // biometric login will use them on next open
  }

  return (
    <AuthContext.Provider value={{
      user, pendingUser, loading,
      rememberedPhone, clearRememberedPhone,
      biometricType,
      requestOtp, verifyOtp, loginWithPin,
      setPin, completeBiometric, activateUser, loginWithBiometric, skipBiometric,
      challengeBiometric,
      refreshUser,
      signOut,
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
