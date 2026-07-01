import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, RefreshCw, Clock, Filter, X, Brain, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'
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
const fmtDate     = (ts) => new Date(ts).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })

// ── AI Explanation map ────────────────────────────────────────────────────────
// Each reason code from scorer.js maps to a human-readable explanation
const REASON_EXPLANATIONS = {
  late_night: {
    title: 'Sent During Late-Night Hours',
    detail: 'This transaction was initiated between 10:00 PM and 5:00 AM Ghana time. Fraudulent transactions are statistically more common during late-night hours when victims are less likely to be monitoring their accounts.',
    points: 25,
    severity: 'medium',
    icon: '🌙',
  },
  amount_above_2000_ghs: {
    title: 'Large Transaction Amount',
    detail: 'The amount exceeds ₵2,000, which is significantly above the typical mobile money transfer. Large single transfers are a common pattern in fraud cases, especially account takeovers and SIM swap attacks.',
    points: 20,
    severity: 'medium',
    icon: '💰',
  },
  new_recipient: {
    title: 'First-Time Recipient',
    detail: 'The sender has never previously sent money to this phone number. First-time transfers to unknown recipients carry elevated risk because fraudsters typically direct stolen funds to new, unlinked accounts.',
    points: 20,
    severity: 'medium',
    icon: '👤',
  },
  amount_3x_rolling_avg: {
    title: 'Amount Far Exceeds Normal Behaviour',
    detail: 'This transaction is more than 3× the sender\'s average transfer amount over the past 30 days. A sudden spike in transfer size is a strong indicator of account compromise — the legitimate account owner rarely changes their spending pattern this dramatically.',
    points: 15,
    severity: 'medium',
    icon: '📈',
  },
  rapid_succession: {
    title: 'Unusually High Transaction Frequency',
    detail: 'The sender made more than 3 transactions within the last 10 minutes. This rapid-fire pattern is a hallmark of account compromise — attackers attempt to drain funds as quickly as possible before the victim notices and locks the account.',
    points: 15,
    severity: 'medium',
    icon: '⚡',
  },
  recipient_flagged_in_alerts: {
    title: 'Recipient Linked to Known Fraud',
    detail: 'The recipient\'s phone number has appeared in a fraud alert within the last 30 days. This is a strong signal — the recipient account has previously been associated with fraudulent activity and may be a money mule account used to collect stolen funds.',
    points: 50,
    severity: 'critical',
    icon: '🚨',
  },
}

