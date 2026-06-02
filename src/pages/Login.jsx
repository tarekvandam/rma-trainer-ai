import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { localSignUp, localSignIn } from '../lib/auth'
import { useLang } from '../lib/lang'

export default function Login() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [msg, setMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setMsg('')
    setSuccess(false)
    const { error } = isSignUp ? localSignUp(email, password) : localSignIn(email, password)
    if (error) setMsg(error.message)
    else { setSuccess(true); setMsg(t('li_success')); setTimeout(() => navigate('/'), 1000) }
  }

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"

  return (
    <div className="animate-fade-in flex flex-col items-center pt-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{isSignUp ? t('li_reg_title') : t('li_title')}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isSignUp ? t('li_sub_register') : t('li_sub_login')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder={t('li_email')} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          <input type="password" placeholder={t('li_password')} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required minLength={6} />
          <button type="submit" className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white transition hover:bg-rmared-500">
            {isSignUp ? t('li_btn_reg') : t('li_btn')}
          </button>
        </form>

        {msg && (
          <p className={`text-center text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </p>
        )}

          {!isSignUp && (
            <Link to="/forgot-password" className="block text-center text-sm text-zinc-500 underline transition hover:text-zinc-200">
              {t('fp_title')}
            </Link>
          )}

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="block w-full text-center text-sm text-zinc-400 underline transition hover:text-zinc-200"
          >
            {isSignUp ? `${t('li_have_account')} — ${t('li_login')}` : `${t('li_no_account')} — ${t('li_register')}`}
          </button>
      </div>
    </div>
  )
}
