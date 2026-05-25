import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-24 pt-4 md:pb-6 md:pt-20">
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="py-6 text-center text-xs text-zinc-600">
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} Tarek Sayed Ibrahim
      </footer>
      <Navbar />
    </div>
  )
}
