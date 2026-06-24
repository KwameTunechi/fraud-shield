import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Delete } from 'lucide-react'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

const P = '#1652F0'
const PIN_LEN = 4

function Numpad({ onDigit, onDelete }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '280px', margin: '0 auto' }}>
      {keys.map((k, i) => (
        k === '' ? <div key={i} /> :
        <button key={i} type="button"
          onClick={() => k === 'del' ? onDelete() : onDigit(k)}
          style={{
            height: '64px', borderRadius: '32px', background: '#f5f7fa',
            border: '1px solid #e8ecef', fontSize: k === 'del' ? '14px' : '22px',
            fontWeight: 500, color: '#0d1421', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.12s',
          }}
          onMouseDown={e => e.currentTarget.style.background = '#EBF0FE'}
          onMouseUp={e => e.currentTarget.style.background = '#f5f7fa'}
          onMouseLeave={e => e.currentTarget.style.background = '#f5f7fa'}
        >
          {k === 'del' ? <Delete size={20} color="#6b7280" /> : k}
        </button>
      ))}
    </div>
  )
}

function PinDots({ length }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '8px 0' }}>
      {Array.from({ length: PIN_LEN }).map((_, i) => (
        <div key={i} style={{
          width: '18px', height: '18px', borderRadius: '50%',
          background: i < length ? P : 'transparent',
          border: `2px solid ${i < length ? P : '#e8ecef'}`,
          transition: 'all 0.12s',
        }} />
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
      if (next.length === PIN_LEN && step === 'enter') {
        setTimeout(() => setStep('confirm'), 150)
      }
    }
  }

  function onDelete() {
    setError('')
    setCurrent(c => c.slice(0, -1))
  }

  async function handleConfirm() {
    if (confirm.length < PIN_LEN) return
    if (pin !== confirm) {
      setError('PINs do not match. Try again.')
      setConfirm('')
      return
    }
    setLoading(true)
    try {
      await setPin(pin)
      navigate('/app/home', { replace: true })
    } catch (err) {
      setError(err.message ?? 'Could not set PIN.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-submit when confirm is full
  if (step === 'confirm' && confirm.length === PIN_LEN && !loading && !error) {
    handleConfirm()
  }

  return (
    <CustomerLayout>
      <div style={{ paddingTop: '24px' }}>
        {step === 'confirm' && (
          <button onClick={() => { setStep('enter'); setConfirm(''); setError('') }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>

      <div style={card}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#EBF0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <span style={{ fontSize: '28px' }}>🔐</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0d1421' }}>
            {step === 'enter' ? 'Create your PIN' : 'Confirm your PIN'}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            {step === 'enter' ? 'Choose a 4-digit PIN to secure your account.' : 'Enter the same PIN again to confirm.'}
          </div>
        </div>

        <PinDots length={current.length} />
        {error && <div style={{ fontSize: '12px', color: '#de350b', textAlign: 'center' }}>⚠ {error}</div>}
        {loading && <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>Setting PIN…</div>}

        <Numpad onDigit={onDigit} onDelete={onDelete} />
      </div>
    </CustomerLayout>
  )
}

const card = {
  background: '#fff', borderRadius: '20px', padding: '28px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)', display: 'flex',
  flexDirection: 'column', gap: '20px',
}
