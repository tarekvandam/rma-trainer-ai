import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getLocalSession, localSignOut } from '../lib/auth'
import { isPro, daysRemaining } from '../lib/plan'
import { useLang } from '../lib/lang'

export default function Navbar() {
  const { t, lang, toggleLang } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    setSession(getLocalSession())
    setRemaining(daysRemaining())
  }, [location])

  const handleLogout = () => {
    localSignOut()
    navigate('/')
  }

  const isAdmin = session?.email === 'eng.tarek.sayed@gmail.com'
  const links = [
    { to: '/', label: t('nav_home') },
    { to: '/generator', label: t('nav_gen') },
    { to: '/bmr', label: t('nav_bmr') },
    { to: '/pricing', label: t('nav_pricing') },
    ...(isAdmin ? [
      { to: '/dashboard', label: t('nav_account') },
      { to: '/admin/panel', label: t('nav_admin') },
    ] : session ? [{ to: '/dashboard', label: t('nav_account') }] : [{ to: '/login', label: t('nav_login') }]),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 md:max-w-5xl md:justify-between md:px-6">
        <Link to="/" className="hidden items-center gap-2 text-lg font-bold md:flex">
          <span className="text-rmared-500">⚔</span>
          <span>RMA Trainer</span>
        </Link>
        <div className="flex w-full items-center gap-1 overflow-x-auto md:w-auto md:gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button onClick={toggleLang} className="shrink-0 cursor-pointer rounded-lg border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200">
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
          {session && (
            <button onClick={handleLogout} className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition hover:text-rmared-400">
              {t('nav_logout')}
            </button>
          )}
          {links.map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition ${
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
          {t('nav_remaining')} {remaining} {t('nav_home') === 'الرئيسية' ? 'يوم' : 'day(s)'}
        </div>
      )}
    </nav>
  )
}
