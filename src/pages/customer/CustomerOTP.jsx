import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

const C = { primary:'#1652F0', primaryLight:'#EBF0FE', danger:'#DE350B', text:'#0D1421', textSub:'#6B7280', textMuted:'#9CA3AF', bg:'#F5F7FA', surface:'#FFFFFF', border:'#E8ECEF' }
const OTP_LEN = 6

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
    const next  = [...otp]; next[idx] = digit; setOtp(next); setError('')
    if (digit && idx < OTP_LEN - 1) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(e, idx) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus()
  }

  function handlePaste(e) {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN)
    if (paste.length === OTP_LEN) { setOtp(paste.split('')); inputs.current[OTP_LEN - 1]?.focus() }
    e.preventDefault()
  }

  async function handleVerify(e) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < OTP_LEN) { setError('Please enter all 6 digits.'); return }
    setLoading(true); setError('')
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
    } finally { setLoading(false) }
  }

  async function handleResend() {
    if (countdown > 0) return
    try { await requestOtp(phone); setCountdown(30); setOtp(Array(OTP_LEN).fill('')); setError('') }
    catch (err) { setError(err.message ?? 'Could not resend.') }
  }

  const filled = otp.filter(Boolean).length

  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
      <button onClick={() => navigate('/app/signin')}
        style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
        ←
      </button>
      <div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>Verify Code</div>
        <div style={{ fontSize: '12px', color: C.textSub }}>OTP sent</div>
      </div>
    </div>
  )

  return (
    <CustomerLayout header={Header}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={card}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: C.text }}>Enter verification code</div>
            <div style={{ fontSize: '13px', color: C.textSub, lineHeight: '1.6' }}>
              We sent a 6-digit code to<br /><strong style={{ color: C.text }}>{phone}</strong>
            </div>
          </div>

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {otp.map((digit, i) => (
                <input key={i} ref={el => inputs.current[i] = el}
                  type="tel" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleChange(e.target.value, i)}
                  onKeyDown={e => handleKeyDown(e, i)} onPaste={handlePaste}
                  style={{ width: '46px', height: '54px', textAlign: 'center', fontSize: '22px', fontWeight: '700',
                    border: `1.5px solid ${digit ? C.primary : C.border}`,
                    borderRadius: '12px', background: digit ? C.primaryLight : C.bg,
                    outline: 'none', fontFamily: 'inherit', color: C.text }}
                />
              ))}
            </div>

            {error && <div style={{ fontSize: '12px', color: C.danger, textAlign: 'center' }}>⚠ {error}</div>}

            <button type="submit" disabled={filled < OTP_LEN || loading}
              style={{ ...primaryBtn, opacity: (filled < OTP_LEN || loading) ? 0.4 : 1 }}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>

            <button type="button" onClick={handleResend} disabled={countdown > 0}
              style={{ background: 'none', border: 'none', color: countdown > 0 ? C.textMuted : C.primary, cursor: countdown > 0 ? 'default' : 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: 'inherit', padding: '4px', textAlign: 'center' }}>
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
            </button>
          </form>
        </div>
      </div>
    </CustomerLayout>
  )
}

const card = { background: '#FFFFFF', borderRadius: '20px', padding: '24px', gap: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }
const primaryBtn = { padding: '16px', borderRadius: '14px', background: '#1652F0', color: '#fff', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }
