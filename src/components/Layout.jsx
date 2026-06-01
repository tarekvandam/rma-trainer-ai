import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useLang } from '../lib/lang'

export default function Layout() {
  const { t } = useLang()
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-24 pt-4 md:pb-6 md:pt-20">
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="py-6 text-center text-xs text-zinc-600">
        {t('footer_rights')} &copy; {new Date().getFullYear()} Tarek Sayed Ibrahim
      </footer>
      <Navbar />
    </div>
  )
}
