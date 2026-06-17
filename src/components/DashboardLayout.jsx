import { useState } from 'react'
import { Shield, Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children, rightPanel }) {
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [collapsed,   setCollapsed]   = useState(false)

  // X button in sidebar calls this — closes mobile overlay AND collapses desktop
  function handleClose() {
    setMobileOpen(false)
    setCollapsed(true)
  }

  return (
    <div className="dash-shell">
      {/* Mobile backdrop */}
      <div className={`sidebar-overlay${mobileOpen ? ' active' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <Sidebar
        isOpen={mobileOpen}
        collapsed={collapsed}
        onClose={handleClose}
      />

      {/* Main wrapper */}
      <div className="main-wrapper">
        {/* Top bar — hamburger shown on mobile always, on desktop only when sidebar is collapsed */}
        <div className={`mobile-header${collapsed ? ' desktop-show' : ''}`}>
          <button
            onClick={() => { setMobileOpen(true); setCollapsed(false) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', color: '#374151' }}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>FraudShield</span>
          </div>
        </div>

        {/* Content area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
            {children}
          </main>
          {rightPanel && (
            <aside className="right-panel">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
