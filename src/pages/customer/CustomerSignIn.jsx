import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

const C = { primary:'#1652F0', primaryLight:'#EBF0FE', danger:'#DE350B', text:'#0D1421', textSub:'#6B7280', textMuted:'#9CA3AF', bg:'#F5F7FA', surface:'#FFFFFF', border:'#E8ECEF' }

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
      setError(err.message ?? 'Could not verify number.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CustomerLayout>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '32px', justifyContent: 'center' }}>

        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={C.primary}><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"/></svg>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: C.text }}>FraudShield</div>
          <div style={{ fontSize: '13px', color: C.textSub }}>Secure Mobile Money</div>
        </div>

        {/* Card */}
        <div style={s.card}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: C.text }}>Sign In</div>
          <div style={{ fontSize: '14px', color: C.textSub, lineHeight: '20px', marginTop: '-8px' }}>Enter your registered Ghana mobile number.</div>

          <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={s.fieldLabel}>Mobile Number</label>
              <div style={{ display: 'flex', borderRadius: '12px', border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px', background: C.bg, borderRight: `1px solid ${C.border}`, fontSize: '14px', fontWeight: '600', color: C.textSub, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  🇬🇭 +233
                </div>
                <input type="tel" placeholder="20 000 0000" value={phone} autoFocus
                  onChange={e => { setPhone(e.target.value); setError('') }}
                  style={{ flex: 1, padding: '14px', fontSize: '16px', border: 'none', outline: 'none', fontFamily: 'inherit', color: C.text, background: C.surface }}
                />
              </div>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.danger }}>⚠ {error}</div>}
            </div>

            <button type="submit" disabled={!phone || loading}
              style={{ ...s.primaryBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (!phone || loading) ? 0.4 : 1 }}>
              {loading ? 'Please wait…' : 'Continue'}{!loading && ' →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: C.textMuted, lineHeight: '18px' }}>
          Protected by 256-bit encryption &amp; blockchain audit trail
        </div>
      </div>
    </CustomerLayout>
  )
}

const s = {
  card:       { background: '#FFFFFF', borderRadius: '20px', padding: '24px', gap: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' },
  primaryBtn: { padding: '16px', borderRadius: '14px', background: '#1652F0', color: '#fff', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' },
  fieldLabel: { fontSize: '13px', fontWeight: '600', color: '#6B7280' },
}
