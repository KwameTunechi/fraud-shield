import { Link } from 'react-router-dom'
import { Shield, Users } from 'lucide-react'

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px clamp(16px, 4vw, 32px)',
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(199,210,248,0.5)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(79,110,247,0.3)', flexShrink: 0 }}>
          <Shield size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', lineHeight: 1.1 }}>FraudShield</div>
          <div style={{ fontSize: '10px', color: '#4f6ef7', fontWeight: 600 }}>AI Security Platform</div>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/dashboard/admins" className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}>
          <Users size={15} /> Administrators
        </Link>
        <Link to="/signin" style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', color: '#fff', borderRadius: '10px', fontWeight: 600, fontSize: '13px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(79,110,247,0.3)', whiteSpace: 'nowrap' }}>
          Sign In
        </Link>
      </div>
    </nav>
  )
}
