import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Shield, Bell, Users, Database, ChevronRight, LogOut, Lock, UserCog } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'

function cap(str) {
  if (!str) return ''
  return String(str).charAt(0).toUpperCase() + String(str).slice(1)
}

export default function SystemSettings() {
  const navigate = useNavigate()
  const { admin, signOut } = useAuth()
  const { data: cfg, loading }      = useApi('/api/settings')
  const { data: adminsData }        = useApi('/api/admins')

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin', { replace: true })
  }

  const c            = cfg ?? {}
  const adminCount   = adminsData?.admins?.length ?? '—'
  const mfaCoverage  = c.mfaPolicy === 'enforced' ? '100%' : 'Partial'

  const sections = [
    {
      icon: Shield,
      label: 'Security',
      items: [
        { label: 'MFA Policy',       value: cap(c.mfaPolicy)    || 'Enforced'  },
        { label: 'Session Timeout',  value: c.sessionTimeout ? `${c.sessionTimeout} min` : '30 min' },
        { label: 'Audit Logs',       value: c.auditLogs !== false ? 'Enabled' : 'Disabled' },
        { label: 'API Access',       value: cap(c.apiAccess)    || 'Limited'   },
      ],
    },
    {
      icon: Bell,
      label: 'Notifications',
      items: [
        { label: 'Email Alerts',       value: c.emailAlerts       !== false ? 'On' : 'Off' },
        { label: 'Push Notifications', value: c.pushNotifications !== false ? 'On' : 'Off' },
        { label: 'SMS Alerts',         value: c.smsAlerts         === true  ? 'On' : 'Off' },
      ],
    },
    {
      icon: Users,
      label: 'User Management',
      items: [
        { label: 'Administrators',  value: `${adminCount} active` },
        { label: 'MFA Coverage',    value: mfaCoverage            },
        { label: 'Access Control',  value: 'Role-based'           },
      ],
    },
    {
      icon: Database,
      label: 'System',
      items: [
        { label: 'Data Retention',  value: c.dataRetention  ? `${c.dataRetention} days` : '90 days' },
        { label: 'Backup Schedule', value: cap(c.backupSchedule) || 'Daily' },
        { label: 'API Version',     value: 'v2.0.1'               },
      ],
    },
  ]

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Settings size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(16px,3.5vw,24px)', fontWeight: 800, margin: 0 }}>System Settings</h1>
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>Configure security &amp; policies</p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        {loading ? <Loading /> : (
          <div className="rg-2">
            {/* Profile card — links to Administrators page */}
            <div
              onClick={() => navigate('/dashboard/admins')}
              style={{ background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                  {admin?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AD'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{admin?.fullName ?? 'Administrator'}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>{admin?.role?.replace('_', ' ') ?? 'admin'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserCog size={14} color="#94a3b8" />
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            </div>

            {/* Settings sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sections.map(({ icon: Icon, label, items }) => (
                <div key={label} style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Icon size={15} color="#4f6ef7" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{label}</span>
                  </div>
                  {items.map((item, i) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              ))}

              {/* MFA Policy card */}
              <div style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', borderRadius: '16px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Lock size={15} color="#fff" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>MFA Policy</span>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: '14px' }}>
                  Multi-Factor Authentication is currently <strong>{c.mfaPolicy ?? 'enforced'}</strong> for all administrators.
                </p>
                <div className="rg-2">
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>Policy</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>{c.mfaPolicy ?? 'Enforced'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>Compliance</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{mfaCoverage}</div>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div onClick={handleSignOut} style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={15} color="#ef4444" />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>Sign Out</span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>

              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>FraudShield v2.0.1 · © 2026 All Rights Reserved</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
