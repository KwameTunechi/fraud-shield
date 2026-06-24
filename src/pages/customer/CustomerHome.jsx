import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/CustomerLayout'
import CustomerBottomNav from '../../components/CustomerBottomNav'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useCustomerApi } from '../../hooks/useCustomerApi'

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
}

export default function CustomerHome() {
  const navigate = useNavigate()
  const { customer, signOut, refreshCustomer } = useCustomerAuth()
  const [hidden,     setHidden]     = useState(false)
  const [refreshing, setRefreshing] = useState(false)

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

  const ACTIONS = [
    { label: 'Send',     icon: ICONS.send,    action: () => navigate('/app/send') },
    { label: 'Receive',  icon: ICONS.receive,  action: () => alert(`Share your number:\n${customer?.phone}`) },
    { label: 'Airtime',  icon: ICONS.airtime,  action: () => alert('Coming soon.') },
    { label: 'Pay Bill', icon: ICONS.bill,     action: () => alert('Coming soon.') },
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

      <CustomerBottomNav />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const iconBtn = { position: 'relative', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
