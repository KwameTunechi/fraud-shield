import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/CustomerLayout'
import CustomerBottomNav from '../../components/CustomerBottomNav'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { customerApi } from '../../api/customerClient'

const C = { primary:'#1652F0', primaryLight:'#EBF0FE', primaryDark:'#0D3DB3', success:'#00875A', successLight:'#E3F5F0', warning:'#FF8B00', warningLight:'#FFF3E0', danger:'#DE350B', dangerLight:'#FFEBE6', text:'#0D1421', textSub:'#6B7280', textMuted:'#9CA3AF', bg:'#F5F7FA', surface:'#FFFFFF', border:'#E8ECEF' }

const REASON_LABELS = {
  late_night:            'Late-night transaction (22:00–05:00)',
  amount_above_2000_ghs: 'Amount above GHS 2,000',
  new_recipient:         'New recipient — no prior transactions',
  amount_3x_avg:         'Amount 3× your rolling average',
  amount_3x_rolling_avg: 'Amount exceeds 3× rolling average',
  rapid_succession:      'Multiple transactions in quick succession',
  recipient_flagged:     'Recipient account has been flagged',
}
const QUICK_AMOUNTS = ['50', '100', '200', '500']

function fmtMoney(n) { return '₵' + Number(n||0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }
function normalizePhone(raw) { const d = raw.replace(/\D/g,''); const c = d.startsWith('0') ? d.slice(1) : d; return '+233' + c }
function riskInfo(score) {
  if (score < 30) return { label:'Low Risk',    color:C.success, bg:C.successLight }
  if (score < 70) return { label:'Medium Risk', color:C.warning, bg:C.warningLight }
  return               { label:'High Risk',   color:C.danger,  bg:C.dangerLight  }
}

function Numpad({ onDigit, onDelete }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
      {keys.map((k, i) => (
        k === '' ? <div key={i} style={{ width: '76px', height: '76px' }} /> :
        <button key={i} type="button" onClick={() => k === 'del' ? onDelete() : onDigit(k)}
          style={{ width: '76px', height: '76px', borderRadius: '38px', background: C.surface, border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', fontSize: k === 'del' ? '18px' : '22px', fontWeight: '500', color: C.text, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {k === 'del' ? '⌫' : k}
        </button>
      ))}
    </div>
  )
}

function PinDots({ length }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '18px' }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ width: '16px', height: '16px', borderRadius: '8px', transition: 'all 0.12s', background: i < length ? C.primary : 'transparent', border: `2px solid ${i < length ? C.primary : C.border}` }} />
      ))}
    </div>
  )
}

const STEP_LABELS = ['Send to', 'Risk Check', 'Confirm', 'Done']

