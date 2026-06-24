import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Send, ArrowDownLeft, Phone, Receipt, LogOut, RefreshCw } from 'lucide-react'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useCustomerApi } from '../../hooks/useCustomerApi'

const P   = '#1652F0'
const PL  = '#EBF0FE'

function fmtMoney(n) {
  return '₵' + Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })
}

function fmtRelative(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

function statusColor(s) {
  if (s === 'completed') return { color: '#00875A', bg: '#E3F5F0' }
  if (s === 'review')    return { color: '#FF8B00', bg: '#FFF3E0' }
  return                         { color: '#DE350B', bg: '#FFEBE6' }
}

function riskColor(score) {
  if (score < 30) return '#00875A'
  if (score < 70) return '#FF8B00'
  return '#DE350B'
}

export default function CustomerHome() {
  const navigate = useNavigate()
  const { customer, signOut, refreshCustomer } = useCustomerAuth()
  const [hidden,     setHidden]     = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { data: txData, loading: txLoading, reload: reloadTx } = useCustomerApi('/api/transactions?limit=5')
  const transactions = txData?.transactions ?? []

  const initials = (customer?.fullName ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([refreshCustomer(), reloadTx()])
    setRefreshing(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/app/signin', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #EBF0FE 0%, #f5f7fa 50%)' }}>
      {/* Blue header */}
      <div style={{ background: P, padding: '0 0 48px' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', padding: '20px 20px 0' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px' }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>Good day</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{customer?.fullName ?? 'Customer'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleRefresh} style={iconBtn} title="Refresh">
                <RefreshCw size={16} color="#fff" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <button onClick={handleSignOut} style={iconBtn} title="Sign out">
                <LogOut size={16} color="#fff" />
              </button>
            </div>
          </div>

          {/* Balance card */}
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginBottom: '6px' }}>Available Balance</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                {hidden ? '₵ ••••••' : fmtMoney(customer?.balance ?? 0)}
              </div>
              <button onClick={() => setHidden(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex' }}>
                {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Telecel Cash · {customer?.phone}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(74,222,128,0.15)', borderRadius: '999px', padding: '3px 8px' }}>
                <Shield size={11} color="#4ade80" />
                <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>Trust {customer?.trustScore ?? 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '440px', margin: '-28px auto 0', padding: '0 16px 48px' }}>

        {/* Quick actions */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 8px', marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex' }}>
          {[
            { label: 'Send',     Icon: Send,         action: () => navigate('/app/send') },
            { label: 'Receive',  Icon: ArrowDownLeft,action: () => alert(`Share your number:\n${customer?.phone}`) },
            { label: 'Airtime',  Icon: Phone,         action: () => alert('Coming soon.') },
            { label: 'Pay Bill', Icon: Receipt,       action: () => alert('Coming soon.') },
          ].map(({ label, Icon, action }) => (
            <button key={label} onClick={action}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: PL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={P} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#0d1421', fontFamily: 'Inter, sans-serif' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Recent transactions */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0d1421' }}>Recent Transactions</div>
            <button onClick={() => navigate('/app/transactions')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: P, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              See all
            </button>
          </div>

          {txLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>No transactions yet</div>
          ) : (
            transactions.map((tx, i) => {
              const st = statusColor(tx.status)
              return (
                <div key={tx.id} onClick={() => navigate(`/app/transactions/${tx.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: i < transactions.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: PL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Send size={16} color={P} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d1421', marginBottom: '2px' }}>{tx.recipient_name ?? tx.recipient_phone}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{tx.sender_name ?? 'You'} → {tx.recipient_phone} · {fmtRelative(tx.created_at)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d1421', marginBottom: '3px' }}>−{fmtMoney(tx.amount)}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: st.color, background: st.bg, padding: '2px 7px', borderRadius: '5px', display: 'inline-block' }}>{tx.status}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const iconBtn = {
  width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)',
  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
