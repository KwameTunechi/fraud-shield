import { Navigate } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function CustomerPrivateRoute({ children }) {
  const { customer, loading } = useCustomerAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9ca3af', fontSize: '14px' }}>Loading…</div>
  return customer ? children : <Navigate to="/app/signin" replace />
}
