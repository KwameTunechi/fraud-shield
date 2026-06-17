import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Shield, Bell, Users, Database, ChevronRight, LogOut, Lock, UserCog, Check, X } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { api } from '../api/client'

function cap(str) {
  if (!str) return ''
  return String(str).charAt(0).toUpperCase() + String(str).slice(1)
}

// Keys that are boolean and toggle on click
const BOOLEAN_KEYS = {
  auditLogs:         { on: 'Enabled', off: 'Disabled' },
  emailAlerts:       { on: 'On', off: 'Off' },
  pushNotifications: { on: 'On', off: 'Off' },
  smsAlerts:         { on: 'On', off: 'Off' },
}

// Keys that open an edit modal with select options
const SELECT_OPTIONS = {
  mfaPolicy:      ['enforced', 'optional', 'disabled'],
  apiAccess:      ['limited', 'full', 'restricted'],
  backupSchedule: ['daily', 'weekly', 'monthly'],
}

// Keys that open an edit modal with a number input
const NUMBER_KEYS = {
  sessionTimeout: { label: 'Session Timeout', unit: 'minutes', min: 5, max: 480 },
  dataRetention:  { label: 'Data Retention',  unit: 'days',    min: 7, max: 365 },
}

// Keys that are purely read-only
const READONLY_KEYS = new Set(['apiVersion', 'administrators', 'mfaCoverage', 'accessControl'])

