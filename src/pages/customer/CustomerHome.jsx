import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerBottomNav from '../../components/CustomerBottomNav'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useCustomerApi } from '../../hooks/useCustomerApi'
import { customerApi } from '../../api/customerClient'

const C = { primary:'#1652F0', primaryLight:'#EBF0FE', success:'#00875A', successLight:'#E3F5F0', warning:'#FF8B00', warningLight:'#FFF3E0', danger:'#DE350B', dangerLight:'#FFEBE6', text:'#0D1421', textSub:'#6B7280', textMuted:'#9CA3AF', bg:'#F5F7FA', surface:'#FFFFFF', border:'#E8ECEF' }

function fmtMoney(n) { return '₵' + Number(n||0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }
function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime(), m = Math.floor(diff/60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}
function statusColor(s) {
  if (s==='completed') return { color:C.success,  bg:C.successLight }
  if (s==='review')    return { color:C.warning,  bg:C.warningLight }
  return                      { color:C.danger,   bg:C.dangerLight  }
}
function greeting() { const h = new Date().getHours(); return h<12?'morning':h<17?'afternoon':'evening' }
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  const clean  = digits.startsWith('0') ? digits.slice(1) : digits
  return '+233' + clean
}

const ICONS = {
  send:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1652F0" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  receive: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1652F0" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  airtime: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1652F0" strokeWidth="2.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  bill:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1652F0" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  bell:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  eye:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  shield:  <svg width="11" height="11" viewBox="0 0 24 24" fill="#4ade80"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"/></svg>,
  swap:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1652F0" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
  copy:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check:   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00875A" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
}

// ── Shared modal shell ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:'100%', maxWidth:'440px', background:C.surface, borderRadius:'20px 20px 0 0', maxHeight:'92vh', overflowY:'auto', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 0' }}>
          <div style={{ fontSize:'17px', fontWeight:'700', color:C.text }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'22px', color:C.textMuted, lineHeight:1, padding:'4px' }}>×</button>
        </div>
        <div style={{ padding:'16px 20px 32px' }}>{children}</div>
      </div>
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontSize:'12px', fontWeight:'700', color:C.textSub, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px', marginTop:'16px' }}>{children}</div>
}

function Input({ style, ...props }) {
  return (
    <input style={{ width:'100%', background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:'12px', padding:'13px 14px', fontSize:'15px', color:C.text, fontFamily:'inherit', boxSizing:'border-box', outline:'none', ...style }} {...props} />
  )
}

function Btn({ children, disabled, loading, onClick, variant='primary', style }) {
  const base = { width:'100%', borderRadius:'14px', padding:'15px', fontSize:'16px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', border:'none', marginTop:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity: disabled || loading ? 0.4 : 1, ...style }
  const theme = variant === 'primary'
    ? { background:C.primary, color:'#fff' }
    : { background:C.bg, color:C.primary, border:`1.5px solid ${C.primary}` }
  return <button style={{ ...base, ...theme }} disabled={disabled || loading} onClick={onClick}>{loading ? '…' : children}</button>
}

// ── Receive modal ──────────────────────────────────────────────────────────
function ReceiveModal({ customer, onClose }) {
  const [copied, setCopied] = useState(false)
  const phone = customer?.phone ?? ''
  const formatted = phone.startsWith('+233') ? '0' + phone.slice(4) : phone
  const display = formatted.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')

  function handleCopy() {
    navigator.clipboard?.writeText(phone).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title="Receive Money" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'8px' }}>
        <div style={{ width:'72px', height:'72px', borderRadius:'36px', background:C.primaryLight, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}>
          {ICONS.receive}
        </div>
        <div style={{ fontSize:'13px', color:C.textSub, marginBottom:'10px' }}>Your Telecel Cash Number</div>
        <div style={{ background:C.bg, border:`2px solid ${C.primary}`, borderRadius:'14px', padding:'18px 32px', marginBottom:'14px', textAlign:'center' }}>
          <div style={{ fontSize:'28px', fontWeight:'800', color:C.primary, letterSpacing:'2px' }}>{display}</div>
        </div>
        <div style={{ fontSize:'13px', color:C.textSub, textAlign:'center', lineHeight:'1.6', marginBottom:'8px' }}>
          Share this number with anyone who wants to send you money.
        </div>
        <Btn onClick={handleCopy} variant='primary' style={{ marginTop:'12px' }}>
          <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>{ICONS.copy} {copied ? 'Copied!' : 'Copy Number'}</span>
        </Btn>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', background:C.successLight, borderRadius:'12px', padding:'12px', marginTop:'14px', width:'100%', boxSizing:'border-box' }}>
          {ICONS.shield}
          <span style={{ fontSize:'12px', color:C.success, lineHeight:'1.5' }}>All incoming transfers are verified by the FraudShield AI before they reach your wallet.</span>
        </div>
      </div>
    </Modal>
  )
}

