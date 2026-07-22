import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Clock, User, CreditCard,
  ShieldAlert, ShieldCheck, History, AlertCircle, X, Brain,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import { useApi } from '../hooks/useApi'
import { api } from '../api/client'
import { REASON_EXPLANATIONS, STATUS_EXPLANATIONS } from '../utils/riskExplanations'

const SEVERITY = {
  critical: { iconBg: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Critical', Icon: AlertTriangle },
  high:     { iconBg: '#f97316', bg: '#fff7ed', border: '#fed7aa', label: 'High',     Icon: AlertTriangle },
  medium:   { iconBg: '#eab308', bg: '#fefce8', border: '#fef08a', label: 'Medium',   Icon: AlertCircle  },
  low:      { iconBg: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Low',      Icon: CheckCircle  },
}

function fmtMoney(n) {
  return '₵' + Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2 })
}

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtRelative(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

function riskBadge(score) {
  if (score >= 70) return { label: 'Blocked',  bg: '#fef2f2', color: '#ef4444' }
  if (score >= 30) return { label: 'Review',   bg: '#fff7ed', color: '#f97316' }
  return                  { label: 'Safe',     bg: '#f0fdf4', color: '#16a34a' }
}

function statusBadge(status) {
  if (status === 'completed') return { label: 'Completed', bg: '#f0fdf4', color: '#16a34a' }
  if (status === 'blocked')   return { label: 'Blocked',   bg: '#fef2f2', color: '#ef4444' }
  return                              { label: 'In Review', bg: '#fff7ed', color: '#f97316' }
}

function ConfirmModal({ message, confirmLabel, confirmColor, onConfirm, onClose, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '18px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{message}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, marginLeft: '12px' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: confirmColor, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'Inter, sans-serif' }}>
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IncidentDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const alert = location.state?.alert ?? null

  const txId = alert?.transaction_id
  const userId = alert?.user_id

  const { data: txData,       loading: txLoading   } = useApi(txId   ? `/api/transactions/${txId}` : null)
  const { data: customerData, loading: custLoading  } = useApi(userId ? `/api/customers/${userId}`  : null)

  const [modal,    setModal]    = useState(null)
  const [acting,   setActing]   = useState(false)
  const [resolved, setResolved] = useState(alert?.resolved ?? false)
  const [txStatus, setTxStatus] = useState(null)

  const tx       = txData ?? null
  const customer = customerData?.customer ?? null
  const history  = customerData?.transactions ?? []
  const sev      = SEVERITY[alert?.severity] ?? SEVERITY.low
  const { Icon } = sev

  const currentTxStatus = txStatus ?? tx?.status
  const rb = currentTxStatus ? statusBadge(currentTxStatus) : null

  async function handleResolve() {
    setActing(true)
    try {
      await api.put(`/api/alerts/${id}/resolve`)
      setResolved(true)
    } catch { /* ignore */ }
    setActing(false)
    setModal(null)
  }

  async function handleApprove() {
    setActing(true)
    try {
      await api.put(`/api/transactions/${txId}/status`, { status: 'completed' })
      setTxStatus('completed')
      await api.put(`/api/alerts/${id}/resolve`)
      setResolved(true)
    } catch { /* ignore */ }
    setActing(false)
    setModal(null)
  }

  async function handleReject() {
    setActing(true)
    try {
      await api.put(`/api/transactions/${txId}/status`, { status: 'blocked' })
      setTxStatus('blocked')
      await api.put(`/api/alerts/${id}/resolve`)
      setResolved(true)
    } catch { /* ignore */ }
    setActing(false)
    setModal(null)
  }

  if (!alert) {
    return (
      <DashboardLayout>
        <div className="page-pad" style={{ textAlign: 'center', paddingTop: '80px', color: '#94a3b8' }}>
          <AlertCircle size={40} style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Incident not found</div>
          <button onClick={() => navigate('/dashboard/alerts')}
            style={{ marginTop: '16px', padding: '8px 18px', borderRadius: '10px', background: '#4f6ef7', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            Back to Alerts
          </button>
        </div>
      </DashboardLayout>
    )
  }

  // Integrity violation alerts have no transaction — render a dedicated view
  if (alert.type === 'integrity_violation') {
    return (
      <DashboardLayout>
        <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
          <button onClick={() => navigate('/dashboard/alerts')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Alerts
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(16px,3.5vw,22px)', fontWeight: 800, margin: 0 }}>Blockchain Integrity Check</h1>
              <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>{fmtRelative(alert.created_at)} · Critical severity</p>
            </div>
            {alert.resolved && <span style={{ marginLeft: 'auto', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', flexShrink: 0 }}>Resolved</span>}
          </div>
        </div>
        <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>What happened?</div>
            <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
              The automated blockchain ledger audit, which runs every 10 minutes, detected that a stored entry's hash did not match the expected value. This can indicate data tampering, an unexpected database modification, or a system anomaly during a transaction write.
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Audit Details</div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{alert.description}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Detected at: {fmtDate(alert.created_at)}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={16} color="#16a34a" />
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>Current Status: Chain Healthy</div>
            </div>
            <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
              The most recent automated verification confirms the full blockchain ledger is intact. All {113} entries have valid hashes and an unbroken chain. No further action is required.
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/alerts')}
            style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#4f6ef7', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Back to Alerts
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const reasons = (() => {
    try {
      const m = typeof tx?.metadata === 'string' ? JSON.parse(tx.metadata) : tx?.metadata
      return m?.reasons ?? []
    } catch { return [] }
  })()

  return (
    <DashboardLayout>
      {modal === 'resolve' && (
        <ConfirmModal
          message="Mark this alert as resolved? No changes to the transaction will be made."
          confirmLabel="Mark Resolved" confirmColor="#4f6ef7"
          onConfirm={handleResolve} onClose={() => setModal(null)} loading={acting}
        />
      )}
      {modal === 'approve' && (
        <ConfirmModal
          message="Approve this transaction? The funds will be confirmed and the alert resolved."
          confirmLabel="Approve" confirmColor="#16a34a"
          onConfirm={handleApprove} onClose={() => setModal(null)} loading={acting}
        />
      )}
      {modal === 'reject' && (
        <ConfirmModal
          message="Reject and block this transaction? The sender's balance will be refunded."
          confirmLabel="Reject & Refund" confirmColor="#ef4444"
          onConfirm={handleReject} onClose={() => setModal(null)} loading={acting}
        />
      )}

      {/* Header */}
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard/alerts')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back to Alerts
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: sev.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(16px,3.5vw,22px)', fontWeight: 800, margin: 0 }}>{alert.title}</h1>
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>{fmtRelative(alert.created_at)} · {sev.label} severity</p>
          </div>
          {resolved && (
            <span style={{ marginLeft: 'auto', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', flexShrink: 0 }}>
              Resolved
            </span>
          )}
        </div>
      </div>

      <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Alert summary */}
        <div style={{ background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: '14px', padding: '18px 20px' }}>
          <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{alert.description}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
            <Clock size={12} /> {fmtDate(alert.created_at)}
          </div>
        </div>

        {/* Transaction details */}
        {txId && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CreditCard size={15} color="#4f6ef7" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Transaction Details</span>
              {rb && !txLoading && (
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: rb.color, background: rb.bg, padding: '3px 10px', borderRadius: '999px' }}>
                  {rb.label}
                </span>
              )}
            </div>
            {txLoading ? <Loading /> : tx ? (
              <>
                {/* Parties involved — sender & recipient, so support can reach
                    either party directly when investigating a flagged issue */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Sender</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '2px', wordBreak: 'break-word' }}>{tx.sender_name || '—'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>{tx.sender_phone || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#cbd5e1', flexShrink: 0 }}>
                    <ArrowRight size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>Recipient</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '2px', wordBreak: 'break-word' }}>{tx.recipient_name || 'Unregistered recipient'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>{tx.recipient_phone || '—'}</div>
                  </div>
                </div>

                <div className="rg-2" style={{ gap: '12px', marginBottom: '14px' }}>
                  {[
                    { label: 'Amount',     value: fmtMoney(tx.amount) },
                    { label: 'Risk Score', value: tx.risk_score != null ? `${tx.risk_score}/100` : '—' },
                    { label: 'Reference',  value: tx.reference },
                    { label: 'Category',   value: tx.category },
                    { label: 'Date',       value: fmtDate(tx.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>{label}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* AI Risk score bar */}
                {tx.risk_score != null && (() => {
                  const rsk = tx.risk_score
                  const rColor = rsk < 30 ? '#16a34a' : rsk < 70 ? '#d97706' : '#dc2626'
                  const statusEx = STATUS_EXPLANATIONS[currentTxStatus] ?? STATUS_EXPLANATIONS.completed
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                      {/* Score bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Brain size={13} color="#4f6ef7" />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>AI Risk Score</span>
                          </div>
                          <span style={{ fontSize: '18px', fontWeight: 800, color: rColor }}>{rsk} / 100</span>
                        </div>
                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${rsk}%`, height: '100%', background: rColor, borderRadius: '4px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>0 — Safe</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>30 — Review</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>70 — Block</span>
                        </div>
                      </div>

                      {/* Verdict */}
                      <div style={{ background: statusEx.bg, borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: statusEx.color, marginBottom: '4px' }}>{statusEx.headline}</div>
                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px' }}>{statusEx.detail}</div>
                      </div>

                      {/* Explanation cards */}
                      {reasons.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                            Why was this flagged? ({reasons.length} signal{reasons.length !== 1 ? 's' : ''} detected)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {reasons.map(r => {
                              const ex = REASON_EXPLANATIONS[r] ?? { title: r, detail: 'No additional details.', points: '?', icon: '⚠️', severity: 'medium' }
                              const isCritical = ex.severity === 'critical'
                              return (
                                <div key={r} style={{ background: isCritical ? '#fff5f5' : '#f8fafc', border: `1px solid ${isCritical ? '#fecaca' : '#e2e8f0'}`, borderRadius: '10px', padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{ex.icon}</span>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '12px', fontWeight: 700, color: isCritical ? '#dc2626' : '#0f172a' }}>{ex.title}</div>
                                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>+{ex.points} risk points · {isCritical ? 'Critical' : 'Moderate'}</div>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: '17px' }}>{ex.detail}</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Action buttons */}
                {!resolved && currentTxStatus === 'review' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button onClick={() => setModal('reject')}
                      style={{ flex: 1, minWidth: '120px', padding: '11px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} /> Reject & Refund
                    </button>
                    <button onClick={() => setModal('approve')}
                      style={{ flex: 1, minWidth: '120px', padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} /> Approve
                    </button>
                  </div>
                )}
                {!resolved && currentTxStatus !== 'review' && (
                  <div style={{ marginTop: '16px' }}>
                    <button onClick={() => setModal('resolve')}
                      style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: '#4f6ef7', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Mark Alert Resolved
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Transaction not found</div>
            )}
          </div>
        )}

        {/* Customer details */}
        {userId && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <User size={15} color="#4f6ef7" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Customer Profile</span>
              {customer && (
                <button onClick={() => navigate(`/dashboard/customers/${userId}`)}
                  style={{ marginLeft: 'auto', fontSize: '11px', color: '#4f6ef7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  View full profile →
                </button>
              )}
            </div>
            {custLoading ? <Loading /> : customer ? (
              <div className="rg-2" style={{ gap: '12px' }}>
                {[
                  { label: 'Name',        value: customer.full_name },
                  { label: 'Phone',       value: customer.phone_number },
                  { label: 'Balance',     value: fmtMoney(customer.balance) },
                  { label: 'Trust Score', value: `${customer.trust_score ?? 0}%` },
                  { label: 'Joined',      value: fmtDate(customer.created_at) },
                  { label: 'MFA',         value: customer.mfa_enabled ? 'Enabled' : 'Not set' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Customer not found</div>
            )}
          </div>
        )}

        {/* Transaction history */}
        {userId && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <History size={15} color="#4f6ef7" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Transaction History</span>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>Last 50 transactions</span>
            </div>
            {custLoading ? <Loading /> : history.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>No transactions found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {history.map((t, i) => {
                  const risk = riskBadge(t.risk_score ?? 0)
                  const st   = statusBadge(t.status)
                  const isThis = t.id === txId
                  return (
                    <div key={t.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 0',
                        borderBottom: i < history.length - 1 ? '1px solid #f8fafc' : 'none',
                        background: isThis ? '#fefce8' : 'transparent',
                        borderRadius: isThis ? '8px' : '0',
                        paddingLeft: isThis ? '10px' : '0',
                        paddingRight: isThis ? '10px' : '0',
                      }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CreditCard size={16} color="#64748b" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {t.recipient_phone}
                          {isThis && <span style={{ fontSize: '10px', fontWeight: 700, color: '#ca8a04', background: '#fef9c3', padding: '2px 6px', borderRadius: '4px' }}>THIS TRANSACTION</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{fmtDate(t.created_at)}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{fmtMoney(t.amount)}</div>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: risk.color, background: risk.bg, padding: '2px 6px', borderRadius: '4px' }}>{risk.label}</span>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: st.color, background: st.bg, padding: '2px 6px', borderRadius: '4px' }}>{st.label}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Resolve-only button (no transaction) */}
        {!txId && !resolved && (
          <button onClick={() => setModal('resolve')}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', border: 'none', background: '#4f6ef7', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Mark Resolved
          </button>
        )}

      </div>
    </DashboardLayout>
  )
}
