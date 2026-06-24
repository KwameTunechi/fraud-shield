import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerLayout from '../../components/CustomerLayout'
import CustomerBottomNav from '../../components/CustomerBottomNav'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useCustomerApi } from '../../hooks/useCustomerApi'

const C = { primary:'#1652F0', primaryLight:'#EBF0FE', success:'#00875A', successLight:'#E3F5F0', warning:'#FF8B00', danger:'#DE350B', text:'#0D1421', textSub:'#6B7280', textMuted:'#9CA3AF', bg:'#F5F7FA', surface:'#FFFFFF', border:'#E8ECEF' }

function fmtMoney(n) { return '₵' + Number(n||0).toLocaleString('en-US', { minimumFractionDigits: 2 }) }

function MenuItem({ icon, label, sublabel, onPress, destructive }) {
  return (
    <button onClick={onPress}
      style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '14px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: destructive ? C.danger + '15' : C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: destructive ? C.danger : C.text }}>{label}</div>
        {sublabel && <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '1px' }}>{sublabel}</div>}
      </div>
      <span style={{ color: C.textMuted, fontSize: '18px', flexShrink: 0 }}>›</span>
    </button>
  )
}

export default function CustomerProfile() {
  const navigate   = useNavigate()
  const { customer, signOut } = useCustomerAuth()
  const { data: txData    } = useCustomerApi('/api/transactions?limit=100')
  const { data: alertData } = useCustomerApi('/api/alerts?limit=100')
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const txCount    = txData?.transactions?.length ?? 0
  const alertCount = alertData?.alerts?.length    ?? 0
  const trust      = customer?.trustScore ?? 0
  const tColor     = trust >= 80 ? C.success : trust >= 60 ? C.warning : C.danger
  const initials   = (customer?.fullName ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleSignOut() { await signOut(); navigate('/app/signin', { replace: true }) }

  const Header = (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: '20px', fontWeight: '800', color: C.text }}>Profile</div>
    </div>
  )

  return (
    <CustomerLayout header={Header}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '90px' }}>

        {/* Avatar + name */}
        <div style={{ background: C.surface, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '36px', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>
            {initials}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: C.text }}>{customer?.fullName ?? 'Customer'}</div>
          <div style={{ fontSize: '14px', color: C.textSub }}>{customer?.phone ?? ''}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: C.successLight, padding: '5px 12px', borderRadius: '999px', marginTop: '4px' }}>
            <span style={{ color: C.success }}>✓</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: C.success }}>KYC Verified</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: C.surface, borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {[
            { value: `${trust}%`, label: 'Trust Score', color: tColor },
            { value: txCount,     label: 'Transactions' },
            { value: fmtMoney(customer?.balance ?? 0), label: 'Balance' },
          ].map(({ value, label, color }, i) => (
            <div key={label} style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '36px', background: C.border }} />}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '17px', fontWeight: '800', color: color ?? C.text }}>{value}</div>
                <div style={{ fontSize: '11px', color: C.textMuted, fontWeight: '500' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Account */}
        <div>
          <div style={sectionTitle}>Account</div>
          <div style={menuCard}>
            <MenuItem icon="👤" label="Personal Information" sublabel="Name, phone number"
              onPress={() => alert(`Name: ${customer?.fullName ?? '—'}\nPhone: ${customer?.phone ?? '—'}`)} />
            <div style={{ height: '1px', background: C.border, marginLeft: '66px' }} />
            <MenuItem icon="💳" label="Payment Methods" sublabel="Linked accounts"
              onPress={() => alert('Telecel Cash account is your default payment method.')} />
            <div style={{ height: '1px', background: C.border, marginLeft: '66px' }} />
            <MenuItem icon="🧾" label="Transaction History" sublabel={`${txCount} transactions`}
              onPress={() => navigate('/app/transactions')} />
          </div>
        </div>

        {/* Security */}
        <div>
          <div style={sectionTitle}>Security</div>
          <div style={menuCard}>
            <MenuItem icon="🔢" label="Change PIN"
              onPress={() => alert('Sign out and sign back in to set a new PIN.')} />
            <div style={{ height: '1px', background: C.border, marginLeft: '66px' }} />
            <MenuItem icon="🔐" label="Biometric Login" sublabel={customer?.mfaEnabled ? 'Enabled' : 'Not set'}
              onPress={() => alert('Face ID / fingerprint login is set up automatically on next sign-in.')} />
            <div style={{ height: '1px', background: C.border, marginLeft: '66px' }} />
            <MenuItem icon="🔔" label="Notifications"
              onPress={() => alert('Push notifications are enabled for fraud alerts and transaction updates.')} />
          </div>
        </div>

        {/* Support */}
        <div>
          <div style={sectionTitle}>Support</div>
          <div style={menuCard}>
            <MenuItem icon="❓" label="Help & Support"
              onPress={() => alert('Email: support@fraudshield.app\nPhone: +233 30 000 0000\n\nAvailable Mon–Fri, 8am–6pm GMT')} />
            <div style={{ height: '1px', background: C.border, marginLeft: '66px' }} />
            <MenuItem icon="ℹ" label="About FraudShield" sublabel="Version 1.0.0"
              onPress={() => alert('FraudShield v1.0.0\nAI-powered fraud detection for Ghana mobile money.\n\n© 2026 FraudShield Ghana')} />
          </div>
        </div>

        {/* Sign out */}
        <div style={menuCard}>
          <MenuItem icon="↩" label="Sign Out" destructive onPress={() => setConfirmSignOut(true)} />
        </div>

        <div style={{ height: '8px' }} />
      </div>

      {/* Confirm sign-out modal */}
      {confirmSignOut && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div style={{ background: C.surface, borderRadius: '20px', padding: '24px', maxWidth: '320px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: C.text }}>Sign Out</div>
            <div style={{ fontSize: '14px', color: C.textSub }}>Are you sure you want to sign out?</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmSignOut(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`, background: C.surface, color: C.textSub, fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleSignOut}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: C.danger, color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerBottomNav />
    </CustomerLayout>
  )
}

const sectionTitle = { fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', paddingLeft: '4px' }
const menuCard = { background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