// ── Airtime modal ──────────────────────────────────────────────────────────
const NETWORKS = ['MTN','Telecel','AirtelTigo']
const QUICK_AMOUNTS = [2, 5, 10, 20, 50]

function AirtimeModal({ customer, onClose, onSuccess }) {
  const [network,  setNetwork]  = useState('Telecel')
  const [phone,    setPhone]    = useState('')
  const [amount,   setAmount]   = useState('')
  const [pin,      setPin]      = useState('')
  const [step,     setStep]     = useState('form')  // form | pin | done
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [ref,      setRef]      = useState('')

  const balance   = Number(customer?.balance ?? 0)
  const amtNum    = parseFloat(amount) || 0
  const canNext   = phone.replace(/\D/g,'').length >= 9 && amtNum >= 1 && amtNum <= balance

  async function handlePay() {
    setError(''); setLoading(true)
    try {
      const res = await customerApi.post('/api/transactions', {
        recipientPhone: normalizePhone(phone),
        amount: amtNum,
        pin,
        category: 'MERCHANT',
      })
      setRef(res.transaction?.reference ?? '')
      setStep('done')
      onSuccess?.()
    } catch (err) {
      setError(err.message ?? 'Top-up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') return (
    <Modal title="Airtime Top-up" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0' }}>
        {ICONS.check}
        <div style={{ fontSize:'20px', fontWeight:'800', color:C.text, marginTop:'16px', marginBottom:'6px' }}>Top-up Successful!</div>
        <div style={{ fontSize:'28px', fontWeight:'800', color:C.primary, marginBottom:'4px' }}>{fmtMoney(amtNum)}</div>
        <div style={{ fontSize:'14px', color:C.textSub, marginBottom:'4px' }}>airtime sent to {phone}</div>
        <div style={{ fontSize:'12px', color:C.textMuted, marginBottom:'24px' }}>Ref: {ref}</div>
        <Btn onClick={onClose}>Done</Btn>
      </div>
    </Modal>
  )

  if (step === 'pin') return (
    <Modal title="Confirm Top-up" onClose={() => setStep('form')}>
      <div style={{ background:C.bg, borderRadius:'14px', overflow:'hidden', margin:'8px 0 4px' }}>
        {[['Phone number', phone], ['Network', network], ['Amount', fmtMoney(amtNum)]].map(([l, v], i, arr) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'14px 16px', borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : 'none' }}>
            <span style={{ fontSize:'14px', color:C.textSub }}>{l}</span>
            <span style={{ fontSize:'14px', fontWeight:'600', color: l==='Amount' ? C.primary : C.text }}>{v}</span>
          </div>
        ))}
      </div>
      <Label>Enter your PIN</Label>
      <Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="••••" style={{ textAlign:'center', fontSize:'24px', letterSpacing:'8px' }} />
      {error && <div style={{ fontSize:'13px', color:C.danger, marginTop:'8px' }}>{error}</div>}
      <Btn onClick={handlePay} disabled={pin.length !== 4} loading={loading}>Buy Airtime</Btn>
    </Modal>
  )

  return (
    <Modal title="Airtime Top-up" onClose={onClose}>
      <Label>Select Network</Label>
      <div style={{ display:'flex', gap:'8px' }}>
        {NETWORKS.map(n => (
          <button key={n} onClick={() => setNetwork(n)}
            style={{ flex:1, padding:'10px 6px', borderRadius:'10px', border:`1.5px solid ${network===n ? C.primary : C.border}`, background: network===n ? C.primaryLight : C.bg, cursor:'pointer', fontSize:'12px', fontWeight:'600', color: network===n ? C.primary : C.textSub, fontFamily:'inherit' }}>
            {n}
          </button>
        ))}
      </div>
      <Label>Phone Number</Label>
      <div style={{ display:'flex', gap:'8px' }}>
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0244 000 000" inputMode="numeric" style={{ flex:1 }} />
        <button onClick={() => setPhone((customer?.phone??'').replace('+233','0'))}
          style={{ background:C.primaryLight, border:'none', borderRadius:'10px', padding:'0 12px', cursor:'pointer', fontSize:'12px', fontWeight:'700', color:C.primary, fontFamily:'inherit', whiteSpace:'nowrap' }}>
          My number
        </button>
      </div>
      <Label>Amount (GHS)</Label>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'8px' }}>
        {QUICK_AMOUNTS.map(a => (
          <button key={a} onClick={() => setAmount(String(a))}
            style={{ padding:'8px 14px', borderRadius:'10px', border:`1.5px solid ${amount===String(a) ? C.primary : C.border}`, background: amount===String(a) ? C.primaryLight : C.bg, cursor:'pointer', fontSize:'13px', fontWeight:'600', color: amount===String(a) ? C.primary : C.textSub, fontFamily:'inherit' }}>
            ₵{a}
          </button>
        ))}
      </div>
      <Input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="Or enter custom amount" inputMode="decimal" />
      <div style={{ fontSize:'13px', color:C.textSub, marginTop:'8px' }}>Balance: <span style={{ color:C.primary, fontWeight:'700' }}>{fmtMoney(balance)}</span></div>
      {amtNum > balance && <div style={{ fontSize:'12px', color:C.danger, marginTop:'4px' }}>Amount exceeds your balance.</div>}
      <Btn onClick={() => { setError(''); setPin(''); setStep('pin') }} disabled={!canNext}>Continue</Btn>
    </Modal>
  )
}

