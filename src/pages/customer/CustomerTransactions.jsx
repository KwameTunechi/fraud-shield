import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CustomerLayout from '../../components/CustomerLayout'
import CustomerBottomNav from '../../components/CustomerBottomNav'
import { useCustomerApi } from '../../hooks/useCustomerApi'
import { customerApi } from '../../api/customerClient'

const C = { primary:'#1652F0', primaryLight:'#EBF0FE', success:'#00875A', successLight:'#E3F5F0', warning:'#FF8B00', warningLight:'#FFF3E0', danger:'#DE350B', dangerLight:'#FFEBE6', text:'#0D1421', textSub:'#6B7280', textMuted:'#9CA3AF', bg:'#F5F7FA', surface:'#FFFFFF', border:'#E8ECEF' }

const REASON_LABELS = {
  late_night:'Late-night transaction (22:00–05:00)', amount_above_2000_ghs:'Amount above GHS 2,000',
  new_recipient:'New recipient — no prior transactions', amount_3x_avg:'Amount 3× your rolling average',
  amount_3x_rolling_avg:'Amount exceeds 3× rolling average', rapid_succession:'Multiple transactions in quick succession',
  recipient_flagged:'Recipient flagged in recent alerts', recipient_flagged_in_alerts:'Recipient flagged in recent alerts',
}

function fmtMoney(n) { return '₵' + Number(n||0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }
function fmtDate(ts) { return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) }
function fmtDateTime(ts) { return new Date(ts).toLocaleString('en-US', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true }) }

function statusStyle(s) {
  if (s==='completed') return { color:C.success, bg:C.successLight, label:'Completed', icon:'✓' }
  if (s==='review')    return { color:C.warning, bg:C.warningLight, label:'Under Review', icon:'🕐' }
  return                      { color:C.danger,  bg:C.dangerLight,  label:'Blocked', icon:'✕' }
}
function riskStyle(score) {
  if (score < 30) return { label:'Low',    color:C.success, bg:C.successLight }
  if (score < 70) return { label:'Medium', color:C.warning, bg:C.warningLight }
  return                  { label:'High',  color:C.danger,  bg:C.dangerLight  }
}
function categoryIcon(cat) {
  if (cat === 'MERCHANT') return '🏪'
  if (cat === 'AGENT')    return '🏢'
  return '↔'
}

// ─── Transaction Detail ───────────────────────────────────────────────────────
export function CustomerTransactionDetail() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const { data: txn, loading } = useCustomerApi(id ? `/api/transactions/${id}` : null)

  const Header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
      <button onClick={() => navigate('/app/transactions')}
        style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>←</button>
      <div style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>Transaction Detail</div>
      <div style={{ width: '38px' }} />
    </div>
  )

  if (loading || !txn) {
    return (
      <CustomerLayout header={Header}>
        <div style={{ textAlign: 'center', padding: '60px', color: C.textMuted, fontSize: '14px' }}>{loading ? 'Loading…' : 'Transaction not found'}</div>
      </CustomerLayout>
    )
  }

  const risk   = riskStyle(txn.risk_score)
  const status = statusStyle(txn.status)
  const reasons = (() => { try { const m = typeof txn.metadata==='string' ? JSON.parse(txn.metadata) : txn.metadata; return m?.reasons ?? [] } catch { return [] } })()

  return (
    <CustomerLayout header={Header}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Hero */}
        <div style={{ ...card, alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '4px' }}>
            {categoryIcon(txn.category)}
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: C.text, letterSpacing: '-0.5px' }}>−{fmtMoney(txn.amount)}</div>

          {/* From → To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: C.bg, borderRadius: '14px', padding: '12px 16px', marginTop: '4px', width: '100%' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>From</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>{txn.sender_name ?? 'You'}</div>
              <div style={{ fontSize: '11px', color: C.textSub, marginTop: '1px' }}>{txn.sender_phone ?? ''}</div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, flexShrink: 0, fontWeight: '700' }}>→</div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>To</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>{txn.recipient_name ?? txn.recipient_phone}</div>
              <div style={{ fontSize: '11px', color: C.textSub, marginTop: '1px' }}>{txn.recipient_phone}</div>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: C.textSub }}>{fmtDateTime(txn.created_at)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: status.bg }}>
            <span>{status.icon}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: status.color }}>{status.label}</span>
          </div>
        </div>

        {/* Risk analysis */}
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: C.text }}>Risk Analysis</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '12px', background: risk.bg }}>
            <div style={{ textAlign: 'center', minWidth: '48px' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: risk.color }}>{txn.risk_score}%</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: risk.color }}>{risk.label}</div>
            </div>
            <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '6px', width: `${txn.risk_score}%`, background: risk.color, borderRadius: '3px' }} />
            </div>
          </div>
          {reasons.length > 0 ? (
            <div style={{ background: C.warningLight, borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: C.warning }}>Risk factors detected</span>
              </div>
              {reasons.map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '3px', background: C.warning, marginTop: '5px', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#92400E', lineHeight: '18px' }}>{REASON_LABELS[r] ?? r}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✓</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: C.success }}>No anomalies detected</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div style={card}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: C.text }}>Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[
              { k:'Reference',  v:txn.reference,                          mono:true },
              { k:'Category',   v:txn.category },
              { k:'Status',     v:status.label,                            color:status.color },
              { k:'Sender',     v:txn.sender_name ?? 'You' },
              { k:'From',       v:txn.sender_phone ?? '' },
              { k:'Recipient',  v:txn.recipient_name ?? txn.recipient_phone },
              { k:'To',         v:txn.recipient_phone },
              { k:'Date',       v:fmtDateTime(txn.created_at) },
              { k:'AI Flagged', v:txn.ai_flagged ? 'Yes' : 'No',          color:txn.ai_flagged ? C.danger : C.success },
            ].map(({ k, v, mono, color }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '13px', color: C.textSub }}>{k}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: color ?? C.text, textAlign: 'right', flex: 1, marginLeft: '16px', fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? '12px' : '13px' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain */}
        <div style={{ ...card, border: '1px solid #BBF7D0', background: '#F0FDF4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: C.success }}>🔗</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: C.text }}>Blockchain Record</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.successLight, borderRadius: '999px', padding: '4px 8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: C.success }}>✓ Verified</span>
            </div>
          </div>
          {txn.blockchain_hash ? (
            <>
              <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', color: C.textSub, fontWeight: '600' }}>SHA-256 Hash</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: C.primary, lineHeight: '16px', wordBreak: 'break-all' }}>{txn.blockchain_hash}</div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(txn.blockchain_hash); alert('Hash copied to clipboard.') }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fff', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: C.success, fontFamily: 'inherit' }}>
                📋 Copy Hash
              </button>
            </>
          ) : (
            <div style={{ fontSize: '13px', color: C.textMuted }}>Blockchain entry pending</div>
          )}
          <div style={{ fontSize: '12px', color: '#166534', lineHeight: '18px' }}>
            This transaction is permanently recorded and cannot be altered.
          </div>
        </div>

        <div style={{ height: '20px' }} />
      </div>
      <CustomerBottomNav />
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

