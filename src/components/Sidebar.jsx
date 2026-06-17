import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Shield, LayoutDashboard, BarChart2, Bell, Zap,
  Users, Settings, Link2, SlidersHorizontal, UserCog, X, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',          to: '/dashboard' },
  { icon: BarChart2,       label: 'Risk Analytics',     to: '/dashboard/risk' },
  { icon: Bell,            label: 'Alerts & Incidents', to: '/dashboard/alerts' },
  { icon: Zap,             label: 'Live Transactions',  to: '/dashboard/transactions' },
  { icon: Users,           label: 'Customer Directory', to: '/dashboard/customers' },
  { icon: SlidersHorizontal, label: 'AI Configuration', to: '/dashboard/ai-config' },
  { icon: Link2,           label: 'Blockchain Ledger',  to: '/dashboard/blockchain' },
  { icon: Settings,        label: 'System Settings',    to: '/dashboard/settings' },
  { icon: UserCog,         label: 'Administrators',     to: '/dashboard/admins' },
]

export default function Sidebar({ isOpen = true, collapsed = false, onClose }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { admin, signOut } = useAuth()
  const initials = (admin?.fullName ?? 'AD').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <aside className={`sidebar-nav${isOpen ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
      {/* Logo + close button (always visible) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', lineHeight: 1.1 }}>FraudShield</div>
            <div style={{ fontSize: '10px', color: '#4f6ef7', fontWeight: 600 }}>AI Security Platform</div>
          </div>
        </Link>
        <button
          onClick={onClose}
          title="Collapse sidebar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#94a3b8', borderRadius: '6px', transition: 'color 0.15s, background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#f1f5f9' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map(({ icon: Icon, label, to }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '10px',
                fontSize: '13px', fontWeight: active ? 600 : 500,
                color: active ? '#4f6ef7' : '#64748b',
                background: active ? '#eef2ff' : 'transparent',
                textDecoration: 'none', transition: 'background 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} color={active ? '#4f6ef7' : '#94a3b8'} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + sign-out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin?.fullName ?? 'Administrator'}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>{admin?.role?.replace('_', ' ') ?? 'admin'}</div>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', color: '#94a3b8', flexShrink: 0, transition: 'color 0.15s, background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
