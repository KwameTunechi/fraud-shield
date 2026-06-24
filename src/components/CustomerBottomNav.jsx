import { useNavigate, useLocation } from 'react-router-dom'

const C = { primary:'#1652F0', textMuted:'#9CA3AF', surface:'#FFFFFF', border:'#E8ECEF' }

const TABS = [
  {
    name: 'Home', path: '/app/home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? C.primary : 'none'} stroke={active ? C.primary : C.textMuted} strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    name: 'Transactions', path: '/app/transactions',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? C.primary : 'none'} stroke={active ? C.primary : C.textMuted} strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    name: 'Security', path: '/app/security',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? C.primary : 'none'} stroke={active ? C.primary : C.textMuted} strokeWidth="2">
        <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"/>
      </svg>
    ),
  },
  {
    name: 'Profile', path: '/app/profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? C.primary : 'none'} stroke={active ? C.primary : C.textMuted} strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

export default function CustomerBottomNav() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  function isActive(path) {
    if (path === '/app/home') return pathname === '/app/home'
    return pathname.startsWith(path)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '440px',
      background: C.surface, borderTop: `1px solid ${C.border}`,
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      zIndex: 100,
    }}>
      {TABS.map(tab => {
        const active = isActive(tab.path)
        return (
          <button key={tab.name} onClick={() => navigate(tab.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {tab.icon(active)}
            <span style={{ fontSize: '11px', fontWeight: '600', color: active ? C.primary : C.textMuted, marginTop: '2px' }}>
              {tab.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
