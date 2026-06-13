import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Loading from '../components/Loading'
import { useApi } from '../hooks/useApi'
import { api } from '../api/client'

const TOGGLE_META = {
  anomaly:    { label: 'Anomaly Detection',  desc: 'Real-time transaction monitoring'         },
  blocking:   { label: 'Auto-Blocking',      desc: 'Automatically block suspicious activity'  },
  behavior:   { label: 'Behavior Analysis',  desc: 'Monitor user behavior patterns'           },
  predictive: { label: 'Predictive Scoring', desc: 'Predict fraud before it happens'          },
}

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width: '46px', height: '26px', borderRadius: '13px', background: on ? 'linear-gradient(135deg, #4f6ef7, #7c3aed)' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: on ? '23px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.25s' }} />
    </div>
  )
}

export default function AIConfiguration() {
  const navigate = useNavigate()
  const { data, loading }              = useApi('/api/ai-config')
  const { data: models, loading: modelsLoading } = useApi('/api/ai/models')
  const [toggles, setToggles] = useState(null)
  const [saving,  setSaving]  = useState(false)

  // Sync local state once the API responds
  useEffect(() => {
    if (data) setToggles(data)
  }, [data])

  const flip = async (key) => {
    if (!toggles || saving) return
    const updated = { ...toggles, [key]: !toggles[key] }
    setToggles(updated)
    setSaving(true)
    try {
      await api.put('/api/ai-config/toggles', { [key]: updated[key] })
    } catch {
      // revert on failure
      setToggles(toggles)
    } finally {
      setSaving(false)
    }
  }

  const display = toggles ?? data ?? {}

  return (
    <DashboardLayout>
      <div className="header-section" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #0d9488 100%)' }}>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter, sans-serif', padding: 0, marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Brain size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(16px,3.5vw,24px)', fontWeight: 800, margin: 0 }}>AI Configuration</h1>
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: '3px 0 0' }}>
              Machine learning models {saving && <span style={{ color: '#fbbf24' }}>· saving…</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="page-pad">
        {loading ? <Loading message="Loading AI configuration…" /> : (
          <div className="rg-2">
            {/* Detection Settings */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Detection Settings</h2>
              {Object.entries(TOGGLE_META).map(([key, { label, desc }], i, arr) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ paddingRight: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{label}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{desc}</div>
                  </div>
                  <Toggle on={!!display[key]} onToggle={() => flip(key)} />
                </div>
              ))}
            </div>

            {/* Active Models */}
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Active Models</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {modelsLoading
                  ? <Loading message="Loading models…" />
                  : (models ?? []).map((model) => (
                  <div key={model.name} style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Brain size={17} color="#fff" />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{model.name}</span>
                      </div>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: model.dot, display: 'inline-block', flexShrink: 0, marginTop: '4px' }} />
                    </div>
                    <div className="rg-2" style={{ marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Accuracy</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#4f6ef7' }}>{model.accuracy}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Last Trained</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: model.lastTrained === 'In progress' ? '#3b82f6' : '#0f172a' }}>{model.lastTrained}</div>
                      </div>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${model.progress}%`, height: '100%', background: 'linear-gradient(90deg, #4f6ef7, #7c3aed)', borderRadius: '999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
