import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCircle, AlertTriangle, AlertCircle, TrendingUp,
  Activity, Shield, Users, BarChart3, Link2, UserCog, Brain,
  Zap, ArrowUpRight
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtAmount(n) {
  return '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function fmtCompact(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

function riskLabel(score) { return score < 30 ? 'Low' : score < 70 ? 'Med' : 'High' }
function riskHex(score)   { return score < 30 ? '#22c55e' : score < 70 ? '#f59e0b' : '#ef4444' }
function statusHex(s)     { return s === 'completed' ? '#16a34a' : s === 'review' ? '#d97706' : '#dc2626' }
function statusLabel(s)   { return s === 'completed' ? 'Safe' : s === 'review' ? 'Review' : 'Blocked' }

const SEVERITY_STYLE = {
  critical: { bg: '#fef2f2', iconBg: '#ef4444', Icon: AlertTriangle },
  high:     { bg: '#fff7ed', iconBg: '#f97316', Icon: AlertTriangle },
  medium:   { bg: '#fffbeb', iconBg: '#f59e0b', Icon: AlertCircle },
  low:      { bg: '#eff6ff', iconBg: '#3b82f6', Icon: CheckCircle },
}

// Removed right panel - everything on main view now

// ─── main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { admin } = useAuth()

  const { data: summary, loading: summaryLoading } = useApi('/api/risk/summary')
  const { data: alertData, loading: alertLoading } = useApi('/api/alerts?limit=2')
  const { data: txData, loading: txLoading } = useApi('/api/transactions?limit=4')

  const alerts = alertData?.alerts ?? []
  const transactions = txData?.transactions ?? []

  // KPI Cards data
  const kpis = [
    { Icon: Activity, label: 'Transactions (24h)', value: summary?.transactionsLast24h ?? 0, color: '#4f6ef7', bg: '#eff6ff', gradient: 'linear-gradient(135deg, #4f6ef7, #6366f1)' },
    { Icon: Shield, label: 'Blocked (24h)', value: summary?.blockedLast24h ?? 0, color: '#ef4444', bg: '#fef2f2', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
    { Icon: Bell, label: 'Open Alerts', value: summary?.openAlerts ?? 0, color: '#f59e0b', bg: '#fffbeb', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { Icon: BarChart3, label: 'Avg Risk Score', value: summary?.averageRisk ?? 0, color: '#10b981', bg: '#f0fdf4', suffix: '%', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  ]

  return (
    <DashboardLayout>
      <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

        {/* Compact Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%)', padding: '16px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>Welcome, {admin?.fullName?.split(' ')[0] ?? 'Admin'}</div>
              <div style={{ color: '#a5b4fc', fontSize: '12px', marginTop: '2px' }}>Ghana's Leading Fraud Detection Platform</div>
            </div>
            <div onClick={() => navigate('/dashboard/alerts')} style={{ position: 'relative', cursor: 'pointer', padding: '8px 14px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={18} color="#fff" />
              {alerts.some(a => !a.read) && (
                <span style={{ position: 'absolute', top: '5px', right: '10px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'block' }} />
              )}
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{alerts.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content - Single Page Grid */}
        <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto 1fr 1fr', gap: '16px', maxHeight: 'calc(100vh - 90px)' }}>

          {/* KPI Cards - Row 1 */}
          {summaryLoading ? (
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '20px' }}><Loading /></div>
          ) : (
            kpis.map(({ Icon, label, value, color, bg, suffix, gradient }) => (
              <div key={label} style={{ background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: bg, borderRadius: '50%', transform: 'translate(40%, -40%)', opacity: 0.5 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      <Icon size={20} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div style={{ background: bg, padding: '4px 8px', borderRadius: '6px' }}>
                      <ArrowUpRight size={12} color={color} />
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{fmtCompact(value)}{suffix ?? ''}</div>
                </div>
              </div>
            ))
          )}

          {/* Alerts - Row 2, Span 2 columns */}
          <div style={{ gridColumn: 'span 2', gridRow: 'span 1', background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Recent Alerts</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>LIVE</span>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alertLoading ? <Loading /> : alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>✅ No alerts</div>
              ) : (
                alerts.map((alert) => {
                  const s = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.low
                  const { Icon } = s
                  return (
                    <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', background: s.bg }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.description}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Transactions - Row 2-3, Span 2 columns */}
          <div style={{ gridColumn: 'span 2', gridRow: 'span 2', background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Live Transactions</span>
              <button onClick={() => navigate('/dashboard/transactions')} style={{ background: 'none', border: 'none', fontSize: '11px', color: '#4f6ef7', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View All →</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {txLoading ? <Loading /> : transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>📊 No transactions</div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TrendingUp size={14} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{tx.reference}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{tx.recipient_phone}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{fmtAmount(tx.amount)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: riskHex(tx.risk_score) }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: statusHex(tx.status) }}>{statusLabel(tx.status)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions - Row 3, Span 2 columns */}
          <div style={{ gridColumn: 'span 2', background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={16} color="#f59e0b" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Quick Actions</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <button onClick={() => navigate('/dashboard/risk')} style={{ padding: '14px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={16} color="#fff" />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>Risk Analytics</div>
              </button>
              <button onClick={() => navigate('/dashboard/blockchain')} style={{ padding: '14px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Link2 size={16} color="#fff" />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>Blockchain</div>
              </button>
              <button onClick={() => navigate('/dashboard/customers')} style={{ padding: '14px', background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)', border: '1px solid #e9d5ff', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #a855f7, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="#fff" />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b21a8' }}>Customers</div>
              </button>
              <button onClick={() => navigate('/dashboard/ai-config')} style={{ padding: '14px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1px solid #fed7aa', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={16} color="#fff" />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#9a3412' }}>AI Config</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
