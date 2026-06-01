import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getLocalSession } from '../lib/auth'
import { isPro, daysRemaining } from '../lib/plan'

export default function Navbar() {
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    setSession(getLocalSession())
    setRemaining(daysRemaining())
  }, [location])

  const links = [
    { to: '/', label: 'الرئيسية' },
    { to: '/generator', label: 'المولد' },
    { to: '/bmr', label: 'BMR' },
    { to: '/pricing', label: 'الباقات' },
    { to: session ? '/dashboard' : '/login', label: session ? 'حسابي' : 'دخول' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 md:max-w-5xl md:justify-between md:px-6">
        <Link to="/" className="hidden items-center gap-2 text-lg font-bold md:flex">
          <span className="text-rmared-500">⚔</span>
          <span>RMA Trainer</span>
        </Link>
        <div className="flex w-full justify-around md:w-auto md:gap-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition md:px-4 md:py-2 md:text-sm ${
                  isActive
                    ? 'text-rmared-500'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
      {remaining > 0 && (
        <div className="hidden justify-center bg-rmared-600/10 py-0.5 text-xs text-rmared-400 md:flex">
          الاشتراك متبقي {remaining} يوم
        </div>
      )}
    </nav>
  )
}
