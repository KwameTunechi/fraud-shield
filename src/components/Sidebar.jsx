import { Link, useLocation } from 'react-router-dom'
import {
  Shield, LayoutDashboard, BarChart2, Bell, Zap,
  Users, Settings, Link2, SlidersHorizontal, UserCog, X,
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: BarChart2, label: 'Risk Analytics', to: '/dashboard/risk' },
  { icon: Bell, label: 'Alerts & Incidents', to: '/dashboard/alerts' },
  { icon: Zap, label: 'Live Transactions', to: '/dashboard/transactions' },
  { icon: Users, label: 'Customer Directory', to: '/dashboard/customers' },
  { icon: SlidersHorizontal, label: 'AI Configuration', to: '/dashboard/ai-config' },
  { icon: Link2, label: 'Blockchain Ledger', to: '/dashboard/blockchain' },
  { icon: Settings, label: 'System Settings', to: '/dashboard/settings' },
  { icon: UserCog, label: 'Administrators', to: '/dashboard/admins' },
]

export default function Sidebar({ isOpen = true, onClose }) {
  const { pathname } = useLocation()

  return (
    <aside className={`sidebar-nav${isOpen ? ' open' : ''}`}>
      {/* Logo + mobile close */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', lineHeight: 1.1 }}>FraudShield</div>
            <div style={{ fontSize: '10px', color: '#4f6ef7', fontWeight: 600 }}>AI Security Platform</div>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        )}
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

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
          G6
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Group 6 Team</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>CSIT 621</div>
        </div>
      </div>
    </aside>
  )
}
