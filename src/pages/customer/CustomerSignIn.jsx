import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

const P = '#1652F0'

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  const clean  = digits.startsWith('0') ? digits.slice(1) : digits
  if (clean.length !== 9) return null
  return '+233' + clean
}

export default function CustomerSignIn() {
  const navigate = useNavigate()
  const { requestOtp } = useCustomerAuth()
  const [phone,   setPhone]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleContinue(e) {
    e.preventDefault()
    setError('')
    const normalized = normalizePhone(phone)
    if (!normalized) { setError('Enter a valid 10-digit Ghana mobile number.'); return }
    setLoading(true)
    try {
      await requestOtp(normalized)
      navigate('/app/otp', { state: { phone: normalized } })
    } catch (err) {
      setError(err.message ?? 'Could not send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CustomerLayout>
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingTop: '40px', paddingBottom: '8px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={30} color="#fff" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0d1421' }}>FraudShield</div>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>Secure Mobile Money</div>
      </div>

      {/* Card */}
      <div style={card}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#0d1421' }}>Sign In</div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Enter your registered Ghana mobile number.</div>

        <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Mobile Number</label>
            <div style={{ display: 'flex', borderRadius: '12px', border: '1.5px solid #e8ecef', overflow: 'hidden', background: '#fff' }}>
              <div style={{ padding: '13px 14px', background: '#f5f7fa', borderRight: '1.5px solid #e8ecef', fontSize: '14px', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                🇬🇭 +233
              </div>
              <input
                type="tel"
                placeholder="24 000 0000"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError('') }}
                autoFocus
                style={{ flex: 1, padding: '13px 14px', fontSize: '16px', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#0d1421' }}
              />
            </div>
            {error && <div style={{ fontSize: '12px', color: '#de350b' }}>⚠ {error}</div>}
          </div>

          <button
            type="submit"
            disabled={!phone || loading}
            style={{ ...btn, opacity: (!phone || loading) ? 0.4 : 1 }}
          >
            {loading ? 'Sending code…' : 'Continue →'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
        Protected by 256-bit encryption &amp; blockchain audit trail
      </div>
    </CustomerLayout>
  )
}

const card = {
  background: '#fff', borderRadius: '20px', padding: '24px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)', display: 'flex',
  flexDirection: 'column', gap: '16px',
}
const btn = {
  padding: '14px', borderRadius: '12px', background: '#1652F0',
  color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none',
  cursor: 'pointer', fontFamily: 'Inter, sans-serif', width: '100%',
}
