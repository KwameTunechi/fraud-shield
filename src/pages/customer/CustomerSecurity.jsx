import CustomerLayout from '../../components/CustomerLayout'
import CustomerBottomNav from '../../components/CustomerBottomNav'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useCustomerApi } from '../../hooks/useCustomerApi'

const C = { primary:'#1652F0', primaryLight:'#EBF0FE', success:'#00875A', successLight:'#E3F5F0', warning:'#FF8B00', warningLight:'#FFF3E0', danger:'#DE350B', dangerLight:'#FFEBE6', text:'#0D1421', textSub:'#6B7280', textMuted:'#9CA3AF', bg:'#F5F7FA', surface:'#FFFFFF', border:'#E8ECEF' }

const SCENARIOS = [
  { id:'sim_swap',        title:'SIM Swap Attack',          description:'Attacker ports your number to a new SIM card to intercept OTP codes.',     severity:'CRITICAL', color:C.danger,  bg:C.dangerLight },
  { id:'phishing',        title:'Phishing Attempt',         description:'Fraudulent SMS mimicking FraudShield prompts you to share your PIN.',       severity:'HIGH',     color:C.warning, bg:C.warningLight },
  { id:'account_takeover',title:'Account Takeover',         description:'Repeated failed PIN attempts trigger an account lockout.',                  severity:'HIGH',     color:C.warning, bg:C.warningLight },
  { id:'unusual_amount',  title:'Unusual Large Transfer',   description:'AI flags a transfer 10× your rolling average as anomalous.',               severity:'MEDIUM',   color:C.primary, bg:C.primaryLight },
]

function trustColor(score) {
  if (score >= 80) return C.success
  if (score >= 60) return C.warning
  return C.danger
}

const LAYER_ICONS = {
  ai:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  chain: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00875A" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  mfa:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1652F0" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

export default function CustomerSecurity() {
  const { customer } = useCustomerAuth()
  const { data: aiData    } = useCustomerApi('/api/ai-config')
  const { data: chainData } = useCustomerApi('/api/blockchain/verify')

  const trust  = customer?.trustScore ?? 0
  const tColor = trustColor(trust)

  const LAYERS = [
    { icon: LAYER_ICONS.ai,    title:'AI Anomaly Detection', desc:'Real-time scoring on every transaction', active: aiData ? Object.values(aiData).some(Boolean) : true,  color:'#7C3AED' },
    { icon: LAYER_ICONS.chain, title:'Blockchain Ledger',    desc:'Immutable permissioned audit trail',     active: chainData?.ok ?? true,                                  color:C.success },
    { icon: LAYER_ICONS.mfa,   title:'Multi-Factor Auth',    desc:'PIN + OTP + Biometric',                 active: customer?.mfaEnabled ?? false,                          color:C.primary },
  ]

  const Header = (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: '20px', fontWeight: '800', color: C.text }}>Security</div>
    </div>
  )

  return (
    <CustomerLayout header={Header}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '90px' }}>

        {/* Trust score */}
        <div style={{ background: C.surface, borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: C.textSub, fontWeight: '600' }}>Your Trust Score</div>
            <div style={{ fontSize: '40px', fontWeight: '800', color: tColor, marginTop: '2px' }}>{trust}%</div>
            <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '6px', lineHeight: '17px', maxWidth: '220px' }}>
              Based on transaction history, MFA usage, and AI behaviour profile
            </div>
          </div>
          <div style={{ width: '20px', height: '80px', background: C.bg, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: `${trust}%`, minHeight: '4px', background: tColor, borderRadius: '10px' }} />
          </div>
        </div>

        {/* Protection layers */}
        <div style={card}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>Active Protection Layers</div>
          {LAYERS.map((l, i) => (
            <div key={l.title}>
              {i > 0 && <div style={{ height: '1px', background: C.border }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: i > 0 ? '12px 0 0' : '4px 0 0' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: l.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {l.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '2px' }}>{l.title}</div>
                  <div style={{ fontSize: '12px', color: C.textSub }}>{l.desc}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '999px', background: l.active ? C.successLight : C.bg, flexShrink: 0 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '3px', background: l.active ? C.success : C.textMuted }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: l.active ? C.success : C.textMuted }}>{l.active ? 'Active' : 'Off'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fraud simulator */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>Fraud Scenario Simulator</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.primaryLight, padding: '3px 8px', borderRadius: '999px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: C.primary }}>⚗ Lab</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: C.textSub, marginTop: '-8px' }}>Tap a scenario to see how the system responds</div>
          {SCENARIOS.map((s, i) => (
            <div key={s.id}>
              {i > 0 && <div style={{ height: '1px', background: C.border }} />}
              <button onClick={() => alert(`${s.title}\n\n${s.description}\n\nSeverity: ${s.severity}\n\nThe AI risk engine would flag this transaction and trigger a review or block, depending on the configured thresholds.`)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit', padding: i > 0 ? '12px 0 0' : '4px 0 0' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '18px' }}>
                  {s.id === 'sim_swap' ? '📱' : s.id === 'phishing' ? '✉' : s.id === 'account_takeover' ? '🔒' : '📈'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>{s.title}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: s.color, background: s.bg, padding: '2px 6px', borderRadius: '6px', letterSpacing: '0.3px' }}>{s.severity}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: C.textSub, lineHeight: '17px' }}>{s.description}</div>
                </div>
                <span style={{ color: C.textMuted, flexShrink: 0 }}>›</span>
              </button>
            </div>
          ))}
        </div>

        <div style={{ height: '8px' }} />
      </div>
      <CustomerBottomNav />
    </CustomerLayout>
  )
}

const card = { background: '#FFFFFF', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
