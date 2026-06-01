import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lib/lang'

const ADMIN_PASS = 'rma2025'

export default function AdminLogin() {
  const { t } = useLang()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (password === ADMIN_PASS) {
      localStorage.setItem('rma_admin', 'true')
      navigate('/admin/panel')
    } else {
      setError(t('admin_login_error'))
    }
  }

  return (
    <div className="animate-fade-in flex flex-col items-center pt-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl">🔐</div>
          <h1 className="mt-3 text-2xl font-bold">{t('admin_login_title')}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t('admin_login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('li_password')}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"
            autoFocus
          />
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white transition hover:bg-rmared-500"
          >
            {t('admin_login_btn')}
          </button>
        </form>
      </div>
    </div>
  )
}
