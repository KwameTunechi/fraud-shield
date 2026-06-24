import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

const OTP_LEN = 6
const P = '#1652F0'

export default function CustomerOTP() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const phone     = location.state?.phone ?? ''
  const { verifyOtp, activateUser, requestOtp } = useCustomerAuth()

  const [otp,       setOtp]       = useState(Array(OTP_LEN).fill(''))
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [countdown, setCountdown] = useState(30)
  const inputs = useRef([])

  useEffect(() => {
    if (!phone) { navigate('/app/signin'); return }
    inputs.current[0]?.focus()
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  function handleChange(text, idx) {
    const digit = text.replace(/\D/g, '').slice(-1)
    const next  = [...otp]
    next[idx]   = digit
    setOtp(next)
    setError('')
    if (digit && idx < OTP_LEN - 1) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    if (paste.length === OTP_LEN) {
      setOtp(paste.split(''))
      inputs.current[OTP_LEN - 1]?.focus()
    }
    e.preventDefault()
  }

  async function handleVerify(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LEN) { setError('Please enter all 6 digits.'); return }
    setLoading(true)
    setError('')
    try {
      const result = await verifyOtp(phone, code)
      if (result.pinSetup) {
        navigate('/app/pin/setup', { state: { phone } })
      } else {
        activateUser(result.user)
        navigate('/app/home', { replace: true })
      }
    } catch (err) {
      setError(err.message ?? 'Invalid code. Please try again.')
      setOtp(Array(OTP_LEN).fill(''))
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    try {
      await requestOtp(phone)
      setCountdown(30)
      setOtp(Array(OTP_LEN).fill(''))
      setError('')
    } catch (err) {
      setError(err.message ?? 'Could not resend.')
    }
  }

  const filled = otp.filter(Boolean).length

  return (
    <CustomerLayout>
      <div style={{ paddingTop: '24px' }}>
        <button onClick={() => navigate('/app/signin')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#EBF0FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={28} color={P} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0d1421' }}>Enter verification code</div>
          <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: '#0d1421' }}>{phone}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Dev code: <strong>123456</strong></div>
        </div>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                onPaste={handlePaste}
                style={{
                  width: '48px', height: '56px', textAlign: 'center',
                  fontSize: '22px', fontWeight: 700, border: '1.5px solid',
                  borderColor: digit ? P : '#e8ecef',
                  borderRadius: '12px',
                  background: digit ? '#EBF0FE' : '#f5f7fa',
                  outline: 'none', fontFamily: 'Inter, sans-serif',
                  color: '#0d1421', cursor: 'text',
                }}
              />
            ))}
          </div>

          {error && <div style={{ fontSize: '12px', color: '#de350b', textAlign: 'center' }}>⚠ {error}</div>}

          <button type="submit" disabled={filled < OTP_LEN || loading}
            style={{ ...btn, opacity: (filled < OTP_LEN || loading) ? 0.4 : 1 }}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>

          <button type="button" onClick={handleResend} disabled={countdown > 0}
            style={{ background: 'none', border: 'none', color: countdown > 0 ? '#9ca3af' : P, cursor: countdown > 0 ? 'default' : 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter, sans-serif', padding: '4px' }}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </button>
        </form>
      </div>
    </CustomerLayout>
  )
}

const card = {
  background: '#fff', borderRadius: '20px', padding: '28px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)', display: 'flex',
  flexDirection: 'column', gap: '20px',
}
const btn = {
  padding: '14px', borderRadius: '12px', background: '#1652F0',
  color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none',
  cursor: 'pointer', fontFamily: 'Inter, sans-serif', width: '100%',
}
