import { useState } from 'react'
import { Shield, Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function DashboardLayout({ children, rightPanel }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="dash-shell">
      {/* Backdrop */}
      <div className={`sidebar-overlay${open ? ' active' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar — desktop always visible, mobile slide-in */}
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />

      {/* Main wrapper */}
      <div className="main-wrapper">
        {/* Mobile top bar */}
        <div className="mobile-header">
          <button
            onClick={() => setOpen(true)}
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
