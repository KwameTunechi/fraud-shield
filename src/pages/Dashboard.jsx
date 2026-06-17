import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Brain, Fingerprint, Link2, Clock, ShieldCheck, Activity, Ban, BarChart2, Users } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtAmount(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function fmtRelative(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  return `${Math.floor(h / 24)}d ago`
}

function riskLabel(score) { return score < 30 ? 'Low' : score < 70 ? 'Medium' : 'High' }
function riskHex(score)   { return score < 30 ? '#22c55e' : score < 70 ? '#f59e0b' : '#ef4444' }
function statusHex(s)     { return s === 'completed' ? '#16a34a' : s === 'review' ? '#d97706' : '#dc2626' }
function statusLabel(s)   { return s === 'completed' ? 'Safe' : s === 'review' ? 'Review' : 'Blocked' }
function txEmoji(cat)     { return cat === 'MERCHANT' ? '🛍️' : cat === 'AGENT' ? '🏦' : '💸' }

const SEVERITY_STYLE = {
  critical: { bg: '#fef2f2', border: '#fecaca', iconBg: '#ef4444', titleColor: '#dc2626', Icon: AlertTriangle },
  high:     { bg: '#fff7ed', border: '#fed7aa', iconBg: '#f97316', titleColor: '#c2410c', Icon: AlertTriangle },
  medium:   { bg: '#fffbeb', border: '#fde68a', iconBg: '#f59e0b', titleColor: '#d97706', Icon: AlertCircle },
  low:      { bg: '#eff6ff', border: '#bfdbfe', iconBg: '#3b82f6', titleColor: '#2563eb', Icon: CheckCircle },
}


// ─── right panel ─────────────────────────────────────────────────────────────

function RightPanel({ transactions, loading }) {
  const navigate = useNavigate()
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Recent Transactions</span>
        <button onClick={() => navigate('/dashboard/transactions')} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#4f6ef7', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View All</button>
      </div>
      {loading ? <Loading /> : transactions.length === 0 ? (
        <EmptyState message="No transactions yet." icon="💳" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {transactions.map((tx) => {
            const sLabel = statusLabel(tx.status)
            const sColor = statusHex(tx.status)
            const dColor = riskHex(tx.risk_score)
            return (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {txEmoji(tx.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{tx.recipient_phone}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', flexShrink: 0, marginLeft: '6px' }}>{fmtAmount(tx.amount)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{tx.category}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{fmtRelative(tx.created_at)}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>· Risk: <strong style={{ color: riskHex(tx.risk_score) }}>{tx.risk_score}%</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, color: sColor }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dColor, display: 'inline-block' }} />
                      {sLabel}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { admin } = useAuth()

  const { data: alertData,   loading: alertLoading } = useApi('/api/alerts?limit=3')
  const { data: txData,      loading: txLoading    } = useApi('/api/transactions?limit=5')
  const { data: summaryData                        } = useApi('/api/risk/summary')
  const { data: aiData                             } = useApi('/api/ai-config')
  const { data: chainData                          } = useApi('/api/blockchain/verify')

  const alerts       = alertData?.alerts       ?? []
  const transactions = txData?.transactions    ?? []
  const liveTxns     = transactions.slice(0, 4)

  const aiActive     = aiData ? Object.values(aiData).some(Boolean) : null
  const chainOk      = chainData?.ok ?? null
  const mfaSecure    = admin?.mfaEnabled ?? admin?.mfa_enabled ?? null

  const statusCards = [
    {
      Icon: Brain,
      label: 'AI Detection',
      value: aiActive === null ? '…' : aiActive ? 'Active' : 'Disabled',
      bg: '#faf5ff',
      iconGrad: ['#a855f7', '#ec4899'],
      valueColor: aiActive === false ? '#ef4444' : '#9333ea',
    },
    {
      Icon: Fingerprint,
      label: 'MFA Enabled',
      value: mfaSecure === null ? '…' : mfaSecure ? 'Secure' : 'Not Set',
      bg: '#eff6ff',
      iconGrad: ['#3b82f6', '#6366f1'],
      valueColor: mfaSecure === false ? '#ef4444' : '#2563eb',
    },
    {
      Icon: Link2,
      label: 'Blockchain',
      value: chainOk === null ? '…' : chainOk ? 'Verified' : 'Error',
      bg: '#f0fdf4',
      iconGrad: ['#14b8a6', '#22c55e'],
      valueColor: chainOk === false ? '#ef4444' : '#059669',
    },
  ]

  const summaryCards = [
    { Icon: Activity, label: 'Txns (24h)',   value: summaryData?.tx_24h      ?? '…', color: '#4f6ef7' },
    { Icon: Ban,      label: 'Blocked',      value: summaryData?.blocked_24h ?? '…', color: '#ef4444' },
    { Icon: Bell,     label: 'Open Alerts',  value: summaryData?.open_alerts ?? '…', color: '#f59e0b' },
    { Icon: Users,    label: 'Active Users', value: summaryData?.active_users ?? '…', color: '#22c55e' },
  ]

  return (
    <DashboardLayout rightPanel={<RightPanel transactions={transactions} loading={txLoading} />}>
      {/* Header banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)', padding: '24px 28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 800 }}>Fraud Shield</div>
            <div style={{ color: '#a5b4fc', fontSize: '13px', marginTop: '2px' }}>AI-Powered Protection</div>
          </div>
          <div onClick={() => navigate('/dashboard/alerts')} style={{ position: 'relative', cursor: 'pointer', padding: '6px' }}>
            <Bell size={20} color="#fff" />
            {alerts.some(a => !a.read) && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'block' }} />
            )}
          </div>
        </div>

        {/* User card */}
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '16px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(99,102,241,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
              {admin?.fullName?.slice(0, 2).toUpperCase() ?? 'AD'}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{admin?.fullName ?? 'Administrator'}</div>
              <div style={{ color: '#a5b4fc', fontSize: '12px', marginTop: '1px' }}>{admin?.email ?? ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                <ShieldCheck size={12} color="#93c5fd" />
                <span style={{ color: '#93c5fd', fontSize: '12px' }}>Role: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{admin?.role ?? 'admin'}</strong></span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', padding: '5px 12px', borderRadius: '999px' }}>
            <CheckCircle size={13} color="#4ade80" />
            <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600 }}>Verified</span>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="rg-3" style={{ padding: '20px 24px', marginTop: '-6px' }}>
        {statusCards.map(({ Icon, label, value, bg, iconGrad, valueColor }) => (
          <div key={label} style={{ background: bg, borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `linear-gradient(135deg, ${iconGrad[0]}, ${iconGrad[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <Icon size={20} color="#fff" />
            </div>
            <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: valueColor, marginTop: '3px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="rg-4" style={{ padding: '0 24px 20px' }}>
        {summaryCards.map(({ Icon, label, value, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="page-pad" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Real-Time Alerts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Real-Time Alerts</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Live</span>
            </div>
          </div>
          {alertLoading ? <Loading /> : alerts.length === 0 ? (
            <EmptyState message="No alerts. System is clean." icon="✅" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.map((alert) => {
                const s = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.low
                const { Icon } = s
                return (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: s.bg, border: `1px solid ${s.border}` }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={17} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: s.titleColor }}>{alert.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.description}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>{fmtRelative(alert.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Live Transactions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Live Transactions</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#dcfce7', padding: '2px 8px', borderRadius: '999px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
            <button onClick={() => navigate('/dashboard/transactions')} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#4f6ef7', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View All →</button>
          </div>
          {txLoading ? <Loading /> : liveTxns.length === 0 ? (
            <EmptyState message="No transactions yet." icon="📊" />
          ) : (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              {liveTxns.map((tx, i) => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderBottom: i < liveTxns.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp size={16} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{tx.reference}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#94a3b8' }}><Clock size={11} /> {new Date(tx.created_at).toLocaleTimeString('en-US', { hour12: false })}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{fmtAmount(tx.amount)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '3px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: riskHex(tx.risk_score) }}>{riskLabel(tx.risk_score)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: statusHex(tx.status) }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: riskHex(tx.risk_score), display: 'inline-block' }} />
                        {statusLabel(tx.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