export default function CustomerSend() {
  const navigate = useNavigate()
  const { customer, refreshCustomer } = useCustomerAuth()

  const [step,       setStep]       = useState(0)
  const [phone,      setPhone]      = useState('')
  const [amount,     setAmount]     = useState('')
  const [note,       setNote]       = useState('')
  const [preview,    setPreview]    = useState(null)
  const [analyzing,  setAnalyzing]  = useState(false)
  const [pin,        setPin]        = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result,     setResult]     = useState(null)

  const num  = parseFloat(amount) || 0
  const risk = preview ? riskInfo(preview.score) : null

  async function handleAnalyse(e) {
    e.preventDefault()
    if (!num || num <= 0) { alert('Please enter a valid amount.'); return }
    if (customer?.balance && num > Number(customer.balance)) { alert(`Insufficient balance. Your balance is ${fmtMoney(customer.balance)}.`); return }
    setStep(1); setAnalyzing(true)
    try {
      const data = await customerApi.post('/api/transactions/preview', { recipientPhone: normalizePhone(phone), amount: num })
      setPreview(data)
    } catch (err) { alert(err.message ?? 'Could not analyse transaction.'); setStep(0) }
    finally { setAnalyzing(false) }
  }

  async function handleSend() {
    if (pin.length < 4) return
    setSubmitting(true)
    try {
      const { transaction } = await customerApi.post('/api/transactions', { recipientPhone: normalizePhone(phone), amount: num, pin, category: 'P2P', note: note || undefined })
      setResult(transaction)
      await refreshCustomer()
      setStep(3)
    } catch (err) { alert(err.message ?? 'Transaction failed. Please try again.') }
    finally { setSubmitting(false) }
  }

  function onDigit(d) { if (pin.length < 4) setPin(p => p + d) }
  function onDelete()  { setPin(p => p.slice(0, -1)) }
  if (step === 2 && pin.length === 4 && !submitting) handleSend()

  function reset() { setStep(0); setPhone(''); setAmount(''); setNote(''); setPreview(null); setPin(''); setResult(null) }

  const Header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
        <button onClick={() => step === 0 ? navigate('/app/home') : step === 3 ? reset() : setStep(s => s - 1)}
          style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
          {step === 3 ? '✕' : '←'}
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>Send Money</div>
          <div style={{ fontSize: '12px', color: C.textSub }}>{STEP_LABELS[step]}</div>
        </div>
        <div style={{ width: '38px' }} />
      </div>
      {step < 3 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px 14px', gap: '0', borderBottom: `1px solid ${C.border}` }}>
          {[0,1,2].map((_, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '5px', background: i <= step ? C.primary : C.border, transition: 'background 0.2s' }} />
              {i < 2 && <div style={{ width: '48px', height: '2px', background: i < step ? C.primary : C.border, transition: 'background 0.2s' }} />}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <CustomerLayout header={Header}>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }}>

        {/* ── STEP 0: Form ───────────────────────────────────────────── */}
        {step === 0 && (
          <form onSubmit={handleAnalyse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={fl}>Recipient Phone Number</label>
              <div style={{ display: 'flex', borderRadius: '12px', border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px', background: C.bg, borderRight: `1px solid ${C.border}`, fontSize: '15px', fontWeight: '600', color: C.textSub, display: 'flex', alignItems: 'center' }}>+233</div>
                <input type="tel" placeholder="20 000 0000" value={phone} onChange={e => setPhone(e.target.value)}
                  style={{ flex: 1, padding: '14px', fontSize: '15px', border: 'none', outline: 'none', fontFamily: 'inherit', color: C.text, background: C.surface }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={fl}>Amount (GHS)</label>
              <div style={{ display: 'flex', alignItems: 'center', borderRadius: '12px', border: `1.5px solid ${C.border}`, padding: '0 16px', background: C.surface }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: C.primary, marginRight: '8px' }}>₵</span>
                <input type="number" placeholder="0.00" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  style={{ flex: 1, fontSize: '28px', fontWeight: '800', color: C.text, border: 'none', outline: 'none', fontFamily: 'inherit', padding: '14px 0', background: 'transparent' }} />
              </div>
              <div style={{ fontSize: '12px', color: C.textSub }}>Available: {fmtMoney(customer?.balance ?? 0)}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} type="button" onClick={() => setAmount(a)}
                    style={{ flex: 1, padding: '10px 0', background: amount === a ? C.primaryLight : C.surface, borderRadius: '10px', border: `1.5px solid ${amount === a ? C.primary : C.border}`, color: amount === a ? C.primary : C.textSub, fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ₵{a}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={fl}>Note (optional)</label>
              <input type="text" placeholder="What's this for?" value={note} onChange={e => setNote(e.target.value)}
                style={{ padding: '14px', borderRadius: '12px', border: `1.5px solid ${C.border}`, fontSize: '15px', outline: 'none', fontFamily: 'inherit', color: C.text, background: C.surface }} />
            </div>

            <button type="submit" disabled={!phone || !amount}
              style={{ ...pb, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (!phone || !amount) ? 0.4 : 1 }}>
              Check &amp; Continue →
            </button>
          </form>
        )}

        {/* ── STEP 1: Risk check ─────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div style={{ background: C.primaryLight, borderRadius: '12px', padding: '14px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: C.primary }}>
              Sending {fmtMoney(num)} to {normalizePhone(phone)}
            </div>

            {analyzing ? (
              <div style={{ background: C.surface, borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🔍</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>Analysing transaction</div>
                <div style={{ fontSize: '13px', color: C.textSub, textAlign: 'center' }}>Checking time · recipient · amount · history</div>
              </div>
            ) : preview && (
              <>
                <div style={{ background: risk.bg, borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '40px', fontWeight: '800', color: risk.color }}>{preview.score}%</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: risk.color }}>{risk.label}</div>
                </div>

                {preview.reasons.length > 0 ? (
                  <div style={{ background: C.warningLight, borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚠</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: C.warning }}>Anomalies detected</span>
                    </div>
                    {preview.reasons.map(r => (
                      <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '3px', background: C.warning, marginTop: '5px', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: '#92400E', lineHeight: '18px' }}>{REASON_LABELS[r] ?? r}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: C.successLight, borderRadius: '14px', padding: '14px' }}>
                    <span style={{ fontSize: '20px' }}>✓</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: C.success }}>No suspicious patterns detected</span>
                  </div>
                )}

                <button onClick={() => setStep(2)} style={{ ...pb, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: preview.score >= 70 ? C.danger : C.primary }}>
                  Continue to Confirm →
                </button>
              </>
            )}
          </>
        )}

        {/* ── STEP 2: PIN confirm ─────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div style={{ background: C.surface, borderRadius: '14px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { k: 'To',     v: normalizePhone(phone) },
                { k: 'Amount', v: fmtMoney(num), bold: true, color: C.primary },
                note ? { k: 'Note', v: note } : null,
                { k: 'Risk',   v: `${preview?.score ?? 0}% — ${risk?.label}`, color: risk?.color },
              ].filter(Boolean).map(({ k, v, bold, color }, i, arr) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize: '13px', color: C.textSub }}>{k}</span>
                  <span style={{ fontSize: '13px', fontWeight: bold ? '800' : '600', color: color ?? C.text, textAlign: 'right', flex: 1, marginLeft: '16px' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '14px', fontWeight: '700', color: C.text, textAlign: 'center' }}>Enter your 4-digit PIN</div>
            <PinDots length={pin.length} />
            <Numpad onDigit={onDigit} onDelete={onDelete} />

            <button disabled={pin.length < 4 || submitting} onClick={handleSend}
              style={{ ...pb, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (pin.length < 4 || submitting) ? 0.4 : 1 }}>
              {submitting ? 'Processing…' : `Send ${fmtMoney(num)}`}
            </button>
          </>
        )}

        {/* ── STEP 3: Result ──────────────────────────────────────────── */}
        {step === 3 && result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: result.status === 'blocked' ? C.dangerLight : result.status === 'review' ? C.warningLight : C.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>
              {result.status === 'blocked' ? '✕' : result.status === 'review' ? '🕐' : '✓'}
            </div>

            <div style={{ fontSize: '22px', fontWeight: '800', color: C.text, textAlign: 'center' }}>
              {result.status === 'blocked' ? 'Transaction Blocked' : result.status === 'review' ? 'Under Review' : 'Money Sent!'}
            </div>
            <div style={{ fontSize: '14px', color: C.textSub, textAlign: 'center', lineHeight: '22px', paddingHorizontal: '16px' }}>
              {result.status === 'blocked' ? 'This transaction was blocked due to high fraud risk.' : result.status === 'review' ? 'Our team is reviewing this transaction. You will be notified.' : `${fmtMoney(result.amount)} sent to ${result.recipient_phone}.`}
            </div>

            <div style={{ background: C.surface, borderRadius: '14px', padding: '16px', width: '100%', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: C.textMuted, fontWeight: '600' }}>Reference</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: C.text }}>{result.reference}</div>
              {result.blockchain_hash && (
                <>
                  <div style={{ height: '1px', background: C.border }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', color: C.success }}>🔗</span>
                    <span style={{ flex: 1, fontSize: '11px', fontFamily: 'monospace', color: C.success }}>{result.blockchain_hash.slice(0, 20)}…</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: C.success }}>On-chain</span>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => { reset(); navigate('/app/home') }} style={{ ...pb, width: '100%' }}>Done</button>
          </div>
        )}
      </div>
      <CustomerBottomNav />
    </CustomerLayout>
  )
}

const pb = { padding: '16px', borderRadius: '14px', background: '#1652F0', color: '#fff', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }
const fl = { fontSize: '13px', fontWeight: '600', color: '#6B7280' }
