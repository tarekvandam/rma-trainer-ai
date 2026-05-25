import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { loadPublicCodes, checkAllExpired, getPlan, activatePro, getRequestStatus, syncRequestsCloud } from './lib/plan'
import { getLocalSession } from './lib/auth'
import Layout from './components/Layout'
import Home from './pages/Home'
import Generator from './pages/Generator'
import Result from './pages/Result'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Payment from './pages/Payment'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/AdminLogin'
import Admin from './pages/Admin'

export default function App() {
  useEffect(() => {
    loadPublicCodes()
    checkAllExpired()
    const interval = setInterval(checkAllExpired, 60000)
    const codesInterval = setInterval(loadPublicCodes, 30000)
    const approvalInterval = setInterval(async () => {
      const session = getLocalSession()
      if (!session) return
      const plan = getPlan()
      await syncRequestsCloud()
      const status = await getRequestStatus(session.email)
      if (status === 'approved' && plan.type !== 'pro') {
        await activatePro('approved')
        window.location.reload()
      }
      if (status === 'revoked' && plan.type === 'pro') {
        plan.type = 'free'
        delete plan.expiresAt
        delete plan.activatedAt
        plan.revoked = true
        localStorage.setItem('rma_plan', JSON.stringify(plan))
        window.location.reload()
      }
    }, 8000)
    return () => { clearInterval(interval); clearInterval(codesInterval); clearInterval(approvalInterval) }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/result" element={<Result />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={<Admin />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
