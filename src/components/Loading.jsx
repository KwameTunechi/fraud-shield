export default function Loading({ message = 'Loading…' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: '12px',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        border: '3px solid #e2e8f0', borderTopColor: '#4f6ef7',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: '13px', color: '#94a3b8' }}>{message}</span>
    </div>
  )
}
