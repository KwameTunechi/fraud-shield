import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, CheckCircle, Clock, AlertTriangle, Link, TrendingUp, Ban, Eye } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import { useApi } from '../hooks/useApi'

const fmtMoney = (n) => '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
const fmtDate  = (ts) => new Date(ts).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function riskStyle(score) {
  if (score < 30) return { label: 'Low',    color: '#00875A', bg: '#E3F5F0' }
  if (score < 70) return { label: 'Medium', color: '#FF8B00', bg: '#FFF3E0' }
  return              { label: 'High',   color: '#DE350B', bg: '#FFEBE6' }
}

function statusStyle(s) {
  if (s === 'completed') return { label: 'Completed',    color: '#00875A', bg: '#E3F5F0' }
  if (s === 'review')    return { label: 'Under Review', color: '#FF8B00', bg: '#FFF3E0' }
  return                        { label: 'Blocked',      color: '#DE350B', bg: '#FFEBE6' }
}

export default function CustomerProfile() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { data, loading } = useApi(`/api/customers/${id}`)

  if (loading) return <DashboardLayout><Loading /></DashboardLayout>
  if (!data?.customer) return <DashboardLayout><p style={{ padding: 24, color: '#64748b' }}>Customer not found.</p></DashboardLayout>

  const { customer: c, transactions = [], alerts = [], stats = {} } = data
  const initials = (c.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const trustColor = c.trust_score >= 80 ? '#00875A' : c.trust_score >= 60 ? '#FF8B00' : '#DE350B'

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0D1421 0%, #1652F0 100%)', padding: '24px 24px 32px' }}>
        <button
          onClick={() => navigate('/dashboard/customers')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}
        >
          <ArrowLeft size={15} /> Back to Customers
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#1652F0', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{c.full_name}</h1>
            <div style={{ color: '#a5b4fc', fontSize: 13 }}>{c.phone_number} · ID: {c.id.slice(0, 8)}…</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {c.status === 'active'
              ? <span style={{ background: '#00875A', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>Active</span>
              : <span style={{ background: '#FF8B00', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>Inactive</span>
            }
          </div>
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { label: 'Balance',         value: fmtMoney(c.balance),          color: '#1652F0' },
            { label: 'Trust Score',     value: `${c.trust_score}%`,          color: trustColor },
            { label: 'Total Txns',      value: stats.total_txns ?? 0,        color: '#0D1421' },
            { label: 'Blocked',         value: stats.blocked_txns ?? 0,      color: '#DE350B' },
            { label: 'Under Review',    value: stats.review_txns ?? 0,       color: '#FF8B00' },
            { label: 'Avg Risk Score',  value: `${stats.avg_risk ?? 0}%`,    color: stats.avg_risk >= 70 ? '#DE350B' : stats.avg_risk >= 30 ? '#FF8B00' : '#00875A' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8ECEF' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color, marginBottom: 3 }}>{value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8ECEF', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>Phone</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0D1421' }}>{c.phone_number}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>Joined</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0D1421' }}>{fmtDate(c.created_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>MFA Status</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.mfa_enabled ? '#00875A' : '#DE350B' }}>{c.mfa_enabled ? 'Enabled' : 'Not Set'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>Total Spent</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0D1421' }}>{fmtMoney(stats.total_spent ?? 0)}</div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8ECEF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <AlertTriangle size={16} color="#FF8B00" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0D1421' }}>Alerts ({alerts.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: '#FFF3E0', borderRadius: 10, border: '1px solid #FFE0B2' }}>
                  <AlertTriangle size={14} color="#FF8B00" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1421' }}>{a.type?.replace(/_/g, ' ').toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.message}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{fmtDate(a.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #E8ECEF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={16} color="#1652F0" />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0D1421' }}>Transactions ({transactions.length})</span>
          </div>

          {transactions.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No transactions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.9fr 0.7fr 0.7fr', gap: 8, padding: '8px 12px', background: '#F5F7FA', borderRadius: 8, marginBottom: 4 }}>
                {['Reference', 'Amount', 'Status', 'Risk', 'Date'].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</div>
                ))}
              </div>
              {transactions.map(tx => {
                const st  = statusStyle(tx.status)
                const rsk = riskStyle(tx.risk_score)
                return (
                  <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.9fr 0.7fr 0.7fr', gap: 8, padding: '10px 12px', borderRadius: 8, borderBottom: '1px solid #F5F7FA', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0D1421', fontFamily: 'monospace' }}>{tx.reference}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>→ {tx.recipient_phone}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1421' }}>{fmtMoney(tx.amount)}</div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', borderRadius: 6 }}>{st.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 28, height: 5, background: '#E8ECEF', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${tx.risk_score}%`, background: rsk.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: rsk.color }}>{tx.risk_score}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtDate(tx.created_at)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
