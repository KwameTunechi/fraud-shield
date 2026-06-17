import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Shield, CheckCircle, Clock } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { useApi } from '../hooks/useApi'

const AVATAR_COLORS = ['#4f6ef7', '#7c3aed', '#0d9488', '#f59e0b', '#ef4444', '#22c55e']
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function CustomerDirectory() {
  const navigate = useNavigate()
  const [search,   setSearch]   = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const query = debounced ? `?search=${encodeURIComponent(debounced)}&limit=25` : '?limit=25'
  const { data, loading } = useApi(`/api/customers${query}`)

  const customers = data?.customers ?? []
  const total     = data?.total     ?? 0
  const s         = data?.stats     ?? {}
  const mfaPct    = s.total ? Math.round((s.mfa_count / s.total) * 100) : 0

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ color: '#fff', fontSize: 'clamp(18px,4vw,26px)', fontWeight: 800, margin: '0 0 4px' }}>Customer Directory</h1>
        <p style={{ color: '#a5b4fc', fontSize: '13px', margin: 0 }}>Customer profiles, verification status &amp; risk assessment</p>
      </div>

      <div className="page-pad">
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone number…" style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box' }} />
        </div>

        <div className="rg-6" style={{ marginBottom: '18px' }}>
          {[
            { label: 'Total Customers', value: loading ? '…' : total     },
            { label: 'Shown',           value: loading ? '…' : customers.length },
            { label: 'MFA Enabled',     value: loading ? '…' : `${mfaPct}%` },
            { label: 'Avg Trust Score', value: loading ? '…' : s.avg_trust ?? '—' },
            { label: 'Active',          value: loading ? '…' : (s.total ?? '—') },
            { label: 'Results',         value: loading ? '…' : customers.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '13px', padding: '14px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 800, color: '#4f6ef7', marginBottom: '3px' }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
          {loading ? 'Loading…' : `Showing ${customers.length} of ${total} customer${total !== 1 ? 's' : ''}`}
        </p>

        {loading ? <Loading /> : customers.length === 0 ? (
          <EmptyState message={debounced ? 'No customers match your search.' : 'No customers yet.'} icon="👥" />
        ) : (
          <div className="rg-2">
            {customers.map((c, idx) => (
              <div key={c.id} onClick={() => navigate(`/dashboard/customers/${c.id}`)} style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'box-shadow 0.15s' }} onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(22,82,240,0.12)'} onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
                      {initials(c.full_name)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{c.full_name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>📞 {c.phone_number}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {c.id.slice(0, 8)}…</div>
                    </div>
                  </div>
                  {c.status === 'active' ? <CheckCircle size={18} color="#22c55e" /> : <Clock size={18} color="#f59e0b" />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '3px 8px', borderRadius: '6px' }}>CUSTOMER</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Joined {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} color="#94a3b8" />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Trust: <strong style={{ color: '#4f6ef7' }}>{c.trust_score}%</strong></span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: c.mfa_enabled ? '#16a34a' : '#ef4444' }}>MFA {c.mfa_enabled ? 'On' : 'Off'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
