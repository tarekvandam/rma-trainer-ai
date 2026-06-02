import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LangProvider, useLang } from './lib/lang'
import { loadPublicCodes, checkAllExpired, getPlan, activatePro, getRequestStatus, syncRequestsCloud, incrementVisitorCount, syncAdsCloud, supabaseGet, getNotifications, getPendingNotifications } from './lib/plan'
import { getLocalSession } from './lib/auth'
import Layout from './components/Layout'
import Home from './pages/Home'
import Generator from './pages/Generator'
import Result from './pages/Result'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Payment from './pages/Payment'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/AdminLogin'
import Admin from './pages/Admin'
import Revoke from './pages/Revoke'
import BMCalculator from './pages/BMCalculator'

function showSystemNotification(title, body, tag) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, tag, icon: '/favicon.svg', vibrate: [200, 100, 200], requireInteraction: true }) } catch {}
  }
}

function sendToServiceWorker(title, body, tag) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'show_notification', title, body, tag, url: '/' })
  }
}

function getDismissedSet(email) {
  try { return new Set(JSON.parse(localStorage.getItem('rma_dismiss_' + email) || '[]')) }
  catch { return new Set() }
}

function addDismissed(email, id) {
  const set = getDismissedSet(email)
  set.add(id)
  try { localStorage.setItem('rma_dismiss_' + email, JSON.stringify([...set])) } catch {}
}

function filterDismissed(notifs, email) {
  const dismissed = getDismissedSet(email)
  return notifs.filter(n => !dismissed.has(n.id))
}

function NotificationChecker({ children }) {
  const { t } = useLang()
  const [pendingNotifs, setPendingNotifs] = useState([])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    const check = () => {
      const session = getLocalSession()
      if (!session) return
      const pending = filterDismissed(getPendingNotifications(session.email, new Set()), session.email)
      if (pending.length > 0) setPendingNotifs(prev => {
        const ids = new Set(prev.map(n => n.id))
        const newOnes = pending.filter(n => !ids.has(n.id))
        newOnes.forEach(n => {
          addDismissed(session.email, n.id)
          showSystemNotification('RMA Trainer', n.message, n.id)
          sendToServiceWorker('RMA Trainer', n.message, n.id)
        })
        return [...prev, ...newOnes]
      })
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  const dismissNotif = (id) => {
    setPendingNotifs(prev => prev.filter(n => n.id !== id))
    const session = getLocalSession()
    if (session) addDismissed(session.email, id)
  }

  return (
    <>
      {children}
      {pendingNotifs.map(n => (
        <div key={n.id} style={{ position: 'fixed', bottom: 80, left: 12, right: 12, zIndex: 999999, background: '#1a1a2e', border: '1px solid #e63946', borderRadius: 12, padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.5, flex: 1, margin: 0 }}>{n.message}</p>
            <button onClick={() => dismissNotif(n.id)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
          </div>
        </div>
      ))}
    </>
  )
}

export default function App() {
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    loadPublicCodes()
    checkAllExpired()
    if (!sessionStorage.getItem('rma_visited')) {
      incrementVisitorCount()
      sessionStorage.setItem('rma_visited', '1')
    }
    syncAdsCloud()
    const interval = setInterval(checkAllExpired, 60000)
    const codesInterval = setInterval(loadPublicCodes, 30000)
    const adsInterval = setInterval(syncAdsCloud, 30000)
    const notifInterval = setInterval(async () => {
      const all = await getNotifications()
      const session = getLocalSession()
      const list = session ? filterDismissed(all, session.email) : all
      localStorage.setItem('rma_notifications', JSON.stringify(list.slice(0, 20)))
    }, 30000)
    getNotifications().then(all => {
      const session = getLocalSession()
      const list = session ? filterDismissed(all, session.email) : all
      localStorage.setItem('rma_notifications', JSON.stringify(list.slice(0, 20)))
    })
    const approvalInterval = setInterval(async () => {
      const session = getLocalSession()
      if (!session) return
      const plan = getPlan()
      const cloud = await supabaseGet('pro_requests')
      const req = Array.isArray(cloud) ? cloud.find(r => r.email === session.email) : null
      if (req) {
        if (req.status === 'approved' && plan.type !== 'pro') {
          await activatePro('approved')
          window.location.reload()
        } else if (req.status === 'approved' && plan.type === 'pro' && req.expiresAt && req.expiresAt !== plan.expiresAt) {
          plan.expiresAt = req.expiresAt
          localStorage.setItem('rma_plan', JSON.stringify(plan))
        }
        if (req.status === 'revoked' && plan.type === 'pro') {
          plan.type = 'free'
          delete plan.expiresAt
          delete plan.activatedAt
          plan.revoked = true
          localStorage.setItem('rma_plan', JSON.stringify(plan))
          window.location.reload()
        }
      }
    }, 8000)
    return () => { clearInterval(interval); clearInterval(codesInterval); clearInterval(approvalInterval); clearInterval(adsInterval); clearInterval(notifInterval) }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <NotificationChecker>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/generator" element={<Generator />} />
                <Route path="/result" element={<Result />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/panel" element={<Admin />} />
                <Route path="/revoke" element={<Revoke />} />
                <Route path="/bmr" element={<BMCalculator />} />
              </Route>
            </Routes>
          </NotificationChecker>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
