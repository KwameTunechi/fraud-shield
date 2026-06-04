import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, RefreshCw, Clock, Filter } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { useApi } from '../hooks/useApi'
import { getAccessToken } from '../api/client'

const riskColor   = (r) => r < 30 ? '#16a34a' : r < 70 ? '#d97706' : '#dc2626'
const statusStyle = (s) => s === 'completed'
  ? { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Safe'    }
  : s === 'review'
  ? { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Review'  }
  : { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Blocked' }
const catColor    = (c) => c === 'AGENT' ? '#8b5cf6' : c === 'MERCHANT' ? '#14b8a6' : '#3b82f6'
const fmtAmount   = (n) => '₵' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })
const fmtTime     = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour12: false })

export default function LiveTransactions() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [live, setLive] = useState([])   // pushed from SSE

  const query = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
  const { data, loading, reload } = useApi(`/api/transactions${query}`)

  // ── SSE subscription ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = getAccessToken()
    if (!token) return

    const url = `${import.meta.env.VITE_API_URL}/api/events/stream?token=${encodeURIComponent(token)}`
    const source = new EventSource(url)

    source.addEventListener('transaction.new', (e) => {
      const tx = JSON.parse(e.data)
      setLive((prev) => [tx, ...prev].slice(0, 50))
    })
    source.addEventListener('transaction.status_changed', () => reload())
    source.onerror = () => source.close()

    return () => source.close()
  }, [reload])

  const pagedTxns = data?.transactions ?? []
  const pagedIds  = new Set(pagedTxns.map(t => t.id))
  const allTxns   = [...live.filter(t => !pagedIds.has(t.id)), ...pagedTxns]

  const total   = allTxns.length
  const safe    = allTxns.filter(t => t.status === 'completed').length
  const review  = allTxns.filter(t => t.status === 'review').length
  const blocked = allTxns.filter(t => t.status === 'blocked').length

  const filterBtns = [
    { label: 'All',     value: 'all'       },
    { label: 'Safe',    value: 'completed' },
    { label: 'Review',  value: 'review'    },
    { label: 'Blocked', value: 'blocked'   },
  ]

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 60%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '12px' }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ color: '#fff', fontSize: 'clamp(15px,3vw,22px)', fontWeight: 800, margin: 0 }}>Live Transactions Monitoring</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#22c55e', padding: '2px 8px', borderRadius: '999px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>Real-time transaction monitoring &amp; fraud detection</p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        {/* Stats */}
        <div className="rg-4" style={{ marginBottom: '18px' }}>
          {[
            { label: 'Total Transactions', value: total,   icon: RefreshCw, ic: '#3b82f6' },
            { label: 'Safe Transactions',  value: safe,    icon: Activity,  ic: '#22c55e' },
            { label: 'Under Review',       value: review,  icon: Clock,     ic: '#f59e0b' },
            { label: 'Blocked',            value: blocked, icon: Filter,    ic: '#ef4444' },
          ].map(({ label, value, icon: Icon, ic }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{label}</span>
                <Icon size={15} color={ic} />
              </div>
              <div style={{ fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#0f172a' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <Filter size={13} color="#94a3b8" />
          {filterBtns.map(btn => (
            <button
              key={btn.value}
              onClick={() => { setStatusFilter(btn.value); setLive([]) }}
              style={{
                fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '7px',
                border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                background: statusFilter === btn.value ? '#4f6ef7' : '#f1f5f9',
                color:      statusFilter === btn.value ? '#fff'    : '#64748b',
              }}
            >
              {btn.label}
            </button>
          ))}
          <button onClick={reload} title="Refresh" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f8fafc' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Transaction Stream</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '11px', color: '#64748b' }}>SSE live updates</span>
            </div>
          </div>

          {loading ? <Loading /> : allTxns.length === 0 ? (
            <EmptyState message="No transactions match this filter." icon="🔍" />
          ) : (
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Reference', 'Time', 'Recipient', 'Amount', 'Risk Score', 'Status', 'Category', 'Blockchain'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allTxns.map((tx, i) => {
                    const st  = statusStyle(tx.status)
                    const ts  = tx.created_at ?? tx.createdAt
                    const rsk = tx.risk_score  ?? tx.score ?? 0
                    return (
                      <tr key={tx.id} style={{ borderBottom: i < allTxns.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                        <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{tx.reference}</td>
                        <td style={{ padding: '13px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} color="#94a3b8" />{fmtTime(ts)}</span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{tx.recipient_phone ?? tx.recipientPhone}</td>
                        <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{fmtAmount(tx.amount)}</td>
                        <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: riskColor(rsk), whiteSpace: 'nowrap' }}>{rsk}%</td>
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: '8px' }}>{st.label}</span>
                        </td>
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: catColor(tx.category) }}>{tx.category}</span>
                        </td>
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap', fontSize: '11px', color: tx.blockchain_hash ? '#059669' : '#94a3b8' }}>
                          {tx.blockchain_hash ? `✓ ${tx.blockchain_hash.slice(0, 8)}…` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
