import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Smartphone, ArrowRight } from 'lucide-react'

export default function TwoFactor() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [resent, setResent] = useState(false)
  const inputs = useRef([])
  const navigate = useNavigate()

  const handleResend = () => {
    setResent(true)
    setTimeout(() => setResent(false), 3000)
  }

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
        maxWidth: '440px',
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
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px', lineHeight: 1.6 }}>
          Enter the 6-digit code from your authenticator app
        </p>

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
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%',
            padding: '15px',
            background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(79,110,247,0.35)',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '16px',
          }}
        >
          Verify & Continue <ArrowRight size={16} />
        </button>

        {resent && (
          <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginBottom: '8px' }}>
            ✓ Code sent to your device!
          </div>
        )}
        <button onClick={handleResend} style={{ background: 'none', border: 'none', fontSize: '14px', color: resent ? '#94a3b8' : '#4f6ef7', fontWeight: 500, cursor: resent ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Didn't receive a code? Resend
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
