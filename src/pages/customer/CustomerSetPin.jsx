import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

const C = { primary:'#1652F0', primaryLight:'#EBF0FE', danger:'#DE350B', text:'#0D1421', textSub:'#6B7280', bg:'#F5F7FA', surface:'#FFFFFF', border:'#E8ECEF' }
const PIN_LEN = 4

function Numpad({ onDigit, onDelete }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
      {keys.map((k, i) => (
        k === '' ? <div key={i} style={{ width: '72px', height: '72px' }} /> :
        <button key={i} type="button"
          onClick={() => k === 'del' ? onDelete() : onDigit(k)}
          style={{ width: '72px', height: '72px', borderRadius: '36px', background: C.bg, border: `1px solid ${C.border}`,
            fontSize: k === 'del' ? '18px' : '22px', fontWeight: '500', color: C.text,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {k === 'del' ? '⌫' : k}
        </button>
      ))}
    </div>
  )
}

function PinDots({ length }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '8px 0' }}>
      {Array.from({ length: PIN_LEN }).map((_, i) => (
        <div key={i} style={{ width: '18px', height: '18px', borderRadius: '50%', transition: 'all 0.12s',
          background: i < length ? C.primary : 'transparent',
          border: `2px solid ${i < length ? C.primary : C.border}` }} />
      ))}
    </div>
  )
}

export default function CustomerSetPin() {
  const navigate = useNavigate()
  const location = useLocation()
  const phone    = location.state?.phone ?? ''
  const { setPin } = useCustomerAuth()

  const [step,    setStep]    = useState('enter')
  const [pin,     setPin2]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const current    = step === 'enter' ? pin : confirm
  const setCurrent = step === 'enter' ? setPin2 : setConfirm

  function onDigit(d) {
    setError('')
    if (current.length < PIN_LEN) {
      const next = current + d
      setCurrent(next)
      if (next.length === PIN_LEN && step === 'enter') setTimeout(() => setStep('confirm'), 150)
    }
  }

  function onDelete() { setError(''); setCurrent(c => c.slice(0, -1)) }

  async function handleConfirm() {
    if (confirm.length < PIN_LEN) return
    if (pin !== confirm) { setError('PINs do not match. Try again.'); setConfirm(''); return }
    setLoading(true)
    try { await setPin(pin); navigate('/app/home', { replace: true }) }
    catch (err) { setError(err.message ?? 'Could not set PIN.') }
    finally { setLoading(false) }
  }

  if (step === 'confirm' && confirm.length === PIN_LEN && !loading && !error) handleConfirm()

  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
      {step === 'confirm' && (
        <button onClick={() => { setStep('enter'); setConfirm(''); setError('') }}
          style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          ←
        </button>
      )}
      <div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>{step === 'enter' ? 'Create PIN' : 'Confirm PIN'}</div>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>{step === 'enter' ? 'Step 1 of 2' : 'Step 2 of 2'}</div>
      </div>
    </div>
  )

  return (
    <CustomerLayout header={Header}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={card}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '28px' }}>🔐</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: C.text }}>
              {step === 'enter' ? 'Create your PIN' : 'Confirm your PIN'}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: '20px', marginTop: '-4px' }}>
              {step === 'enter' ? 'Choose a 4-digit PIN to secure your account.' : 'Enter the same PIN again to confirm.'}
            </div>
          </div>

          <PinDots length={current.length} />
          {error && <div style={{ fontSize: '12px', color: C.danger, textAlign: 'center' }}>⚠ {error}</div>}
          {loading && <div style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center' }}>Setting PIN…</div>}
          <Numpad onDigit={onDigit} onDelete={onDelete} />
        </div>
      </div>
    </CustomerLayout>
  )
}

const card = { background: '#FFFFFF', borderRadius: '20px', padding: '28px', gap: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }
