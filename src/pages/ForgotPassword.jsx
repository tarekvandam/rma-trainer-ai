import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateResetCode, verifyResetCode, changePassword, getLocalUsers, localSignUp } from '../lib/auth'
import { useLang } from '../lib/lang'

export default function ForgotPassword() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [showCode, setShowCode] = useState('')

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"

  const handleRequestCode = (e) => {
    e.preventDefault()
    setMsg(''); setSuccess(false); setShowCode('')
    let users = getLocalUsers()
    if (!users[email]) { localSignUp(email, 'temporary123'); users = getLocalUsers() }
    const code = generateResetCode(email)
    if (!code) { setMsg(t('fp_error')); return }
    setShowCode(code)
    setMsg(t('fp_code_sent'))
    setSuccess(true)
    setStep(2)
  }

  const handleVerifyCode = (e) => {
    e.preventDefault()
    setMsg(''); setSuccess(false)
    if (!verifyResetCode(email, code)) { setMsg(t('fp_invalid_code')); return }
    setMsg('')
    setStep(3)
  }

  const handleResetPassword = (e) => {
    e.preventDefault()
    setMsg(''); setSuccess(false)
    if (newPassword.length < 6) { setMsg(t('fp_password_short')); return }
    if (changePassword(email, newPassword)) {
      setMsg(t('fp_success'))
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } else {
      setMsg(t('fp_error'))
    }
  }

  return (
    <div className="animate-fade-in flex flex-col items-center pt-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('fp_title')}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t('fp_subtitle')}</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-xs text-zinc-500">{t('fp_enter_email')}</p>
            <input type="text" placeholder={t('li_email')} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
            <button type="submit" className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white transition hover:bg-rmared-500">
              {t('fp_send_code')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {showCode && (
              <div className="rounded-lg border border-yellow-600 bg-yellow-900/20 p-3 text-center">
                <p className="text-xs text-zinc-400">{t('fp_your_code')}</p>
                <p className="text-2xl font-bold tracking-widest text-yellow-400" dir="ltr">{showCode}</p>
                <p className="mt-1 text-xs text-zinc-500">{t('fp_code_expiry')}</p>
              </div>
            )}
            <input type="text" placeholder={t('fp_enter_code')} value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} required maxLength={6} />
            <button type="submit" className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white transition hover:bg-rmared-500">
              {t('fp_verify')}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-zinc-500">{t('fp_new_password')}</p>
            <input type="password" placeholder={t('li_password')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} required minLength={6} />
            <button type="submit" className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white transition hover:bg-rmared-500">
              {t('fp_reset_btn')}
            </button>
          </form>
        )}

        {msg && (
          <p className={`text-center text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>
        )}

        <Link to="/login" className="block text-center text-sm text-zinc-400 underline transition hover:text-zinc-200">
          {t('fp_back')}
        </Link>
      </div>
    </div>
  )
}