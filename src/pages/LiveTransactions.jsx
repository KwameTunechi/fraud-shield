import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, RefreshCw, Clock, MapPin, Filter } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

const transactions = [
  { id: 'TXN-2024-001', time: '14:23:45', customer: 'Kwame Mensah', phone: '+233 24 567 8901', amount: '₵1,250.00', location: 'Accra, Ghana', risk: 12, status: 'Safe', category: 'CUSTOMER' },
  { id: 'TXN-2024-002', time: '14:23:42', customer: 'Ama Asante', phone: '+233 20 345 6789', amount: '₵850.50', location: 'Kumasi, Ghana', risk: 8, status: 'Safe', category: 'CUSTOMER' },
  { id: 'TXN-2024-003', time: '14:23:38', customer: 'Kofi Owusu', phone: '+233 55 123 4567', amount: '₵3,500.00', location: 'London, UK', risk: 45, status: 'Review', category: 'AGENT' },
  { id: 'TXN-2024-004', time: '14:23:35', customer: 'Efua Boateng', phone: '+233 26 789 0123', amount: '₵450.00', location: 'Takoradi, Ghana', risk: 15, status: 'Safe', category: 'CUSTOMER' },
  { id: 'TXN-2024-005', time: '14:23:30', customer: 'Yaw Agyeman', phone: '+233 24 111 2233', amount: '₵8,900.00', location: 'New York, USA', risk: 87, status: 'Blocked', category: 'CUSTOMER' },
  { id: 'TXN-2024-006', time: '14:23:25', customer: 'Abena Osei', phone: '+233 27 456 7890', amount: '₵2,100.00', location: 'Tamale, Ghana', risk: 18, status: 'Safe', category: 'AGENT' },
  { id: 'TXN-2024-007', time: '14:23:20', customer: 'Kwesi Darko', phone: '+233 20 987 6543', amount: '₵5,600.00', location: 'Lagos, Nigeria', risk: 52, status: 'Review', category: 'CUSTOMER' },
  { id: 'TXN-2024-008', time: '14:23:15', customer: 'Akosua Appiah', phone: '+233 24 333 4444', amount: '₵680.00', location: 'Accra, Ghana', risk: 10, status: 'Safe', category: 'CUSTOMER' },
]

const statusStyle = (s) => s === 'Safe' ? { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' } : s === 'Review' ? { color: '#d97706', bg: '#fffbeb', border: '#fde68a' } : { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
const riskColor = (r) => r < 30 ? '#16a34a' : r < 60 ? '#d97706' : '#dc2626'
const catColor = (c) => c === 'AGENT' ? '#8b5cf6' : '#3b82f6'

export default function LiveTransactions() {
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  const pad = (n) => String(n).padStart(2, '0')
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 60%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '12px' }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ color: '#fff', fontSize: 'clamp(15px,3vw,22px)', fontWeight: 800, margin: 0 }}>Live Transactions Monitoring</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#22c55e', padding: '2px 8px', borderRadius: '999px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>LIVE</span>
                </div>
              </div>
              <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>Real-time transaction monitoring & fraud detection</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', justifyContent: 'flex-end' }}>
              <Clock size={14} color="#a5b4fc" />
              <span style={{ fontSize: 'clamp(16px,3vw,22px)', fontWeight: 800 }}>{timeStr}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#a5b4fc' }}>{dateStr}</div>
          </div>
        </div>
      </div>

      <div className="page-pad">
        <div className="rg-4" style={{ marginBottom: '18px' }}>
          {[
            { label: 'Total Transactions', value: '1,247', sub: '↑ 12% from last hour', subColor: '#22c55e', icon: RefreshCw, ic: '#3b82f6' },
            { label: 'Safe Transactions', value: '1,189', sub: '95.3% success rate', subColor: '#94a3b8', icon: Activity, ic: '#22c55e' },
            { label: 'Under Review', value: '42', sub: '3.4% flagged', subColor: '#94a3b8', icon: Clock, ic: '#f59e0b' },
            { label: 'Blocked', value: '16', sub: '1.3% prevented', subColor: '#94a3b8', icon: Filter, ic: '#ef4444' },
          ].map(({ label, value, sub, subColor, icon: Icon, ic }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{label}</span>
                <Icon size={15} color={ic} />
              </div>
              <div style={{ fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: subColor, fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={13} color="#94a3b8" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f6ef7', background: '#eff0ff', padding: '3px 10px', borderRadius: '7px' }}>All Locations</span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>All Risk Levels</span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>All Categories</span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Amount Range: ₵0 – ₵10,000+</span>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f8fafc' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Transaction Stream</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Live updates every second</span>
            </div>
          </div>
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Transaction ID', 'Time', 'Customer', 'Phone', 'Amount', 'Location', 'Risk Score', 'Status', 'Category'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, i) => {
                  const st = statusStyle(txn.status)
                  return (
                    <tr key={txn.id} style={{ borderBottom: i < transactions.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{txn.id}</td>
                      <td style={{ padding: '13px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} color="#94a3b8" />{txn.time}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{txn.customer}</td>
                      <td style={{ padding: '13px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{txn.phone}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{txn.amount}</td>
                      <td style={{ padding: '13px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} color="#94a3b8" />{txn.location}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: riskColor(txn.risk), whiteSpace: 'nowrap' }}>{txn.risk}%</td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: '8px' }}>{txn.status}</span>
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: catColor(txn.category) }}>{txn.category}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
