import { useState } from 'react'
import { revokeSubscription } from '../lib/plan'

const ADMIN_PASS = 'rma2025'

export default function Revoke() {
  const [step, setStep] = useState('password') // password | revoke | done
  const [pass, setPass] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const checkPass = (e) => {
    e.preventDefault()
    if (pass === ADMIN_PASS) {
      setStep('revoke')
      setMsg('')
    } else {
      setMsg('كلمة السر خطأ')
    }
  }

  const handleRevoke = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!email.trim()) { setMsg('ادخل الإيميل'); return }
    setLoading(true)
    try {
      await revokeSubscription(email.trim())
      setMsg(`✓ تم إلغاء اشتراك ${email.trim()} بنجاح`)
      setEmail('')
      setStep('done')
    } catch {
      setMsg('✕ فشل إلغاء الاشتراك — حاول مرة أخرى')
    }
    setLoading(false)
  }

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"

  return (
    <div className="animate-fade-in mx-auto max-w-md space-y-6 pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold md:text-3xl">إلغاء الاشتراك</h1>
        <p className="mt-1 text-zinc-400">إلغاء اشتراك Pro لأي مستخدم</p>
      </div>

      {step === 'password' && (
        <form onSubmit={checkPass} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-bold text-rmared-500">تأكيد الدخول</h2>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="كلمة سر الأدمن" className={inputClass} dir="ltr" />
          <button type="submit" className="w-full cursor-pointer rounded-lg bg-rmared-600 py-3 font-bold text-white transition hover:bg-rmared-500">
            دخول
          </button>
          {msg && <p className="text-center text-sm text-red-400">{msg}</p>}
        </form>
      )}

      {step === 'revoke' && (
        <form onSubmit={handleRevoke} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-bold text-rmared-500">إلغاء اشتراك Pro</h2>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="الإيميل" className={inputClass} dir="ltr" />
          <button type="submit" disabled={loading} className="w-full cursor-pointer rounded-lg bg-red-700 py-3 font-bold text-white transition hover:bg-red-600 disabled:opacity-50">
            {loading ? 'جاري الإلغاء...' : 'إلغاء الاشتراك'}
          </button>
          {msg && <p className="text-center text-sm text-green-400">{msg}</p>}
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-4 rounded-xl border border-green-800 bg-green-900/20 p-6 text-center">
          <div className="text-4xl">✅</div>
          <p className="text-green-400">{msg}</p>
          <button onClick={() => { setStep('revoke'); setMsg('') }} className="cursor-pointer rounded-lg bg-zinc-700 px-6 py-3 font-bold text-white transition hover:bg-zinc-600">
            إلغاء اشتراك آخر
          </button>
        </div>
      )}
    </div>
  )
}
