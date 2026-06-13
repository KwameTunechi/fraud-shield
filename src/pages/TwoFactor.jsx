import { useState, useRef } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Shield, Smartphone, ArrowRight } from 'lucide-react'
import QRCode from 'react-qr-code'
import { useAuth } from '../context/AuthContext.jsx'

export default function TwoFactor() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)
  const inputs = useRef([])
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyMfa } = useAuth()

  const { pendingToken, setupRequired, otpauthUrl } = location.state ?? {}

  // Guard: if someone navigates here directly without going through sign-in
  if (!pendingToken) return <Navigate to="/signin" replace />

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const updated = [...code]
    updated[index] = value
    setCode(updated)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const codeStr = code.join('')
    if (codeStr.length < 6) {
      setServerError('Please enter all 6 digits.')
      return
    }
    setServerError(null)
    setLoading(true)
    try {
      await verifyMfa(pendingToken, codeStr)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err.message || 'Invalid code. Please try again.')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8edfb 0%, #dde4f8 40%, #e0e8fb 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
        <Shield size={28} color="#7c3aed" />
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#7c3aed' }}>Fraud Shield</span>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        border: '1px solid rgba(226,232,240,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(79,110,247,0.35)',
        }}>
          <Smartphone size={32} color="#fff" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Two-Factor Authentication
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
          {setupRequired
            ? 'First time setup — add FraudShield to your authenticator app, then enter the code below.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>

        {/* First-time MFA setup: show QR code to scan */}
        {setupRequired && otpauthUrl && (
          <div style={{
            width: '100%',
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>
              Scan with Google Authenticator
            </p>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <QRCode value={otpauthUrl} size={180} />
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
              Open the app → tap <strong>+</strong> → <strong>Scan a QR code</strong>
            </p>
          </div>
        )}

        {serverError && (
          <div style={{
            width: '100%',
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#dc2626',
            marginBottom: '20px',
            textAlign: 'left',
          }}>
            {serverError}
          </div>
        )}

        {/* OTP Inputs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }} onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              style={{
                width: '52px',
                height: '60px',
                textAlign: 'center',
                fontSize: '22px',
                fontWeight: 700,
                border: `2px solid ${digit ? '#4f6ef7' : '#e2e8f0'}`,
                borderRadius: '12px',
                background: digit ? '#f0f4ff' : '#f8fafc',
                outline: 'none',
                color: '#0f172a',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.2s',
              }}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            width: '100%',
            padding: '15px',
            background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: loading ? 'none' : '0 8px 20px rgba(79,110,247,0.35)',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '16px',
          }}
        >
          {loading ? 'Verifying…' : <> Verify &amp; Continue <ArrowRight size={16} /> </>}
        </button>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
        <Shield size={14} color="#22c55e" />
        Protected by MFA Security
      </div>
    </div>
  )
}
