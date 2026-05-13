import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Settings, Lock, ShieldCheck } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

const admins = [
  { num: 1, name: 'Ruth Jackson', id: '22427816', role: 'System Administrator', access: 'Full Access', accessColor: '#8b5cf6', accessBg: '#f5f3ff', dept: 'Security Operations' },
  { num: 2, name: 'Emmanuel Kofi Ansah-Anobah', id: '22424531', role: 'Senior Administrator', access: 'Full Access', accessColor: '#8b5cf6', accessBg: '#f5f3ff', dept: 'Fraud Detection' },
  { num: 3, name: 'James Ofori Essilfie', id: '22427805', role: 'Security Administrator', access: 'Read/Write', accessColor: '#3b82f6', accessBg: '#eff6ff', dept: 'Risk Management' },
  { num: 4, name: 'Clive Kwesi Dsane', id: '22424554', role: 'Database Administrator', access: 'Database Access', accessColor: '#3b82f6', accessBg: '#eff6ff', dept: 'Data Management' },
  { num: 5, name: 'Evans Adusu', id: '22424144', role: 'Network Administrator', access: 'Network Config', accessColor: '#3b82f6', accessBg: '#eff6ff', dept: 'Infrastructure' },
  { num: 6, name: 'Ebenezer Sika-Sackinor Amanor', id: '22424626', role: 'Compliance Administrator', access: 'Audit Access', accessColor: '#3b82f6', accessBg: '#eff6ff', dept: 'Compliance' },
  { num: 7, name: 'Daniel Asumadu', id: '22425827', role: 'Security Analyst', access: 'Read/Write', accessColor: '#3b82f6', accessBg: '#eff6ff', dept: 'Threat Analysis' },
  { num: 8, name: 'Wilhelmina Naa Yemoley Tetteh', id: '22424680', role: 'Operations Administrator', access: 'Operations Access', accessColor: '#3b82f6', accessBg: '#eff6ff', dept: 'System Operations' },
]

export default function Administrators() {
  const navigate = useNavigate()
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
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>Access control, permissions & administrative roles</p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        <div className="rg-4" style={{ marginBottom: '22px' }}>
          {[
            { icon: Shield, label: 'Total Admins', value: '8' },
            { icon: ShieldCheck, label: 'Active Sessions', value: '8' },
            { icon: Settings, label: 'Departments', value: '7' },
            { icon: Lock, label: 'Access Levels', value: '5' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, color: '#0f172a' }}>{value}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rg-2" style={{ marginBottom: '20px' }}>
          {admins.map((admin) => (
            <div key={admin.id} style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={20} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '3px', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.name}</div>
                  <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#3b82f6', flexShrink: 0 }}>{admin.num}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>Admin ID: {admin.id}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  <Settings size={11} color="#94a3b8" />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{admin.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  <Lock size={11} color="#94a3b8" />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: admin.accessColor, background: admin.accessBg, padding: '2px 8px', borderRadius: '5px' }}>{admin.access}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Shield size={11} color="#94a3b8" />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{admin.dept}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

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