function groupByDate(txns) {
  const groups = {}
  txns.forEach(tx => {
    const key = new Date(tx.created_at).toDateString()
    if (!groups[key]) groups[key] = { label: fmtDate(tx.created_at), items: [] }
    groups[key].items.push(tx)
  })
  return Object.values(groups)
}

export default function CustomerTransactions() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const query = filter ? `?status=${filter}&limit=50` : '?limit=50'
  const { data, loading, reload } = useCustomerApi(`/api/transactions${query}`)
  const transactions = data?.transactions ?? []
  const grouped = groupByDate(transactions)

  const Header = (
    <div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: '20px', fontWeight: '800', color: C.text }}>Transactions</div>
        <div style={{ fontSize: '12px', color: C.textSub, marginTop: '2px' }}>{transactions.length} record{transactions.length !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', padding: '0 16px 12px', overflowX: 'auto', borderBottom: `1px solid ${C.border}` }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', background: filter === f.value ? C.primary : C.bg, color: filter === f.value ? '#fff' : C.textSub, fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <CustomerLayout header={Header}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '90px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: C.textMuted, fontSize: '14px' }}>Loading…</div>
        ) : transactions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 16px', gap: '10px' }}>
            <span style={{ fontSize: '40px' }}>🧾</span>
            <div style={{ fontSize: '16px', fontWeight: '700', color: C.text }}>No transactions</div>
            <div style={{ fontSize: '13px', color: C.textSub }}>{filter ? `No ${filter} transactions found` : 'Your transactions will appear here'}</div>
          </div>
        ) : (
          grouped.map(g => (
            <div key={g.label}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px', marginBottom: '4px', paddingLeft: '4px' }}>{g.label}</div>
              {g.items.map(tx => {
                const st = statusStyle(tx.status)
                const rs = riskStyle(tx.risk_score)
                return (
                  <button key={tx.id} onClick={() => navigate(`/app/transactions/${tx.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: C.surface, borderRadius: '14px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginBottom: '8px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
                      {categoryIcon(tx.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: C.text, flex: 1, marginRight: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.recipient_name ?? tx.recipient_phone}</span>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: C.text, flexShrink: 0 }}>−{fmtMoney(tx.amount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: C.textMuted, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.sender_name ?? 'You'} → {tx.recipient_phone}</span>
                        <span style={{ fontSize: '11px', color: C.textMuted, flexShrink: 0, marginLeft: '8px' }}>{fmtTime(tx.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: st.color, background: st.bg, padding: '3px 7px', borderRadius: '6px' }}>{st.label}</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: rs.color, background: rs.bg, padding: '3px 7px', borderRadius: '6px' }}>Risk {tx.risk_score}%</span>
                        {tx.ai_flagged && <span style={{ fontSize: '11px', fontWeight: '700', color: '#7C3AED', background: '#FDF4FF', padding: '3px 7px', borderRadius: '6px' }}>⚠ Flagged</span>}
                        {tx.blockchain_hash && <span style={{ fontSize: '11px', fontWeight: '700', color: C.success, background: C.successLight, padding: '3px 7px', borderRadius: '6px' }}>🔗 Verified</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
      <CustomerBottomNav />
    </CustomerLayout>
  )
}

const card = { background: C.surface, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
