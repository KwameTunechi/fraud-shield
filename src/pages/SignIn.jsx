import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [forgotSent, setForgotSent] = useState(false)
  const navigate = useNavigate()

  const handleForgotPassword = (e) => {
    e.preventDefault()
    setForgotSent(true)
    setTimeout(() => setForgotSent(false), 3000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/verify')
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px 14px 44px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8edfb 0%, #dde4f8 40%, #e0e8fb 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 8px 24px rgba(79,110,247,0.35)',
        }}>
          <Shield size={30} color="#fff" />
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#4f6ef7' }}>FraudShield</div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Enterprise Fraud Detection Platform</div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        border: '1px solid rgba(226,232,240,0.8)',
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          Organization Login
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
          Enter your credentials to access the dashboard
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="email"
                required
                placeholder="admin@organization.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ ...inputStyle, paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', fontWeight: 500, cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#4f6ef7', cursor: 'pointer' }} />
              Remember me
            </label>
            <button onClick={handleForgotPassword} style={{ background: 'none', border: 'none', fontSize: '14px', color: forgotSent ? '#16a34a' : '#4f6ef7', fontWeight: 500, textDecoration: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', padding: 0 }}>
              {forgotSent ? '✓ Reset link sent!' : 'Forgot password?'}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(79,110,247,0.35)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Sign In <ArrowRight size={16} />
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '14px' }}>
            Protected by enterprise-grade security
          </p>
        </form>
      </div>

      <Link to="/" style={{ marginTop: '24px', fontSize: '14px', color: '#4f6ef7', fontWeight: 500, textDecoration: 'none' }}>
        ← Back to home
      </Link>
    </div>
  )
}
