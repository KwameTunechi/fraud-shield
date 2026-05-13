import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle, AlertTriangle, TrendingUp, Brain, Fingerprint, Link2, MapPin, Clock, ShieldCheck } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

const alerts = [
  { id: 1, title: 'Unusual Login Location', desc: 'Login attempt from Dubai, UAE', time: '2 min ago', icon: AlertTriangle, bg: '#fffbeb', border: '#fde68a', iconBg: '#f59e0b', titleColor: '#d97706' },
  { id: 2, title: 'Transaction Verified', desc: 'Payment to Melcom Ghana cleared', time: '15 min ago', icon: CheckCircle, bg: '#f0fdf4', border: '#bbf7d0', iconBg: '#22c55e', titleColor: '#16a34a' },
  { id: 3, title: 'Security Score Updated', desc: 'Your trust score increased to 98.5%', time: '1 hour ago', icon: TrendingUp, bg: '#eff6ff', border: '#bfdbfe', iconBg: '#3b82f6', titleColor: '#2563eb', italic: true },
]

const liveTransactions = [
  { id: 'TXN-001', time: '14:23:45', location: 'Accra, Ghana', amount: '₵1,250.00', risk: 'Low', riskColor: '#22c55e', status: 'Safe', statusColor: '#16a34a', dotColor: '#22c55e' },
  { id: 'TXN-002', time: '14:23:42', location: 'Kumasi, Ghana', amount: '₵850.50', risk: 'Low', riskColor: '#22c55e', status: 'Safe', statusColor: '#16a34a', dotColor: '#22c55e' },
  { id: 'TXN-003', time: '14:23:38', location: 'London, UK', amount: '₵3,500.00', risk: 'Medium', riskColor: '#f59e0b', status: 'Review', statusColor: '#d97706', dotColor: '#f59e0b' },
  { id: 'TXN-004', time: '14:23:35', location: 'Takoradi, Ghana', amount: '₵450.00', risk: 'Low', riskColor: '#22c55e', status: 'Safe', statusColor: '#16a34a', dotColor: '#22c55e' },
]

const recentTxns = [
  { name: 'Melcom Ghana', cat: 'Shopping', amount: '₵287.50', time: 'Today, 2:30 PM', risk: 5, riskColor: '#16a34a', status: 'Safe', statusColor: '#16a34a', dotColor: '#22c55e', bg: '#fff7ed', emoji: '🛍️' },
  { name: 'Beans & Brews Cafe', cat: 'Food & Drink', amount: '₵42.45', time: 'Today, 10:15 AM', risk: 8, riskColor: '#16a34a', status: 'Safe', statusColor: '#16a34a', dotColor: '#22c55e', bg: '#f0fdf4', emoji: '☕' },
  { name: 'Salary Deposit', cat: 'Income', amount: '+₵8,250.00', time: 'Yesterday, 9:00 AM', risk: 2, riskColor: '#16a34a', status: 'Safe', statusColor: '#16a34a', dotColor: '#22c55e', bg: '#eff6ff', amountColor: '#16a34a', emoji: '↙️' },
  { name: 'ECG Payment', cat: 'Utilities', amount: '₵445.30', time: 'Jan 12, 4:20 PM', risk: 65, riskColor: '#d97706', status: 'Review', statusColor: '#d97706', dotColor: '#f59e0b', bg: '#faf5ff', emoji: '⚡' },
  { name: 'Unknown Merchant', cat: 'Suspicious', amount: '₵1,499.99', time: 'Jan 11, 11:45 PM', risk: 92, riskColor: '#dc2626', status: 'Blocked', statusColor: '#dc2626', dotColor: '#ef4444', bg: '#fef2f2', emoji: '🛒' },
]

const statusCards = [
  { icon: Brain, label: 'AI Detection', value: 'Active', bg: '#faf5ff', iconGrad: ['#a855f7', '#ec4899'], valueColor: '#9333ea' },
  { icon: Fingerprint, label: 'MFA Enabled', value: 'Secure', bg: '#eff6ff', iconGrad: ['#3b82f6', '#6366f1'], valueColor: '#2563eb' },
  { icon: Link2, label: 'Blockchain', value: 'Verified', bg: '#f0fdf4', iconGrad: ['#14b8a6', '#22c55e'], valueColor: '#059669' },
]

function RightPanel() {
  const navigate = useNavigate()
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Recent Transactions</span>
        <button onClick={() => navigate('/dashboard/transactions')} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#4f6ef7', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View All</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {recentTxns.map((txn) => (
          <div key={txn.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: txn.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {txn.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{txn.name}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: txn.amountColor || '#0f172a', flexShrink: 0, marginLeft: '6px' }}>{txn.amount}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{txn.cat}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{txn.time}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>· Risk: <strong style={{ color: txn.riskColor }}>{txn.risk}%</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, color: txn.statusColor }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: txn.dotColor, display: 'inline-block' }} />
                  {txn.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  return (
    <DashboardLayout rightPanel={<RightPanel />}>
      {/* Header banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)', padding: '24px 28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 800 }}>Fraud Shield</div>
            <div style={{ color: '#a5b4fc', fontSize: '13px', marginTop: '2px' }}>AI-Powered Protection</div>
          </div>
          <div onClick={() => navigate('/dashboard/alerts')} style={{ position: 'relative', cursor: 'pointer', padding: '6px' }}>
            <Bell size={20} color="#fff" />
            <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'block' }} />
          </div>
        </div>

        {/* User card */}
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '16px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(99,102,241,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>EA</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>Ebenezer Sika-Sackinor Amanor</div>
              <div style={{ color: '#a5b4fc', fontSize: '12px', marginTop: '1px' }}>ebenezeramanor@email.com</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                <ShieldCheck size={12} color="#93c5fd" />
                <span style={{ color: '#93c5fd', fontSize: '12px' }}>Trust Score: <strong style={{ color: '#fff' }}>98.5%</strong></span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', padding: '5px 12px', borderRadius: '999px' }}>
            <CheckCircle size={13} color="#4ade80" />
            <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600 }}>Verified</span>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="rg-3" style={{ padding: '20px 24px', marginTop: '-6px' }}>
        {statusCards.map(({ icon: Icon, label, value, bg, iconGrad, valueColor }) => (
          <div key={label} style={{ background: bg, borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `linear-gradient(135deg, ${iconGrad[0]}, ${iconGrad[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <Icon size={20} color="#fff" />
            </div>
            <div style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: valueColor, marginTop: '3px' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="page-pad" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Real-Time Alerts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Real-Time Alerts</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Live</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map(({ id, title, desc, time, icon: Icon, bg, border, iconBg, titleColor, italic }) => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: bg, border: `1px solid ${border}` }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: titleColor, fontStyle: italic ? 'italic' : 'normal' }}>{title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>{time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Transactions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Live Transactions</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#dcfce7', padding: '2px 8px', borderRadius: '999px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
            <button onClick={() => navigate('/dashboard/transactions')} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#4f6ef7', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View All →</button>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            {liveTransactions.map((txn, i) => (
              <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderBottom: i < liveTransactions.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={16} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{txn.id}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#94a3b8' }}><Clock size={11} /> {txn.time}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#94a3b8' }}><MapPin size={11} /> {txn.location}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{txn.amount}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: txn.riskColor }}>{txn.risk}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: txn.statusColor }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: txn.dotColor, display: 'inline-block' }} />
                      {txn.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
