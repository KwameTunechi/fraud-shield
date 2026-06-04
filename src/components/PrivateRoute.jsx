import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PrivateRoute({ children }) {
  const { admin, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
      }}>
        Checking your session…
      </div>
    )
  }

  if (!admin) return <Navigate to="/signin" replace />

  return children
}
