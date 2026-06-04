import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Settings, Lock, ShieldCheck } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'

const ROLE_STYLE = {
  super_admin: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Full Access'  },
  supervisor:  { color: '#3b82f6', bg: '#eff6ff', label: 'Read/Write'  },
  analyst:     { color: '#0d9488', bg: '#f0fdfa', label: 'Read Only'   },
}

function fmtRelative(ts) {
  if (!ts) return 'Never'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export default function Administrators() {
  const navigate = useNavigate()
  const { admin: me } = useAuth()
  const { data, loading } = useApi('/api/admins')

  const admins = data?.admins ?? []
  const active = admins.filter(a => a.status === 'active').length

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(16px,3.5vw,24px)', fontWeight: 800, margin: 0 }}>System Administrators</h1>
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>Access control, permissions &amp; administrative roles</p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        {/* Stats */}
        <div className="rg-4" style={{ marginBottom: '22px' }}>
          {[
            { icon: Shield,     label: 'Total Admins',    value: loading ? '…' : admins.length },
            { icon: ShieldCheck,label: 'Active',          value: loading ? '…' : active        },
            { icon: Settings,   label: 'Roles',           value: '3'                            },
            { icon: Lock,       label: 'You',             value: loading ? '…' : (me?.role ?? '—') },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>{value}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? <Loading /> : admins.length === 0 ? (
          <EmptyState message="No administrators found." icon="🔐" />
        ) : (
          <div className="rg-2" style={{ marginBottom: '20px' }}>
            {admins.map((admin, idx) => {
              const rs = ROLE_STYLE[admin.role] ?? ROLE_STYLE.analyst
              const isMe = admin.id === me?.id
              return (
                <div key={admin.id} style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${isMe ? '#c7d2fe' : '#f1f5f9'}`, display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck size={20} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '3px', gap: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {admin.full_name}
                        {isMe && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#4f6ef7', background: '#eef2ff', padding: '1px 6px', borderRadius: '999px' }}>you</span>}
                      </div>
                      <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>{idx + 1}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>{admin.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                      <Settings size={11} color="#94a3b8" />
                      <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize' }}>{admin.role.replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                      <Lock size={11} color="#94a3b8" />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: rs.color, background: rs.bg, padding: '2px 8px', borderRadius: '5px' }}>{rs.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Shield size={11} color="#94a3b8" />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        MFA {admin.mfa_enabled ? 'enabled' : 'not set'} · Last login {fmtRelative(admin.last_login_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Team footer */}
        <div style={{ background: 'linear-gradient(135deg, #4f6ef7 0%, #7c3aed 50%, #0d9488 100%)', borderRadius: '20px', padding: 'clamp(20px,4vw,28px) clamp(20px,4vw,32px)' }}>
          <div className="rg-2">
            <div>
              <div style={{ fontSize: 'clamp(13px,2vw,15px)', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>FraudShield AI Security Platform</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>Advanced fraud detection system with AI-powered analytics, multi-factor authentication, and blockchain integration for enterprise security.</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>Developed by Group 6</div>
              <div style={{ fontSize: 'clamp(11px,1.5vw,13px)', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>CSIT 621 - Emerging Technologies for Business I</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>© 2026 All Rights Reserved</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
