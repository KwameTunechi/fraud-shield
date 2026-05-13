import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Filter, AlertTriangle, CheckCircle, AlertCircle, MapPin, Clock } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

const summaryStats = [
  { label: 'Active Alerts', value: '8', color: '#ef4444' },
  { label: 'Investigating', value: '12', color: '#f97316' },
  { label: 'Resolved Today', value: '45', color: '#22c55e' },
  { label: 'Critical', value: '3', color: '#ef4444' },
  { label: 'Blocked', value: '28', color: '#64748b' },
  { label: 'Verified', value: '156', color: '#3b82f6' },
]
const incidents = [
  { icon: AlertTriangle, iconBg: '#ef4444', bg: '#fef2f2', border: '#fecaca', title: 'Suspicious Login', status: 'Active', statusColor: '#ef4444', statusBg: '#fef2f2', desc: 'Multiple failed login attempts from IP 192.168.1.100', location: 'Dubai, UAE', time: '2 minutes ago' },
  { icon: AlertCircle, iconBg: '#f97316', bg: '#fff7ed', border: '#fed7aa', title: 'Unusual Transaction', status: 'Investigating', statusColor: '#f97316', statusBg: '#fff7ed', desc: 'Large transfer amount detected: $82,500.00', location: 'Lagos, Nigeria', time: '15 minutes ago' },
  { icon: AlertCircle, iconBg: '#eab308', bg: '#fefce8', border: '#fef08a', title: 'Account Lockout', status: 'Resolved', statusColor: '#16a34a', statusBg: '#f0fdf4', desc: 'User account locked after 5 failed attempts', location: 'Kumasi, Ghana', time: '1 hour ago' },
  { icon: CheckCircle, iconBg: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', title: 'Device Change', status: 'Verified', statusColor: '#3b82f6', statusBg: '#eff6ff', desc: 'New device detected for user account', location: 'Tokyo, Japan', time: '3 hours ago' },
  { icon: AlertTriangle, iconBg: '#ef4444', bg: '#fef2f2', border: '#fecaca', title: 'Brute Force Attack', status: 'Blocked', statusColor: '#6366f1', statusBg: '#eef2ff', desc: 'Automated attack detected on login endpoint', location: 'New York, USA', time: '5 hours ago' },
  { icon: AlertCircle, iconBg: '#f97316', bg: '#fff7ed', border: '#fed7aa', title: 'Unusual Location', status: 'Investigating', statusColor: '#f97316', statusBg: '#fff7ed', desc: 'Login from unrecognized country detected', location: 'London, UK', time: '7 hours ago' },
]

export default function AlertsIncidents() {
  const navigate = useNavigate()
  const [activeOnly, setActiveOnly] = useState(false)
  const displayed = activeOnly ? incidents.filter(i => i.status === 'Active' || i.status === 'Investigating') : incidents
  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => setActiveOnly(v => !v)} title={activeOnly ? 'Show all' : 'Active only'} style={{ background: activeOnly ? 'rgba(255,255,255,0.25)' : 'none', border: activeOnly ? '1px solid rgba(255,255,255,0.4)' : 'none', borderRadius: '8px', cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={18} color="#fff" />
            {activeOnly && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>Active</span>}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(18px,4vw,26px)', fontWeight: 800, margin: 0 }}>Alerts & Incidents</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ef4444', padding: '3px 10px', borderRadius: '999px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
        <p style={{ color: '#a5b4fc', fontSize: '13px', margin: '5px 0 0' }}>Real-time security notifications & threat detection</p>
      </div>

      <div className="page-pad">
        <div className="rg-6" style={{ marginBottom: '24px' }}>
          {summaryStats.map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '14px', padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color, marginBottom: '3px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Recent Incidents</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '999px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>Live Monitoring</span>
          </div>
        </div>

        <div className="rg-2">
          {displayed.map((inc, i) => {
            const Icon = inc.icon
            return (
              <div key={i} style={{ background: inc.bg, border: `1px solid ${inc.border}`, borderRadius: '16px', padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: inc.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={17} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{inc.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{inc.desc}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: inc.statusColor, background: inc.statusBg, padding: '3px 8px', borderRadius: '999px', flexShrink: 0, marginLeft: '8px' }}>{inc.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '46px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#94a3b8' }}><MapPin size={10} /> {inc.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#94a3b8' }}><Clock size={10} /> {inc.time}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
