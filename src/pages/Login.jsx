import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { localSignUp, localSignIn } from '../lib/auth'

export default function Login() {
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
    else { setSuccess(true); setMsg('تم بنجاح!'); setTimeout(() => navigate('/'), 1000) }
  }

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"

  return (
    <div className="animate-fade-in flex flex-col items-center pt-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{isSignUp ? 'إنشاء حساب' : 'دخول'}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {isSignUp ? 'اشترك للوصول الكامل' : 'ادخل لحسابك'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          <input type="password" placeholder="كلمة السر" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required minLength={6} />
          <button type="submit" className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white transition hover:bg-rmared-500">
            {isSignUp ? 'تسجيل' : 'دخول'}
          </button>
        </form>

        {msg && (
          <p className={`text-center text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </p>
        )}

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="block w-full text-center text-sm text-zinc-400 underline transition hover:text-zinc-200"
        >
          {isSignUp ? 'عندي حساب — دخول' : 'ما عندي حساب — سجل'}
        </button>
      </div>
    </div>
  )
}