const STATUS_EXPLANATIONS = {
  completed: {
    headline: 'Transaction Cleared — Low Risk',
    detail: 'The AI risk engine scored this transaction below the review threshold (30 points). No significant risk signals were detected, and the transaction was automatically approved and processed.',
    icon: ShieldCheck,
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  review: {
    headline: 'Flagged for Human Review — Moderate Risk',
    detail: 'The AI risk score fell between 30 and 69 points, indicating moderate risk. The transaction was held and escalated to a human reviewer. It will not be processed until an admin approves or rejects it.',
    icon: AlertTriangle,
    color: '#d97706',
    bg: '#fffbeb',
  },
  blocked: {
    headline: 'Transaction Blocked — High Risk',
    detail: 'The AI risk score reached 70 or above, triggering an automatic block. The transaction was rejected immediately to protect the sender. The customer has been notified and the incident has been logged to the blockchain audit trail.',
    icon: ShieldAlert,
    color: '#dc2626',
    bg: '#fef2f2',
  },
}

// ── AI Explanation Drawer ─────────────────────────────────────────────────────
function ExplanationDrawer({ tx, onClose }) {
  if (!tx) return null

  const reasons  = tx.metadata?.reasons ?? []
  const rsk      = tx.risk_score ?? tx.score ?? 0
  const st       = statusStyle(tx.status)
  const statusEx = STATUS_EXPLANATIONS[tx.status] ?? STATUS_EXPLANATIONS.completed
  const StatusIcon = statusEx.icon

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '480px',
        background: '#fff', zIndex: 101, overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #4338ca)', padding: '20px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} color="#a5b4fc" />
              <span style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Decision Explanation</span>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', padding: '6px', color: '#fff' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{tx.reference}</div>
          <div style={{ fontSize: '12px', color: '#a5b4fc' }}>{fmtDate(tx.created_at ?? tx.createdAt)}</div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Transaction summary */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={label}>From</span>
              <span style={value}>{tx.sender_name ?? '—'} · {tx.sender_phone ?? ''}</span>
            </div>
            <div style={{ height: '1px', background: '#e2e8f0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={label}>To</span>
              <span style={value}>{tx.recipient_name ?? tx.recipient_phone ?? tx.recipientPhone ?? '—'}</span>
            </div>
            <div style={{ height: '1px', background: '#e2e8f0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={label}>Amount</span>
              <span style={{ ...value, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{fmtAmount(tx.amount)}</span>
            </div>
          </div>

          {/* Risk score */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>AI Risk Score</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: riskColor(rsk) }}>{rsk} / 100</span>
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${rsk}%`, height: '100%', background: riskColor(rsk), borderRadius: '4px', transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>0 — Safe</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>30 — Review</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>70 — Block</span>
            </div>
          </div>

          {/* Status verdict */}
          <div style={{ background: statusEx.bg, borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <StatusIcon size={20} color={statusEx.color} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: statusEx.color, marginBottom: '4px' }}>{statusEx.headline}</div>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px' }}>{statusEx.detail}</div>
            </div>
          </div>

          {/* Risk flags */}
          {reasons.length > 0 ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                Why was this flagged? ({reasons.length} signal{reasons.length !== 1 ? 's' : ''} detected)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reasons.map(r => {
                  const ex = REASON_EXPLANATIONS[r] ?? { title: r, detail: 'No additional details available.', points: '?', icon: '⚠️', severity: 'medium' }
                  const isCritical = ex.severity === 'critical'
                  return (
                    <div key={r} style={{ background: isCritical ? '#fff5f5' : '#f8fafc', border: `1px solid ${isCritical ? '#fecaca' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>{ex.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: isCritical ? '#dc2626' : '#0f172a' }}>{ex.title}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>+{ex.points} risk points · {isCritical ? 'Critical' : 'Moderate'}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px' }}>{ex.detail}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
              ✓ No risk signals detected — transaction passed all checks cleanly.
            </div>
          )}

          {/* Blockchain */}
          {tx.blockchain_hash && (
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>⛓ Blockchain Record</div>
              <div style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all', fontFamily: 'monospace' }}>{tx.blockchain_hash}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>This decision is permanently recorded on the immutable audit ledger and cannot be altered.</div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

const label = { fontSize: '12px', color: '#94a3b8', fontWeight: 500 }
const value = { fontSize: '13px', color: '#374151', fontWeight: 600, textAlign: 'right' }

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LiveTransactions() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [live, setLive] = useState([])
  const [selected, setSelected] = useState(null)

  const query = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
  const { data, loading, reload } = useApi(`/api/transactions${query}`)

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
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>Click any transaction to see the full AI decision explanation</p>
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
          ].map(({ label: lbl, value: val, icon: Icon, ic }) => (
            <div key={lbl} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{lbl}</span>
                <Icon size={15} color={ic} />
              </div>
              <div style={{ fontSize: 'clamp(20px,3.5vw,26px)', fontWeight: 800, color: '#0f172a' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
          <Filter size={13} color="#94a3b8" />
          {filterBtns.map(btn => (
            <button key={btn.value} onClick={() => { setStatusFilter(btn.value); setLive([]) }}
              style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: statusFilter === btn.value ? '#4f6ef7' : '#f1f5f9', color: statusFilter === btn.value ? '#fff' : '#64748b' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                <Brain size={12} color="#4f6ef7" />
                <span style={{ color: '#4f6ef7', fontWeight: 600 }}>Click a row for AI explanation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: '#64748b' }}>SSE live updates</span>
              </div>
            </div>
          </div>

          {loading ? <Loading /> : allTxns.length === 0 ? (
            <EmptyState message="No transactions match this filter." icon="🔍" />
          ) : (
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Reference', 'Time', 'Sender → Recipient', 'Amount', 'Risk Score', 'Signals', 'Status', 'Blockchain'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allTxns.map((tx, i) => {
                    const st      = statusStyle(tx.status)
                    const ts      = tx.created_at ?? tx.createdAt
                    const rsk     = tx.risk_score ?? tx.score ?? 0
                    const reasons = tx.metadata?.reasons ?? []
                    const isSelected = selected?.id === tx.id
                    return (
                      <tr key={tx.id}
                        onClick={() => setSelected(isSelected ? null : tx)}
                        style={{ borderBottom: i < allTxns.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', background: isSelected ? '#f0f4ff' : 'transparent', transition: 'background 0.15s' }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                        <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{tx.reference}</td>
                        <td style={{ padding: '13px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} color="#94a3b8" />{fmtTime(ts)}</span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {tx.sender_name ?? '—'} → {tx.recipient_name ?? tx.recipient_phone ?? tx.recipientPhone}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{fmtAmount(tx.amount)}</td>
                        <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: riskColor(rsk), whiteSpace: 'nowrap' }}>{rsk}%</td>
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                          {reasons.length > 0 ? (
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                              {reasons.map(r => (
                                <span key={r} title={REASON_EXPLANATIONS[r]?.title ?? r}
                                  style={{ fontSize: '10px', background: r === 'recipient_flagged_in_alerts' ? '#fef2f2' : '#fefce8', color: r === 'recipient_flagged_in_alerts' ? '#dc2626' : '#92400e', border: `1px solid ${r === 'recipient_flagged_in_alerts' ? '#fecaca' : '#fde68a'}`, padding: '2px 6px', borderRadius: '5px', fontWeight: 600, cursor: 'help' }}>
                                  {REASON_EXPLANATIONS[r]?.icon ?? '⚠️'}
                                </span>
                              ))}
                            </div>
                          ) : <span style={{ color: '#94a3b8', fontSize: '12px' }}>None</span>}
                        </td>
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: '8px' }}>{st.label}</span>
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

      <ExplanationDrawer tx={selected} onClose={() => setSelected(null)} />
    </DashboardLayout>
  )
}
