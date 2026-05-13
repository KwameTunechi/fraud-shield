import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignIn from './pages/SignIn'
import TwoFactor from './pages/TwoFactor'
import Dashboard from './pages/Dashboard'
import RiskAnalytics from './pages/RiskAnalytics'
import AlertsIncidents from './pages/AlertsIncidents'
import LiveTransactions from './pages/LiveTransactions'
import CustomerDirectory from './pages/CustomerDirectory'
import AIConfiguration from './pages/AIConfiguration'
import BlockchainLedger from './pages/BlockchainLedger'
import SystemSettings from './pages/SystemSettings'
import Administrators from './pages/Administrators'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/verify" element={<TwoFactor />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/risk" element={<RiskAnalytics />} />
      <Route path="/dashboard/alerts" element={<AlertsIncidents />} />
      <Route path="/dashboard/transactions" element={<LiveTransactions />} />
      <Route path="/dashboard/customers" element={<CustomerDirectory />} />
      <Route path="/dashboard/ai-config" element={<AIConfiguration />} />
      <Route path="/dashboard/blockchain" element={<BlockchainLedger />} />
      <Route path="/dashboard/settings" element={<SystemSettings />} />
      <Route path="/dashboard/admins" element={<Administrators />} />
    </Routes>
  )
}

export default App
