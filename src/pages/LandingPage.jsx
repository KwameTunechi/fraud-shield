import { Link } from 'react-router-dom'
import { Brain, Fingerprint, Link2, Shield, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'

const features = [
  { icon: Brain, title: 'AI-Powered Detection', desc: 'Advanced machine learning algorithms detect fraud in real-time' },
  { icon: Fingerprint, title: 'Multi-Factor Authentication', desc: 'Enterprise-grade security with biometric verification' },
  { icon: Link2, title: 'Blockchain Verification', desc: 'Immutable ledger for transaction transparency' },
  { icon: Shield, title: 'Real-Time Monitoring', desc: '24/7 protection with instant alerts' },
]

const stats = [
  { value: '99.8%', label: 'Detection Rate' },
  { value: '<100ms', label: 'Response Time' },
  { value: '24/7', label: 'Live Monitoring' },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8edfb 0%, #dde4f8 40%, #e0e8fb 100%)' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ padding: 'clamp(40px,8vw,80px) clamp(16px,4vw,32px) clamp(32px,6vw,64px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 18px', borderRadius: '999px', background: 'rgba(255,255,255,0.8)', border: '1px solid #c7d2f8', color: '#4f6ef7', fontSize: 'clamp(11px,2vw,13px)', fontWeight: 600, marginBottom: '24px', boxShadow: '0 1px 4px rgba(79,110,247,0.08)' }}>
            Ghana's Leading Fraud Detection Platform
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 6vw, 56px)', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '18px' }}>
            Enterprise Fraud Detection{' '}
            <span style={{ background: 'linear-gradient(90deg, #4f6ef7, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Powered by AI
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', color: '#64748b', lineHeight: 1.7, marginBottom: '36px', maxWidth: '540px', margin: '0 auto 36px' }}>
            Protect your organization with cutting-edge AI, MFA, and blockchain technology. Detect anomalies before they become threats.
          </p>

          <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: 'clamp(10px,2vw,14px) clamp(20px,4vw,32px)', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', color: '#fff', borderRadius: '12px', fontWeight: 700, fontSize: 'clamp(14px,2vw,16px)', textDecoration: 'none', boxShadow: '0 8px 24px rgba(79,110,247,0.35)' }}>
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section style={{ padding: '0 clamp(16px,4vw,32px) clamp(32px,5vw,48px)' }}>
        <div className="rg-4" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: '#fff', borderRadius: '20px', padding: 'clamp(18px,3vw,28px) clamp(16px,2.5vw,24px)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 12px rgba(79,110,247,0.3)' }}>
                <Icon size={22} color="#fff" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 'clamp(13px,1.5vw,15px)', color: '#0f172a', marginBottom: '8px' }}>{title}</div>
              <div style={{ fontSize: 'clamp(12px,1.2vw,13px)', color: '#6366f1', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '0 clamp(16px,4vw,32px) clamp(48px,8vw,80px)' }}>
        <div className="rg-3" style={{ maxWidth: '780px', margin: '0 auto' }}>
          {stats.map(({ value, label }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '20px', padding: 'clamp(24px,4vw,36px) 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 900, background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px' }}>
                {value}
              </div>
              <div style={{ fontSize: 'clamp(12px,1.5vw,14px)', color: '#64748b', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
