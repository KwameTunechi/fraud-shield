import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import TwoFactor from './pages/TwoFactor'
import Dashboard from './pages/Dashboard'
import RiskAnalytics from './pages/RiskAnalytics'
import AlertsIncidents from './pages/AlertsIncidents'
import IncidentDetail from './pages/IncidentDetail'
import LiveTransactions from './pages/LiveTransactions'
import CustomerDirectory from './pages/CustomerDirectory'
import AIConfiguration from './pages/AIConfiguration'
import BlockchainLedger from './pages/BlockchainLedger'
import SystemSettings from './pages/SystemSettings'
import Administrators from './pages/Administrators'
import CustomerProfile from './pages/CustomerProfile'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify" element={<TwoFactor />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard/risk" element={<PrivateRoute><RiskAnalytics /></PrivateRoute>} />
          <Route path="/dashboard/alerts" element={<PrivateRoute><AlertsIncidents /></PrivateRoute>} />
          <Route path="/dashboard/alerts/:id" element={<PrivateRoute><IncidentDetail /></PrivateRoute>} />
          <Route path="/dashboard/transactions" element={<PrivateRoute><LiveTransactions /></PrivateRoute>} />
          <Route path="/dashboard/customers" element={<PrivateRoute><CustomerDirectory /></PrivateRoute>} />
          <Route path="/dashboard/customers/:id" element={<PrivateRoute><CustomerProfile /></PrivateRoute>} />
          <Route path="/dashboard/ai-config" element={<PrivateRoute><AIConfiguration /></PrivateRoute>} />
          <Route path="/dashboard/blockchain" element={<PrivateRoute><BlockchainLedger /></PrivateRoute>} />
          <Route path="/dashboard/settings" element={<PrivateRoute><SystemSettings /></PrivateRoute>} />
          <Route path="/dashboard/admins" element={<PrivateRoute><Administrators /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
