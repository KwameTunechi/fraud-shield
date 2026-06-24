export default function CustomerLayout({ children, bare = false }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #EBF0FE 0%, #f5f7fa 60%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: bare ? '0' : '24px 16px 48px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {children}
      </div>
    </div>
  )
}
