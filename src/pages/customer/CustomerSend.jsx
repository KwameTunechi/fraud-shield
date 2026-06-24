import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { customerApi } from '../../api/customerClient'

const P = '#1652F0'

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  const clean  = digits.startsWith('0') ? digits.slice(1) : digits
  if (clean.length !== 9) return null
  return '+233' + clean
}

const STATUS_COPY = {
  completed: { title: 'Transfer Successful!', desc: 'Your money has been sent.', icon: <CheckCircle size={40} color="#00875A" />, color: '#00875A', bg: '#E3F5F0' },
  review:    { title: 'Transaction Under Review', desc: 'Our system flagged this for review. Funds are held and will be released or refunded shortly.', icon: '🔍', color: '#FF8B00', bg: '#FFF3E0' },
  blocked:   { title: 'Transaction Blocked', desc: 'This transfer was blocked due to high fraud risk. Your balance has not been charged.', icon: <XCircle size={40} color="#DE350B" />, color: '#DE350B', bg: '#FFEBE6' },
}

export default function CustomerSend() {
  const navigate = useNavigate()
  const { customer, refreshCustomer } = useCustomerAuth()

  const [step,      setStep]      = useState('form')   // form | confirm | result
  const [recipient, setRecipient] = useState('')
  const [amount,    setAmount]    = useState('')
  const [note,      setNote]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [result,    setResult]    = useState(null)

  const normalizedPhone = normalizePhone(recipient)

  function handleFormSubmit(e) {
    e.preventDefault()
    setError('')
    if (!normalizedPhone) { setError('Enter a valid 10-digit Ghana mobile number.'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return }
    if (amt > (customer?.balance ?? 0)) { setError(`Insufficient balance. Your balance is ₵${Number(customer?.balance).toFixed(2)}.`); return }
    setStep('confirm')
  }

  async function handleSend() {
    setLoading(true)
    setError('')
    try {
      const tx = await customerApi.post('/api/transactions', {
        recipientPhone: normalizedPhone,
        amount: parseFloat(amount),
        category: 'P2P',
      })
      await refreshCustomer()
      setResult(tx)
      setStep('result')
    } catch (err) {
      setError(err.message ?? 'Transfer failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'result' && result) {
    const st = STATUS_COPY[result.status] ?? STATUS_COPY.completed
    return (
      <CustomerLayout>
        <div style={{ ...card, alignItems: 'center', textAlign: 'center', gap: '16px', marginTop: '40px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
            {typeof st.icon === 'string' ? st.icon : st.icon}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0d1421' }}>{st.title}</div>
          <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{st.desc}</div>
          <div style={{ background: '#f5f7fa', borderRadius: '12px', padding: '14px 20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Row label="To"      value={result.recipient_name ?? normalizedPhone} />
            <Row label="Amount"  value={`₵${Number(result.amount).toFixed(2)}`} bold />
            <Row label="Risk"    value={`${result.risk_score}%`} color={result.risk_score < 30 ? '#00875A' : result.risk_score < 70 ? '#FF8B00' : '#DE350B'} />
            <Row label="Ref"     value={result.reference} mono />
          </div>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button onClick={() => navigate(`/app/transactions/${result.id}`)}
              style={{ flex: 1, padding: '13px', borderRadius: '12px', border: `1.5px solid ${P}`, background: '#EBF0FE', color: P, fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              View Details
            </button>
            <button onClick={() => navigate('/app/home', { replace: true })}
              style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: P, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Done
            </button>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (step === 'confirm') {
    return (
      <CustomerLayout>
        <div style={{ paddingTop: '24px' }}>
          <button onClick={() => setStep('form')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
            <ArrowLeft size={16} /> Edit
          </button>
        </div>
        <div style={{ ...card, gap: '16px' }}>
          <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, color: '#0d1421' }}>Confirm Transfer</div>
          <div style={{ background: '#f5f7fa', borderRadius: '14px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Row label="To"      value={normalizedPhone} />
            <Row label="Amount"  value={`₵${parseFloat(amount).toFixed(2)}`} bold />
            {note && <Row label="Note" value={note} />}
            <Row label="Balance after" value={`₵${(Number(customer?.balance ?? 0) - parseFloat(amount)).toFixed(2)}`} />
          </div>
          {error && <div style={{ fontSize: '12px', color: '#de350b', textAlign: 'center' }}>⚠ {error}</div>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setStep('form')} disabled={loading}
              style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1.5px solid #e8ecef', background: '#fff', color: '#6b7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Cancel
            </button>
            <button onClick={handleSend} disabled={loading}
              style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: P, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Sending…' : 'Send Money'}
            </button>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div style={{ paddingTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/app/home')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d1421' }}>Send Money</div>
      </div>

      <div style={card}>
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Recipient */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={lbl}>Recipient Number</label>
            <div style={{ display: 'flex', borderRadius: '12px', border: '1.5px solid #e8ecef', overflow: 'hidden' }}>
              <div style={{ padding: '13px 14px', background: '#f5f7fa', borderRight: '1.5px solid #e8ecef', fontSize: '14px', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                🇬🇭 +233
              </div>
              <input type="tel" placeholder="24 000 0000" value={recipient}
                onChange={e => { setRecipient(e.target.value); setError('') }}
                style={{ flex: 1, padding: '13px 14px', fontSize: '16px', border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#0d1421' }}
              />
            </div>
          </div>

          {/* Amount */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={lbl}>Amount (GHS)</label>
            <div style={{ display: 'flex', alignItems: 'center', borderRadius: '12px', border: '1.5px solid #e8ecef', overflow: 'hidden' }}>
              <div style={{ padding: '13px 14px', background: '#f5f7fa', borderRight: '1.5px solid #e8ecef', fontSize: '14px', fontWeight: 700, color: '#0d1421' }}>₵</div>
              <input type="number" placeholder="0.00" min="0.01" step="0.01"
                value={amount} onChange={e => { setAmount(e.target.value); setError('') }}
                style={{ flex: 1, padding: '13px 14px', fontSize: '18px', fontWeight: 700, border: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#0d1421' }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              Balance: <strong style={{ color: '#0d1421' }}>₵{Number(customer?.balance ?? 0).toFixed(2)}</strong>
            </div>
          </div>

          {/* Quick amounts */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[50, 100, 200, 500].map(v => (
              <button key={v} type="button" onClick={() => setAmount(String(v))}
                style={{ flex: 1, padding: '8px 0', borderRadius: '8px', border: `1.5px solid ${amount === String(v) ? P : '#e8ecef'}`, background: amount === String(v) ? '#EBF0FE' : '#fff', color: amount === String(v) ? P : '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                ₵{v}
              </button>
            ))}
          </div>

          {/* Note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={lbl}>Note (optional)</label>
            <input type="text" placeholder="e.g. Food money" value={note}
              onChange={e => setNote(e.target.value)} maxLength={80}
              style={{ padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e8ecef', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#0d1421' }}
            />
          </div>

          {error && <div style={{ fontSize: '12px', color: '#de350b' }}>⚠ {error}</div>}

          <button type="submit"
            style={{ ...btn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Send size={16} /> Continue
          </button>
        </form>
      </div>
    </CustomerLayout>
  )
}

function Row({ label, value, bold, color, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: bold ? 800 : 600, color: color ?? '#0d1421', fontFamily: mono ? 'monospace' : 'Inter, sans-serif' }}>{value}</span>
    </div>
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
const lbl = { fontSize: '13px', fontWeight: 600, color: '#6b7280' }
