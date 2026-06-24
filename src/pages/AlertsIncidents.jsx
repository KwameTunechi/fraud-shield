import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Filter, AlertTriangle, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { useApi } from '../hooks/useApi'
import { api } from '../api/client'

const SEVERITY = {
  critical: { iconBg: '#ef4444', bg: '#fef2f2', border: '#fecaca', Icon: AlertTriangle },
  high:     { iconBg: '#f97316', bg: '#fff7ed', border: '#fed7aa', Icon: AlertTriangle },
  medium:   { iconBg: '#eab308', bg: '#fefce8', border: '#fef08a', Icon: AlertCircle  },
  low:      { iconBg: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', Icon: CheckCircle  },
}

function statusBadge(alert) {
  if (alert.resolved) return { label: 'Resolved',    color: '#16a34a', bg: '#f0fdf4' }
  if (alert.read)     return { label: 'Investigating', color: '#f97316', bg: '#fff7ed' }
  if (alert.severity === 'critical' || alert.severity === 'high')
                      return { label: 'Active',      color: '#ef4444', bg: '#fef2f2' }
  return              { label: 'Active',             color: '#f97316', bg: '#fff7ed' }
}

function fmtRelative(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export default function AlertsIncidents() {
  const navigate = useNavigate()
  const [activeOnly, setActiveOnly] = useState(false)

  const { data, loading, reload } = useApi('/api/alerts?limit=50')
  const alerts = data?.alerts ?? []

  const displayed = activeOnly
    ? alerts.filter(a => !a.resolved)
    : alerts

  // Computed summary stats
  const activeCount   = alerts.filter(a => !a.read && !a.resolved).length
  const investCount   = alerts.filter(a =>  a.read && !a.resolved).length
  const resolvedToday = alerts.filter(a => {
    if (!a.resolved) return false
    return Date.now() - new Date(a.resolved_at ?? a.created_at).getTime() < 86400000
  }).length
  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const blockedCount  = alerts.filter(a => a.resolved).length
  const verifiedCount = alerts.filter(a => a.read).length

  const summaryStats = [
    { label: 'Active Alerts',   value: activeCount,   color: '#ef4444' },
    { label: 'Investigating',   value: investCount,   color: '#f97316' },
    { label: 'Resolved Today',  value: resolvedToday, color: '#22c55e' },
    { label: 'Critical',        value: criticalCount, color: '#ef4444' },
    { label: 'Resolved',        value: blockedCount,  color: '#64748b' },
    { label: 'Acknowledged',    value: verifiedCount, color: '#3b82f6' },
  ]

  async function markAsRead(id) {
    await api.put(`/api/alerts/${id}/read`)
    reload()
  }

  async function resolve(id) {
    await api.put(`/api/alerts/${id}/resolve`)
    reload()
  }

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => setActiveOnly(v => !v)} style={{ background: activeOnly ? 'rgba(255,255,255,0.25)' : 'none', border: activeOnly ? '1px solid rgba(255,255,255,0.4)' : 'none', borderRadius: '8px', cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={18} color="#fff" />
            {activeOnly && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>Active only</span>}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(18px,4vw,26px)', fontWeight: 800, margin: 0 }}>Alerts &amp; Incidents</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ef4444', padding: '3px 10px', borderRadius: '999px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
        <p style={{ color: '#a5b4fc', fontSize: '13px', margin: '5px 0 0' }}>Real-time security notifications &amp; threat detection</p>
      </div>

      <div className="page-pad">
        {/* Summary stats */}
        <div className="rg-6" style={{ marginBottom: '24px' }}>
          {summaryStats.map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '14px', padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color, marginBottom: '3px' }}>{loading ? '—' : value}</div>
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

        {loading ? <Loading /> : displayed.length === 0 ? (
          <EmptyState message={activeOnly ? 'No active alerts.' : 'No alerts yet.'} icon="✅" />
        ) : (
          <div className="rg-2">
            {displayed.map((alert) => {
              const s = SEVERITY[alert.severity] ?? SEVERITY.low
              const badge = statusBadge(alert)
              const { Icon } = s
              return (
                <div key={alert.id}
                  onClick={() => navigate(`/dashboard/alerts/${alert.id}`, { state: { alert } })}
                  style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '16px', padding: '16px 18px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={17} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{alert.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{alert.description}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: badge.color, background: badge.bg, padding: '3px 8px', borderRadius: '999px', flexShrink: 0, marginLeft: '8px' }}>{badge.label}</span>
                  </div>

                  {/* Time + action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: '46px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#94a3b8' }}>
                      <Clock size={10} /> {fmtRelative(alert.created_at)}
                    </span>
                    {!alert.resolved && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!alert.read && (
                          <button
                            onClick={e => { e.stopPropagation(); markAsRead(alert.id) }}
                            style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); resolve(alert.id) }}
                          style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '7px', border: 'none', background: '#4f6ef7', color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
