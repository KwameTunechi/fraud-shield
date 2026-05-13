import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Shield, Bell, Users, Database, ChevronRight, LogOut, Lock } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

const sections = [
  { icon: Shield, label: 'Security', items: [{ label: 'MFA Policy', value: 'Enforced' }, { label: 'Password Requirements', value: 'Strong' }, { label: 'Session Timeout', value: '30 minutes' }, { label: 'IP Whitelisting', value: 'Enabled' }] },
  { icon: Bell, label: 'Notifications', items: [{ label: 'Email Alerts', value: 'On' }, { label: 'Push Notifications', value: 'On' }, { label: 'SMS Alerts', value: 'Off' }, { label: 'Alert Threshold', value: 'Medium' }] },
  { icon: Users, label: 'User Management', items: [{ label: 'User Roles', value: '5 Roles' }, { label: 'Access Control', value: 'Configured' }, { label: 'Onboarding Flow', value: 'Active' }] },
  { icon: Database, label: 'System', items: [{ label: 'Data Retention', value: '90 days' }, { label: 'Backup Schedule', value: 'Daily' }, { label: 'Audit Logs', value: 'Enabled' }, { label: 'API Access', value: 'Limited' }] },
]

export default function SystemSettings() {
  const navigate = useNavigate()
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
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>Configure security & policies</p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        <div className="rg-2">
          {/* Left: profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>JD</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Ebenezer Sika-Sackinor Amanor</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>System Administrator</div>
                </div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>
          </div>

          {/* Right: settings */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.value}</span>
                      <ChevronRight size={13} color="#d1d5db" />
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', borderRadius: '16px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Lock size={15} color="#fff" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>MFA Policy</span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: '14px' }}>Multi-Factor Authentication is currently enforced for all users. This ensures maximum security across your organization.</p>
              <div className="rg-2">
                <div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>Enrolled Users</div><div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>95%</div></div>
                <div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>Compliance</div><div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>100%</div></div>
              </div>
            </div>

            <div onClick={() => navigate('/signin')} style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogOut size={15} color="#ef4444" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>Sign Out</span>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </div>

            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Fraud Shield v2.0.1 · © 2026 All Rights Reserved</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
