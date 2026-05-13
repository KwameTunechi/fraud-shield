import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, TrendingDown, AlertTriangle, Shield, TrendingUp } from 'lucide-react'
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DashboardLayout from '../components/DashboardLayout'

const anomalyData = [
  { time: '00:00', score: 15 }, { time: '02:00', score: 12 }, { time: '04:00', score: 10 },
  { time: '06:00', score: 14 }, { time: '08:00', score: 22 }, { time: '10:00', score: 38 },
  { time: '12:00', score: 46 }, { time: '14:00', score: 40 }, { time: '16:00', score: 28 },
  { time: '18:00', score: 20 }, { time: '20:00', score: 16 },
]
const trendData = [
  { day: 'Mon', risk: 62 }, { day: 'Tue', risk: 60 }, { day: 'Wed', risk: 75 },
  { day: 'Thu', risk: 55 }, { day: 'Fri', risk: 40 }, { day: 'Sat', risk: 28 }, { day: 'Sun', risk: 32 },
]
const threatCategories = [
  { name: 'Phishing', value: 45, color: '#6366f1' },
  { name: 'Account Takeover', value: 32, color: '#3b82f6' },
  { name: 'Transaction Fraud', value: 28, color: '#14b8a6' },
  { name: 'Identity Theft', value: 15, color: '#8b5cf6' },
]
const stats = [
  { icon: TrendingDown, label: 'Current Risk', value: 'Low', sub: '↑ 12% from last week', subColor: '#22c55e', iconBg: '#dcfce7', iconColor: '#16a34a' },
  { icon: AlertTriangle, label: 'Threats Blocked', value: '32', sub: 'Last 24 hours', subColor: '#94a3b8', iconBg: '#fef3c7', iconColor: '#f59e0b' },
  { icon: Shield, label: 'Protected Assets', value: '1,248', sub: 'Total accounts', subColor: '#94a3b8', iconBg: '#dbeafe', iconColor: '#3b82f6' },
  { icon: TrendingUp, label: 'Detection Rate', value: '98.5%', sub: '↑ 2% this month', subColor: '#8b5cf6', iconBg: '#ede9fe', iconColor: '#7c3aed' },
]

export default function RiskAnalytics() {
  const navigate = useNavigate()

  const handleExport = () => {
    const rows = [
      ['Anomaly Detection Score'],
      ['Time', 'Score'],
      ...anomalyData.map(d => [d.time, d.score]),
      [],
      ['7-Day Risk Trend'],
      ['Day', 'Risk'],
      ...trendData.map(d => [d.day, d.risk]),
      [],
      ['Threats by Category'],
      ['Category', 'Count'],
      ...threatCategories.map(d => [d.name, d.value]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fraudshield-risk-analytics.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, color: '#1e3a8a', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Download size={14} /> <span className="hide-mobile">Export to Excel</span>
          </button>
        </div>
        <h1 style={{ color: '#fff', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, margin: '0 0 4px' }}>Risk Analytics</h1>
        <p style={{ color: '#a5b4fc', fontSize: '13px', margin: 0 }}>Real-time threat assessment & monitoring</p>
      </div>

      <div className="page-pad">
        <div className="rg-4" style={{ marginBottom: '20px' }}>
          {stats.map(({ icon: Icon, label, value, sub, subColor, iconBg, iconColor }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Icon size={17} color={iconColor} />
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, color: label === 'Current Risk' ? '#16a34a' : '#0f172a', marginBottom: '3px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: subColor, fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div className="rg-2" style={{ marginBottom: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Anomaly Detection Score</h3>
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
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 60]} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Threats by Category</h3>
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
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>120</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>Total Threats</div>
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
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>7-Day Risk Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 80]} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="risk" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  )
}