function EditModal({ fieldKey, current, onSave, onClose }) {
  const isSelect = !!SELECT_OPTIONS[fieldKey]
  const isNumber = !!NUMBER_KEYS[fieldKey]
  const meta = NUMBER_KEYS[fieldKey] ?? {}

  const [val, setVal] = useState(isNumber ? String(current ?? meta.min) : current ?? SELECT_OPTIONS[fieldKey]?.[0])
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(fieldKey, isNumber ? Number(val) : val)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '18px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            {isNumber ? meta.label : cap(fieldKey.replace(/([A-Z])/g, ' $1'))}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {isSelect && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SELECT_OPTIONS[fieldKey].map(opt => (
              <div key={opt} onClick={() => setVal(opt)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', border: `2px solid ${val === opt ? '#4f6ef7' : '#f1f5f9'}`, background: val === opt ? '#eef2ff' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '13px', fontWeight: val === opt ? 700 : 500, color: val === opt ? '#4f6ef7' : '#374151', textTransform: 'capitalize' }}>{opt}</span>
                {val === opt && <Check size={14} color="#4f6ef7" />}
              </div>
            ))}
          </div>
        )}

        {isNumber && (
          <div>
            <input
              type="number"
              min={meta.min}
              max={meta.max}
              value={val}
              onChange={e => setVal(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '16px', fontWeight: 600, color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
              onFocus={e => e.target.style.borderColor = '#4f6ef7'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{meta.min}–{meta.max} {meta.unit}</div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', marginTop: '20px', padding: '13px', borderRadius: '10px', background: saving ? '#a5b4fc' : 'linear-gradient(135deg, #4f6ef7, #7c3aed)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default function SystemSettings() {
  const navigate = useNavigate()
  const { admin, signOut } = useAuth()
  const { data: cfg, loading, mutate } = useApi('/api/settings')
  const { data: adminsData }           = useApi('/api/admins')

  const [settings, setSettings] = useState({})
  const [editing,  setEditing]  = useState(null)   // { key, current }
  const [toggling, setToggling] = useState(null)   // key being toggled

  // Sync server data into local state on first load
  useEffect(() => { if (cfg) setSettings(cfg) }, [cfg])

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin', { replace: true })
  }

  async function saveSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))   // optimistic
    setEditing(null)
    try {
      await api.put('/api/settings', { [key]: value })
    } catch {
      setSettings(cfg ?? {})   // revert on failure
    }
  }

  async function toggleBoolean(key) {
    if (toggling) return
    const current = settings[key]
    const next = key === 'smsAlerts' ? current !== true : current === false
    setSettings(prev => ({ ...prev, [key]: next }))    // optimistic
    setToggling(key)
    try {
      await api.put('/api/settings', { [key]: next })
    } catch {
      setSettings(prev => ({ ...prev, [key]: current }))   // revert
    }
    setToggling(null)
  }

  function handleRowClick(key, rawValue) {
    if (READONLY_KEYS.has(key)) return
    if (BOOLEAN_KEYS[key]) { toggleBoolean(key); return }
    if (SELECT_OPTIONS[key] || NUMBER_KEYS[key]) setEditing({ key, current: rawValue })
  }

  const s           = settings
  const adminCount  = adminsData?.admins?.length ?? '—'
  const mfaCoverage = s.mfaPolicy === 'enforced' ? '100%' : 'Partial'

  // Each item: label shown, settingKey (for PUT), rawValue (current value), displayValue
  const sections = [
    {
      icon: Shield,
      label: 'Security',
      items: [
        { label: 'MFA Policy',      key: 'mfaPolicy',      raw: s.mfaPolicy,      display: cap(s.mfaPolicy)    || 'Enforced' },
        { label: 'Session Timeout', key: 'sessionTimeout',  raw: s.sessionTimeout,  display: s.sessionTimeout ? `${s.sessionTimeout} min` : '30 min' },
        { label: 'Audit Logs',      key: 'auditLogs',       raw: s.auditLogs,       display: s.auditLogs !== false ? 'Enabled' : 'Disabled' },
        { label: 'API Access',      key: 'apiAccess',       raw: s.apiAccess,       display: cap(s.apiAccess)    || 'Limited' },
      ],
    },
    {
      icon: Bell,
      label: 'Notifications',
      items: [
        { label: 'Email Alerts',       key: 'emailAlerts',       raw: s.emailAlerts,       display: s.emailAlerts       !== false ? 'On' : 'Off' },
        { label: 'Push Notifications', key: 'pushNotifications', raw: s.pushNotifications, display: s.pushNotifications !== false ? 'On' : 'Off' },
        { label: 'SMS Alerts',         key: 'smsAlerts',         raw: s.smsAlerts,         display: s.smsAlerts         === true  ? 'On' : 'Off' },
      ],
    },
    {
      icon: Users,
      label: 'User Management',
      items: [
        { label: 'Administrators', key: 'administrators', raw: null, display: `${adminCount} active`, onClick: () => navigate('/dashboard/admins') },
        { label: 'MFA Coverage',   key: 'mfaCoverage',   raw: null, display: mfaCoverage },
        { label: 'Access Control', key: 'accessControl', raw: null, display: 'Role-based' },
      ],
    },
    {
      icon: Database,
      label: 'System',
      items: [
        { label: 'Data Retention',  key: 'dataRetention',  raw: s.dataRetention,  display: s.dataRetention  ? `${s.dataRetention} days` : '90 days' },
        { label: 'Backup Schedule', key: 'backupSchedule', raw: s.backupSchedule, display: cap(s.backupSchedule) || 'Daily' },
        { label: 'API Version',     key: 'apiVersion',     raw: null,             display: 'v2.0.1' },
      ],
    },
  ]

  function rowIsClickable(key) {
    return !READONLY_KEYS.has(key) && (BOOLEAN_KEYS[key] || SELECT_OPTIONS[key] || NUMBER_KEYS[key])
  }

  function valueColor(key, display) {
    if (BOOLEAN_KEYS[key]) {
      const isOn = display === 'On' || display === 'Enabled'
      return isOn ? '#22c55e' : '#ef4444'
    }
    return '#64748b'
  }

  return (
    <DashboardLayout>
      {editing && (
        <EditModal
          fieldKey={editing.key}
          current={editing.current}
          onSave={saveSetting}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Settings size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(16px,3.5vw,24px)', fontWeight: 800, margin: 0 }}>System Settings</h1>
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>Configure security &amp; policies</p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        {loading ? <Loading /> : (
          <div className="rg-2">
            {/* Profile card */}
            <div onClick={() => navigate('/dashboard/admins')}
              style={{ background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                  {admin?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AD'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{admin?.fullName ?? 'Administrator'}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>{admin?.role?.replace('_', ' ') ?? 'admin'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserCog size={14} color="#94a3b8" />
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            </div>

            {/* Settings sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sections.map(({ icon: Icon, label, items }) => (
                <div key={label} style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Icon size={15} color="#4f6ef7" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{label}</span>
                  </div>
                  {items.map((item, i) => {
                    const clickable = item.onClick || rowIsClickable(item.key)
                    const isToggling = toggling === item.key
                    return (
                      <div
                        key={item.label}
                        onClick={() => item.onClick ? item.onClick() : handleRowClick(item.key, item.raw)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '11px 0',
                          borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none',
                          cursor: clickable ? 'pointer' : 'default',
                          borderRadius: '6px',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (clickable) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: isToggling ? '#94a3b8' : valueColor(item.key, item.display),
                          }}>
                            {isToggling ? '…' : item.display}
                          </span>
                          {clickable && <ChevronRight size={13} color="#d1d5db" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* MFA Policy summary card */}
              <div style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', borderRadius: '16px', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Lock size={15} color="#fff" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>MFA Policy</span>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: '14px' }}>
                  Multi-Factor Authentication is currently <strong>{s.mfaPolicy ?? 'enforced'}</strong> for all administrators.
                </p>
                <div className="rg-2">
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>Policy</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>{s.mfaPolicy ?? 'Enforced'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '3px' }}>Compliance</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{mfaCoverage}</div>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div onClick={handleSignOut}
                style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={15} color="#ef4444" />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>Sign Out</span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>

              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>FraudShield v2.0.1 · © 2026 All Rights Reserved</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
