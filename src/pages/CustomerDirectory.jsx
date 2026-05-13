import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, MapPin, Shield, CheckCircle, Clock } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

const customers = [
  { id: 'CST-001', initials: 'AO', name: 'Abena Osei', phone: '+233 27 456 7890', role: 'AGENT', location: 'Tamale, Ghana', trust: 97, mfa: true, verified: true },
  { id: 'CST-002', initials: 'AA', name: 'Akosua Appiah', phone: '+233 24 333 4444', role: 'CUSTOMER', location: 'Accra, Ghana', trust: 92, mfa: true, verified: true },
  { id: 'CST-003', initials: 'AA', name: 'Ama Asante', phone: '+233 20 345 6789', role: 'AGENT', location: 'Kumasi, Ghana', trust: 95, mfa: true, verified: true },
  { id: 'CST-004', initials: 'EB', name: 'Efua Boateng', phone: '+233 26 789 0123', role: 'CUSTOMER', location: 'Takoradi, Ghana', trust: 88, mfa: false, verified: false },
  { id: 'CST-005', initials: 'KO', name: 'Kofi Owusu', phone: '+233 55 123 4567', role: 'CUSTOMER', location: 'London, UK', trust: 72, mfa: true, verified: true },
  { id: 'CST-006', initials: 'KM', name: 'Kwame Mensah', phone: '+233 24 567 8901', role: 'CUSTOMER', location: 'Accra, Ghana', trust: 98, mfa: true, verified: true },
  { id: 'CST-007', initials: 'KD', name: 'Kwesi Darko', phone: '+233 20 987 6543', role: 'CUSTOMER', location: 'Lagos, Nigeria', trust: 78, mfa: true, verified: true },
  { id: 'CST-008', initials: 'YA', name: 'Yaw Agyeman', phone: '+233 24 111 2233', role: 'CUSTOMER', location: 'New York, USA', trust: 65, mfa: true, verified: true },
]

const avatarColors = ['#4f6ef7', '#7c3aed', '#0d9488', '#f59e0b', '#ef4444', '#22c55e']

export default function CustomerDirectory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ color: '#fff', fontSize: 'clamp(18px,4vw,26px)', fontWeight: 800, margin: '0 0 4px' }}>Customer Directory</h1>
        <p style={{ color: '#a5b4fc', fontSize: '13px', margin: 0 }}>Customer profiles, verification status & risk assessment</p>
      </div>

      <div className="page-pad">
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, telephone number, or customer ID..." style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box' }} />
        </div>

        <div className="rg-6" style={{ marginBottom: '18px' }}>
          {[
            { label: 'Total Customers', value: '1,248' }, { label: 'Agents', value: '87' },
            { label: 'Customers', value: '1,161' }, { label: 'MFA Enabled', value: '95%' },
            { label: 'Avg Trust Score', value: '89' }, { label: 'Verified', value: '98%' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '13px', padding: '14px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 800, color: '#4f6ef7', marginBottom: '3px' }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Showing 1–{filtered.length} of {filtered.length} customers</p>

        <div className="rg-2">
          {filtered.map((c, idx) => (
            <div key={c.id} style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: avatarColors[idx % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
                    {c.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textDecoration: c.id === 'CST-004' ? 'line-through' : 'none' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>📞 {c.phone}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {c.id}</div>
                  </div>
                </div>
                {c.verified ? <CheckCircle size={18} color="#22c55e" /> : <Clock size={18} color="#f59e0b" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: c.role === 'AGENT' ? '#8b5cf6' : '#3b82f6', background: c.role === 'AGENT' ? '#f5f3ff' : '#eff6ff', padding: '3px 8px', borderRadius: '6px' }}>{c.role}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#94a3b8' }}><MapPin size={10} />{c.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} color="#94a3b8" />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Trust: <strong style={{ color: '#4f6ef7' }}>{c.trust}%</strong></span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: c.mfa ? '#16a34a' : '#ef4444' }}>MFA {c.mfa ? 'On' : 'Off'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
