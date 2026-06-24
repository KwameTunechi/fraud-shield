import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, ShieldAlert, ShieldCheck, Link } from 'lucide-react'
import CustomerLayout from '../../components/CustomerLayout'
import { useCustomerApi } from '../../hooks/useCustomerApi'

const P = '#1652F0'

function fmtMoney(n) { return '₵' + Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 }) }
function fmtDate(ts) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const REASON_LABELS = {
  late_night:                  'Late-night transaction (22:00–05:00)',
  amount_above_2000_ghs:       'Amount above GHS 2,000',
  new_recipient:               'New recipient — no prior transactions',
  amount_3x_avg:               'Amount 3× your rolling average',
  amount_3x_rolling_avg:       'Amount exceeds 3× rolling average',
  rapid_succession:            'Multiple transactions in quick succession',
  recipient_flagged:           'Recipient flagged in recent alerts',
  recipient_flagged_in_alerts: 'Recipient flagged in recent alerts',
}

function statusStyle(s) {
  if (s === 'completed') return { color: '#00875A', bg: '#E3F5F0', label: 'Completed' }
  if (s === 'review')    return { color: '#FF8B00', bg: '#FFF3E0', label: 'In Review' }
  return                         { color: '#DE350B', bg: '#FFEBE6', label: 'Blocked' }
}

function riskInfo(score) {
  if (score < 30) return { color: '#00875A', bg: '#E3F5F0', label: 'Low Risk' }
  if (score < 70) return { color: '#FF8B00', bg: '#FFF3E0', label: 'Medium Risk' }
  return                  { color: '#DE350B', bg: '#FFEBE6', label: 'High Risk' }
}

// ─── Transaction Detail ───────────────────────────────────────────────────────
export function CustomerTransactionDetail() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const { data: tx, loading } = useCustomerApi(id ? `/api/transactions/${id}` : null)

  if (loading) return <CustomerLayout><div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading…</div></CustomerLayout>
  if (!tx) return <CustomerLayout><div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Transaction not found</div></CustomerLayout>

  const st = statusStyle(tx.status)
  const ri = riskInfo(tx.risk_score ?? 0)
  const reasons = (() => { try { const m = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata; return m?.reasons ?? [] } catch { return [] } })()

  return (
    <CustomerLayout>
      <div style={{ paddingTop: '24px' }}>
        <button onClick={() => navigate('/app/transactions')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Amount hero */}
      <div style={{ ...card, alignItems: 'center', textAlign: 'center', gap: '12px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#EBF0FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={24} color={P} />
        </div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#0d1421', letterSpacing: '-0.5px' }}>−{fmtMoney(tx.amount)}</div>

        {/* From → To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f5f7fa', borderRadius: '12px', padding: '12px 16px', width: '100%' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '3px' }}>From</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1421' }}>{tx.sender_name ?? 'You'}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>{tx.sender_phone ?? ''}</div>
          </div>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#EBF0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>→</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '3px' }}>To</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1421' }}>{tx.recipient_name ?? tx.recipient_phone}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>{tx.recipient_phone}</div>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#6b7280' }}>{fmtDate(tx.created_at)}</div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: st.color, background: st.bg, padding: '4px 12px', borderRadius: '999px' }}>{st.label}</div>
      </div>

      {/* Risk */}
      <div style={card}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1421', marginBottom: '4px' }}>Risk Analysis</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: ri.bg, borderRadius: '10px', padding: '12px 14px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: ri.color }}>{tx.risk_score}%</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: ri.color }}>{ri.label}</div>
          </div>
          <div style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${tx.risk_score}%`, background: ri.color, borderRadius: '4px' }} />
          </div>
        </div>
        {reasons.length > 0 && (
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', marginTop: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Flags</div>
            {reasons.map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '5px' }}>
                <ShieldAlert size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '12px', color: '#374151' }}>{REASON_LABELS[r] ?? r}</span>
              </div>
            ))}
          </div>
        )}
        {reasons.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#00875A' }}>
            <ShieldCheck size={14} /> No anomalies detected
          </div>
        )}
      </div>

      {/* Details */}
      <div style={card}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1421', marginBottom: '4px' }}>Details</div>
        {[
          { label: 'Reference', value: tx.reference, mono: true },
          { label: 'Category',  value: tx.category },
          { label: 'Status',    value: st.label, color: st.color },
        ].map(({ label, value, mono, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: color ?? '#0d1421', fontFamily: mono ? 'monospace' : 'Inter, sans-serif' }}>{value}</span>
          </div>
        ))}
      </div>

      {tx.blockchain_hash && (
        <div style={{ ...card, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Link size={14} color="#16a34a" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>Blockchain Verified</span>
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#374151', wordBreak: 'break-all' }}>{tx.blockchain_hash}</div>
        </div>
      )}
    </CustomerLayout>
  )
}

// ─── Transaction List ─────────────────────────────────────────────────────────
const FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Review',    value: 'review' },
  { label: 'Blocked',   value: 'blocked' },
]

export default function CustomerTransactions() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const query = filter ? `?status=${filter}&limit=50` : '?limit=50'
  const { data, loading, reload } = useCustomerApi(`/api/transactions${query}`)
  const transactions = data?.transactions ?? []

  return (
    <CustomerLayout>
      <div style={{ paddingTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/app/home')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d1421' }}>Transactions</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            style={{ padding: '7px 14px', borderRadius: '999px', border: '1.5px solid', borderColor: filter === f.value ? P : '#e8ecef', background: filter === f.value ? '#EBF0FE' : '#fff', color: filter === f.value ? P : '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '4px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>Loading…</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>No transactions</div>
        ) : (
          transactions.map((tx, i) => {
            const st = statusStyle(tx.status)
            const ri = riskInfo(tx.risk_score ?? 0)
            return (
              <div key={tx.id} onClick={() => navigate(`/app/transactions/${tx.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: i < transactions.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EBF0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={16} color={P} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0d1421', marginBottom: '2px' }}>
                    {tx.recipient_name ?? tx.recipient_phone}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {tx.sender_name ?? 'You'} → {tx.recipient_phone}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d1421' }}>−{fmtMoney(tx.amount)}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: st.color, background: st.bg, padding: '2px 6px', borderRadius: '4px' }}>{st.label}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: ri.color, background: ri.bg, padding: '2px 6px', borderRadius: '4px' }}>Risk {tx.risk_score}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </CustomerLayout>
  )
}

const card = {
  background: '#fff', borderRadius: '16px', padding: '20px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex',
  flexDirection: 'column', gap: '10px',
}
