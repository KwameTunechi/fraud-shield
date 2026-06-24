import { useEffect } from 'react'

export default function CustomerLayout({ children, header }) {
  useEffect(() => {
    const link = document.querySelector("link[rel='icon']")
    const prev = link?.getAttribute('href')
    if (link) link.setAttribute('href', '/favicon-app.svg')
    return () => { if (link && prev) link.setAttribute('href', prev) }
  }, [])

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