// ── Pay Bill modal ──────────────────────────────────────────────────────────
const BILLERS = [
  { id:'ecg',      label:'ECG Electricity', icon:'⚡', phone:'+233200000001', accountLabel:'Meter Number' },
  { id:'gwcl',     label:'Ghana Water',     icon:'💧', phone:'+233200000002', accountLabel:'Account Number' },
  { id:'dstv',     label:'DStv',            icon:'📺', phone:'+233200000003', accountLabel:'Smart Card No.' },
  { id:'gotv',     label:'GOtv',            icon:'🖥', phone:'+233200000004', accountLabel:'Smart Card No.' },
  { id:'nhis',     label:'NHIS',            icon:'❤️', phone:'+233200000005', accountLabel:'NHIS ID' },
  { id:'internet', label:'Internet',        icon:'📶', phone:'+233200000006', accountLabel:'Account No.' },
]

function PayBillModal({ customer, onClose, onSuccess }) {
  const [biller,  setBiller]  = useState(null)
  const [account, setAccount] = useState('')
  const [amount,  setAmount]  = useState('')
  const [pin,     setPin]     = useState('')
  const [step,    setStep]    = useState('form')  // form | pin | done
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [ref,     setRef]     = useState('')

  const balance = Number(customer?.balance ?? 0)
  const amtNum  = parseFloat(amount) || 0
  const canNext = biller && account.length >= 3 && amtNum >= 1 && amtNum <= balance

  async function handlePay() {
    setError(''); setLoading(true)
    try {
      const res = await customerApi.post('/api/transactions', {
        recipientPhone: biller.phone,
        amount: amtNum,
        pin,
        category: 'MERCHANT',
      })
      setRef(res.transaction?.reference ?? '')
      setStep('done')
      onSuccess?.()
    } catch (err) {
      setError(err.message ?? 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') return (
    <Modal title="Pay Bill" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0' }}>
        {ICONS.check}
        <div style={{ fontSize:'20px', fontWeight:'800', color:C.text, marginTop:'16px', marginBottom:'6px' }}>Payment Successful!</div>
        <div style={{ fontSize:'28px', fontWeight:'800', color:C.primary, marginBottom:'4px' }}>{fmtMoney(amtNum)}</div>
        <div style={{ fontSize:'14px', color:C.textSub, marginBottom:'2px' }}>paid to {biller?.label}</div>
        <div style={{ fontSize:'13px', color:C.textMuted, marginBottom:'4px' }}>Account: {account}</div>
        <div style={{ fontSize:'12px', color:C.textMuted, marginBottom:'24px' }}>Ref: {ref}</div>
        <Btn onClick={onClose}>Done</Btn>
      </div>
    </Modal>
  )

  if (step === 'pin') return (
    <Modal title="Confirm Payment" onClose={() => setStep('form')}>
      <div style={{ background:C.bg, borderRadius:'14px', overflow:'hidden', margin:'8px 0 4px' }}>
        {[['Biller', biller?.label], ['Account / Ref', account], ['Amount', fmtMoney(amtNum)]].map(([l, v], i, arr) => (
          <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'14px 16px', borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : 'none' }}>
            <span style={{ fontSize:'14px', color:C.textSub }}>{l}</span>
            <span style={{ fontSize:'14px', fontWeight:'600', color: l==='Amount' ? C.primary : C.text }}>{v}</span>
          </div>
        ))}
      </div>
      <Label>Enter your PIN</Label>
      <Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="••••" style={{ textAlign:'center', fontSize:'24px', letterSpacing:'8px' }} />
      {error && <div style={{ fontSize:'13px', color:C.danger, marginTop:'8px' }}>{error}</div>}
      <Btn onClick={handlePay} disabled={pin.length !== 4} loading={loading}>Pay Now</Btn>
    </Modal>
  )

  return (
    <Modal title="Pay Bill" onClose={onClose}>
      <Label>Select Biller</Label>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
        {BILLERS.map(b => (
          <button key={b.id} onClick={() => setBiller(b)}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', padding:'12px 8px', borderRadius:'12px', border:`1.5px solid ${biller?.id===b.id ? C.primary : C.border}`, background: biller?.id===b.id ? C.primaryLight : C.bg, cursor:'pointer', fontFamily:'inherit' }}>
            <span style={{ fontSize:'22px' }}>{b.icon}</span>
            <span style={{ fontSize:'11px', fontWeight:'600', color: biller?.id===b.id ? C.primary : C.textSub, textAlign:'center' }}>{b.label}</span>
          </button>
        ))}
      </div>
      <Label>{biller?.accountLabel ?? 'Account / Reference'}</Label>
      <Input value={account} onChange={e => setAccount(e.target.value)} placeholder="Enter reference number" />
      <Label>Amount (GHS)</Label>
      <Input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="0.00" inputMode="decimal" />
      <div style={{ fontSize:'13px', color:C.textSub, marginTop:'8px' }}>Balance: <span style={{ color:C.primary, fontWeight:'700' }}>{fmtMoney(balance)}</span></div>
      {amtNum > balance && <div style={{ fontSize:'12px', color:C.danger, marginTop:'4px' }}>Amount exceeds your balance.</div>}
      <Btn onClick={() => { setError(''); setPin(''); setStep('pin') }} disabled={!canNext}>Continue</Btn>
    </Modal>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CustomerHome() {
  const navigate = useNavigate()
  const { customer, signOut, refreshCustomer } = useCustomerAuth()
  const [hidden,     setHidden]     = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [modal,      setModal]      = useState(null)  // 'receive' | 'airtime' | 'paybill' | null

  const { data: txData,    loading: txLoading,    reload: reloadTx    } = useCustomerApi('/api/transactions?limit=5')
  const { data: alertData, loading: alertLoading, reload: reloadAlerts } = useCustomerApi('/api/alerts?limit=3')

  const transactions = txData?.transactions ?? []
  const alerts       = alertData?.alerts    ?? []
  const unread       = alerts.filter(a => !a.read).length
  const initials     = (customer?.fullName ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([refreshCustomer(), reloadTx(), reloadAlerts()])
    setRefreshing(false)
  }

  async function handleSignOut() { await signOut(); navigate('/app/signin', { replace: true }) }

  function handleModalSuccess() { reloadTx(); refreshCustomer?.() }

  const ACTIONS = [
    { label: 'Send',     icon: ICONS.send,    action: () => navigate('/app/send') },
    { label: 'Receive',  icon: ICONS.receive,  action: () => setModal('receive') },
    { label: 'Airtime',  icon: ICONS.airtime,  action: () => setModal('airtime') },
    { label: 'Pay Bill', icon: ICONS.bill,     action: () => setModal('paybill') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column' }}>

        {/* ── Blue header ─────────────────────────────────────────────────── */}
        <div style={{ background: C.primary, paddingBottom: '24px' }}>
          <div style={{ padding: '20px 20px 0' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '19px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '14px' }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>Good {greeting()}</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{customer?.fullName ?? 'Customer'}</div>
              </div>
              <button onClick={handleRefresh} style={iconBtn} title="Refresh">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
              <button onClick={() => alerts.length > 0 ? alert('Alerts:\n\n' + alerts.map(a => `• ${a.title}`).join('\n')) : alert('No new alerts.')} style={iconBtn} title="Notifications">
                <div style={{ position: 'relative', display: 'flex' }}>
                  <span style={{ color: '#fff' }}>{ICONS.bell}</span>
                  {unread > 0 && <div style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', minWidth: '16px', height: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '800', color: '#fff', padding: '0 3px' }}>{unread}</div>}
                </div>
              </button>
            </div>

            {/* Balance card */}
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginBottom: '6px' }}>Available Balance</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
                  {hidden ? '₵ ••••••' : fmtMoney(customer?.balance ?? 0)}
                </div>
                <button onClick={() => setHidden(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  {hidden ? ICONS.eyeOff : ICONS.eye}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Telecel Cash · {customer?.phone}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(74,222,128,0.15)', borderRadius: '999px', padding: '3px 8px' }}>
                  {ICONS.shield}
                  <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: '600' }}>Trust {customer?.trustScore ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <div style={{ background: C.surface, display: 'flex', padding: '20px 8px', borderBottom: `1px solid ${C.border}` }}>
          {ACTIONS.map(({ label, icon, action }) => (
            <button key={label} onClick={action}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Alerts ─────────────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div style={{ background: C.surface, marginTop: '8px', padding: '20px 20px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>Alerts</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: C.successLight, borderRadius: '999px', padding: '3px 8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '3px', background: C.success }} />
                <span style={{ fontSize: '10px', fontWeight: '800', color: C.success }}>LIVE</span>
              </div>
            </div>
            {alerts.map(a => {
              const sev = { critical:{ bg:C.dangerLight, color:C.danger }, high:{ bg:'#FFF3E0', color:C.warning }, medium:{ bg:'#FFF3E0', color:C.warning }, low:{ bg:C.primaryLight, color:C.primary } }
              const sv = sev[a.severity] ?? sev.low
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}`, marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: sv.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px' }}>⚠</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: C.text, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: '12px', color: C.textSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.description}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: C.textMuted, flexShrink: 0 }}>{timeAgo(a.created_at)}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Recent transactions ─────────────────────────────────────────── */}
        <div style={{ background: C.surface, marginTop: '8px', padding: '20px 20px 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>Recent Transactions</div>
            <button onClick={() => navigate('/app/transactions')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: C.primary, fontWeight: '600', fontFamily: 'inherit' }}>
              See all
            </button>
          </div>

          {txLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: C.textMuted, fontSize: '14px' }}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', gap: '8px' }}>
              <span style={{ fontSize: '32px', color: C.textMuted }}>↔</span>
              <div style={{ fontSize: '14px', color: C.textMuted }}>No transactions yet</div>
            </div>
          ) : (
            transactions.map((tx, i) => {
              const st = statusColor(tx.status)
              return (
                <button key={tx.id} onClick={() => navigate(`/app/transactions/${tx.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: i < transactions.length - 1 ? `1px solid ${C.border}` : 'none', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {ICONS.swap}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: C.text, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.recipient_name ?? tx.recipient_phone}</div>
                    <div style={{ fontSize: '12px', color: C.textSub }}>{tx.category} · {timeAgo(tx.created_at)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>−{fmtMoney(tx.amount)}</div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: st.color, background: st.bg, padding: '2px 7px', borderRadius: '6px', display: 'inline-block' }}>
                      {tx.status === 'completed' ? 'Sent' : tx.status === 'review' ? 'Review' : 'Blocked'}
                    </div>
                  </div>
                </button>
              )
            })
          )}
          <div style={{ height: '16px' }} />
        </div>

        <div style={{ height: '80px' }} />
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {modal === 'receive' && <ReceiveModal customer={customer} onClose={() => setModal(null)} />}
      {modal === 'airtime' && <AirtimeModal customer={customer} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />}
      {modal === 'paybill' && <PayBillModal customer={customer} onClose={() => setModal(null)} onSuccess={handleModalSuccess} />}

      <CustomerBottomNav />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const iconBtn = { position: 'relative', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
