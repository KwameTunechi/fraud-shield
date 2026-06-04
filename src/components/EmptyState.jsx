export default function EmptyState({ message = 'No data yet.', icon = '📭' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: '10px',
    }}>
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <span style={{ fontSize: '13px', color: '#94a3b8' }}>{message}</span>
    </div>
  )
}
