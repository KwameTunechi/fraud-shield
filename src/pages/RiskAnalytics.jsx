import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, TrendingDown, AlertTriangle, Shield, TrendingUp } from 'lucide-react'
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import { useApi } from '../hooks/useApi'

const DAYS       = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CAT_COLORS = { P2P: '#6366f1', MERCHANT: '#3b82f6', AGENT: '#14b8a6' }

export default function RiskAnalytics() {
  const navigate = useNavigate()
  const [range, setRange] = useState('30d')

  const { data: analytics, loading: aLoading } = useApi('/api/risk/analytics')
  const { data: summary,   loading: sLoading } = useApi('/api/risk/summary')

  // Map byDay → AreaChart (risk over time)
  const anomalyData = (analytics?.byDay ?? []).map(d => ({
    time:  new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Number(d.avg_risk) || 0,
  }))

  // Map last 7 byDay entries → LineChart
  const trendData = (analytics?.byDay ?? []).slice(-7).map(d => ({
    day:  DAYS[new Date(d.day).getDay()],
    risk: Number(d.avg_risk) || 0,
  }))

  // Map byCategory → PieChart
  const threatCategories = (analytics?.byCategory ?? []).map(d => ({
    name:  d.category,
    value: parseInt(d.total) || 0,
    color: CAT_COLORS[d.category] ?? '#8b5cf6',
  }))
  const totalThreats = threatCategories.reduce((s, c) => s + c.value, 0)

  const avgRisk       = Number(summary?.avg_risk_7d) || 0
  const riskLevel     = avgRisk < 30 ? 'Low' : avgRisk < 70 ? 'Medium' : 'High'
  const riskLevelColor= avgRisk < 30 ? '#16a34a' : avgRisk < 70 ? '#d97706' : '#dc2626'

  const stats = [
    { icon: TrendingDown,  label: 'Current Risk',       value: riskLevel,                          sub: `Avg ${avgRisk}% over 7 days`,  subColor: riskLevelColor, iconBg: '#dcfce7', iconColor: '#16a34a' },
    { icon: AlertTriangle, label: 'Blocked (24h)',       value: String(summary?.blocked_24h ?? '—'), sub: 'Transactions blocked',        subColor: '#94a3b8',      iconBg: '#fef3c7', iconColor: '#f59e0b' },
    { icon: Shield,        label: 'Transactions (24h)', value: String(summary?.tx_24h ?? '—'),      sub: 'Total in last 24 hours',      subColor: '#94a3b8',      iconBg: '#dbeafe', iconColor: '#3b82f6' },
    { icon: TrendingUp,    label: 'Open Alerts',        value: String(summary?.open_alerts ?? '—'), sub: 'Unresolved incidents',        subColor: '#8b5cf6',      iconBg: '#ede9fe', iconColor: '#7c3aed' },
  ]

  const handleExport = () => {
    const rows = [
      ['Risk Over Time'], ['Time', 'Avg Risk'], ...anomalyData.map(d => [d.time, d.score]),
      [], ['7-Day Trend'], ['Day', 'Risk'], ...trendData.map(d => [d.day, d.risk]),
      [], ['By Category'], ['Category', 'Count'], ...threatCategories.map(d => [d.name, d.value]),
    ]
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fraudshield-risk-analytics.csv' })
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {['7d', '30d', '90d'].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{ background: range === r ? '#fff' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, color: range === r ? '#1e3a8a' : '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{r}</button>
            ))}
            <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: '#1e3a8a', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              <Download size={14} /> <span className="hide-mobile">Export</span>
            </button>
          </div>
        </div>
        <h1 style={{ color: '#fff', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, margin: '0 0 4px' }}>Risk Analytics</h1>
        <p style={{ color: '#a5b4fc', fontSize: '13px', margin: 0 }}>Real-time threat assessment &amp; monitoring</p>
      </div>

      <div className="page-pad">
        {/* Stat cards */}
        <div className="rg-4" style={{ marginBottom: '20px' }}>
          {stats.map(({ icon: Icon, label, value, sub, subColor, iconBg, iconColor }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Icon size={17} color={iconColor} />
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: label === 'Current Risk' ? riskLevelColor : '#0f172a', marginBottom: '3px' }}>{sLoading ? '…' : value}</div>
              <div style={{ fontSize: '11px', color: subColor, fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>

        {aLoading ? <Loading message="Loading analytics…" /> : (
          <>
            <div className="rg-2" style={{ marginBottom: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Avg Risk Score Over Time</h3>
                {anomalyData.length === 0
                  ? <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>No data yet — send some transactions.</p>
                  : (
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={anomalyData}>
                        <defs>
                          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
              </div>

              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Transactions by Category</h3>
                {threatCategories.length === 0
                  ? <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>No data yet.</p>
                  : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={threatCategories} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" strokeWidth={0}>
                              {threatCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{totalThreats}</div>
                          <div style={{ fontSize: '9px', color: '#94a3b8' }}>Total</div>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {threatCategories.map((cat, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{cat.name}: {cat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>7-Day Risk Trend</h3>
              {trendData.length === 0
                ? <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>No data yet.</p>
                : (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
