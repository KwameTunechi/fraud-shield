import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Link2, Search, CheckCircle, Clock, MapPin } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

const blocks = [
  { title: 'Transaction Verification', hash: '#0x7a9f2c...8e4d1b', from: '0x1a2b3c...4d5e6f', to: '0x9f8e7d...6c5b4a', blocks: 3, time: '2 minutes ago', location: 'Accra, Ghana', amount: '₵4,125.00', status: 'Confirmed' },
  { title: 'User Authentication', hash: '#0x4b8c1d...2a9f3e', from: '0x5f6e7d...8c9b0a', to: '0x3c4d5e...6f7a8b', blocks: 6, time: '15 minutes ago', location: 'Kumasi, Ghana', amount: null, status: 'Confirmed' },
  { title: 'Security Event', hash: '#0x9e3f2a...7c8d1b', from: '0x2b3c4d...5e6f7a', to: '0x8b9c0a...1d2e3f', blocks: 0, time: '1 hour ago', location: 'Lagos, Nigeria', amount: null, status: 'Pending' },
  { title: 'Account Update', hash: '#0x6c7d8e...9f0a1b', from: '0x4d5e6f...7a8b9c', to: '0x0a1b2c...3d4e5f', blocks: 12, time: '3 hours ago', location: 'Takoradi, Ghana', amount: null, status: 'Confirmed' },
  { title: 'Transaction Verification', hash: '#0x3d4e5f...6a7b8c', from: '0x7a8b9c...0d1e2f', to: '0x5e6f7a...8b9c0d', blocks: 8, time: '5 hours ago', location: 'Tamale, Ghana', amount: '₵2,850.50', status: 'Confirmed' },
]
const statusBadge = (s) => s === 'Confirmed' ? { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' } : { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }

export default function BlockchainLedger() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const filtered = search
    ? blocks.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.hash.toLowerCase().includes(search.toLowerCase()) ||
        b.location.toLowerCase().includes(search.toLowerCase()) ||
        b.from.toLowerCase().includes(search.toLowerCase()) ||
        b.to.toLowerCase().includes(search.toLowerCase())
      )
    : blocks
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
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', margin: '3px 0 0' }}>Immutable transaction records & verification</p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by hash, address, or location..." style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', background: '#fff', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box' }} />
        </div>

        <div className="rg-6" style={{ marginBottom: '22px' }}>
          {[
            { label: 'Total Blocks', value: '12,480' }, { label: 'Verified', value: '12,455' },
            { label: 'Pending', value: '25' }, { label: 'Total Value', value: '₵1.2M' },
            { label: 'Transactions', value: '1,248' }, { label: 'Uptime', value: '100%' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '13px', padding: '14px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 'clamp(14px,2vw,18px)', fontWeight: 800, color: '#4f6ef7', marginBottom: '3px' }}>{value}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Recent Blocks</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>No blocks match your search.</div>
          )}
          {filtered.map((block, i) => {
            const st = statusBadge(block.status)
            return (
              <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg, #0d9488, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Link2 size={16} color="#fff" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{block.title}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.hash}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: '999px', flexShrink: 0 }}>{block.status}</span>
                </div>
                <div className="rg-2" style={{ marginBottom: '10px', paddingLeft: '50px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>From</div>
                    <div style={{ fontSize: '11px', color: '#0f172a', fontFamily: 'monospace' }}>{block.from}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>To</div>
                    <div style={{ fontSize: '11px', color: '#0f172a', fontFamily: 'monospace' }}>{block.to}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '50px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16a34a' }}><CheckCircle size={11} /> {block.blocks} blocks</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#94a3b8' }}><Clock size={10} /> {block.time}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#94a3b8' }}><MapPin size={10} /> {block.location}</span>
                  {block.amount && <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginLeft: 'auto' }}>{block.amount}</span>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)', borderRadius: '18px', padding: '24px 28px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Network Status</h3>
          <div className="rg-4">
            {[{ label: 'Block Height', value: '12,480' }, { label: 'Gas Price', value: '45 gwei' }, { label: 'TPS', value: '2,500' }, { label: 'Uptime', value: '100%' }].map(({ label, value }) => (
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
