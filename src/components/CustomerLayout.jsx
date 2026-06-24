export default function CustomerLayout({ children, header }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {header && (
          <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E8ECEF', position: 'sticky', top: 0, zIndex: 10 }}>
            {header}
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '40px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
