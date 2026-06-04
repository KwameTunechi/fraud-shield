import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Link2, Search, CheckCircle, Clock } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { useApi } from '../hooks/useApi'

const statusBadge = (ok) => ok
  ? { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Confirmed' }
  : { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pending'   }

function parsePayload(raw) {
  try { return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {}) }
  catch { return {} }
}

function eventTitle(type) {
  if (type === 'transaction') return 'Transaction Verification'
  if (type === 'auth')        return 'User Authentication'
  return 'System Event'
}

function shortHash(h) {
  if (!h) return '—'
  return `${h.slice(0, 10)}…${h.slice(-6)}`
}

function fmtRelative(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

export default function BlockchainLedger() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data,       loading:  lEntries } = useApi('/api/blockchain?limit=50')
  const { data: verify, loading: lVerify  } = useApi('/api/blockchain/verify')

  const entries = data?.entries ?? []
  const total   = data?.total   ?? 0

  const filtered = search
    ? entries.filter(e =>
        e.hash.includes(search) ||
        eventTitle(e.event_type).toLowerCase().includes(search.toLowerCase()) ||
        (e.previous_hash ?? '').includes(search)
      )
    : entries

  const chainOk = verify?.ok ?? null

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Link2 size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(16px,3.5vw,24px)', fontWeight: 800, margin: 0 }}>Blockchain Ledger Explorer</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', margin: '3px 0 0' }}>Immutable transaction records &amp; verification</p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by hash or event type…" style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box' }} />
        </div>

        {/* Stats */}
        <div className="rg-6" style={{ marginBottom: '22px' }}>
          {[
            { label: 'Total Entries', value: lEntries ? '…' : total },
            { label: 'Transactions', value: lEntries ? '…' : entries.filter(e => e.event_type === 'transaction').length },
            { label: 'Auth Events',  value: lEntries ? '…' : entries.filter(e => e.event_type === 'auth').length },
            { label: 'Showing',      value: lEntries ? '…' : filtered.length },
            { label: 'Chain Status', value: lVerify  ? '…' : (chainOk === true ? '✓ Valid' : chainOk === false ? '✗ Broken' : '—') },
            { label: 'Integrity',    value: lVerify  ? '…' : (chainOk === true ? '100%'   : chainOk === false ? 'FAIL'    : '—') },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '13px', padding: '14px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 'clamp(14px,2vw,18px)', fontWeight: 800, color: label === 'Chain Status' && chainOk === false ? '#dc2626' : '#4f6ef7', marginBottom: '3px' }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Chain integrity banner */}
        {!lVerify && chainOk === false && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>Chain Integrity Violation</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Bad entry at id {verify?.badAt} — {verify?.reason}</div>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Recent Entries</h2>

        {lEntries ? <Loading /> : filtered.length === 0 ? (
          <EmptyState message={search ? 'No entries match.' : 'No blockchain entries yet.'} icon="🔗" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {filtered.map((entry) => {
              const payload = parsePayload(entry.payload)
              const isConfirmed = !!entry.previous_hash || entry.id === 1
              const st = statusBadge(isConfirmed)
              const amount = payload.amount
                ? `₵${Number(payload.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : null
              const fromAddr = payload.senderId
                ? `${payload.senderId.slice(0, 8)}…`
                : payload.adminId
                ? `admin:${payload.adminId.slice(0, 8)}…`
                : 'system'
              const toAddr = payload.recipientPhone ?? 'system'

              return (
                <div key={entry.id} style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg, #0d9488, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Link2 size={16} color="#fff" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{eventTitle(entry.event_type)}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortHash(entry.hash)}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: '999px', flexShrink: 0 }}>{st.label}</span>
                  </div>

                  <div className="rg-2" style={{ marginBottom: '10px', paddingLeft: '50px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>From</div>
                      <div style={{ fontSize: '11px', color: '#0f172a', fontFamily: 'monospace' }}>{fromAddr}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>To</div>
                      <div style={{ fontSize: '11px', color: '#0f172a', fontFamily: 'monospace' }}>{toAddr}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '50px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16a34a' }}><CheckCircle size={11} /> #{entry.id}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#94a3b8' }}><Clock size={10} /> {fmtRelative(entry.created_at)}</span>
                    {amount && <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginLeft: 'auto' }}>{amount}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Network status footer */}
        <div style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)', borderRadius: '18px', padding: '24px 28px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Network Status</h3>
          <div className="rg-4">
            {[
              { label: 'Total Entries', value: lEntries ? '…' : total },
              { label: 'Transactions', value: lEntries ? '…' : entries.filter(e => e.event_type === 'transaction').length },
              { label: 'Auth Events',  value: lEntries ? '…' : entries.filter(e => e.event_type === 'auth').length },
              { label: 'Chain',        value: lVerify  ? '…' : (chainOk ? 'Valid ✓' : 'Check!') },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 800, color: '#fff' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
