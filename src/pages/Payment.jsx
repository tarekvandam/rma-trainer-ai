import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLocalSession } from '../lib/auth'
import { submitProRequest, getRequestStatus } from '../lib/plan'

export default function Payment() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const s = getLocalSession()
    if (!s) navigate('/login')
    setSession(s)
    getRequestStatus(s?.email).then(status => {
      if (status === 'pending') setMsg('طلبك قيد المراجعة، انتظر الموافقة')
      if (status === 'approved') navigate('/dashboard')
    })
  }, [navigate])

  const handleConfirm = async () => {
    if (!session) return
    const { error } = await submitProRequest({
      email: session.email,
      name: '',
      phone: '',
    })
    if (error) setMsg(error)
    else {
      setConfirmed(true)
      setMsg('تم إرسال طلبك! انتظر موافقة الإدارة.')
    }
  }

  return (
    <div className="animate-fade-in flex flex-col items-center pt-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-5xl">💳</div>
          <h1 className="mt-3 text-2xl font-bold">الاشتراك في Pro</h1>
          <p className="mt-1 text-sm text-zinc-400">اشترك الآن واحصل على كل المميزات</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <div className="text-3xl font-bold text-rmared-500">1,000</div>
          <div className="text-zinc-400">جنيه مصري / شهرياً</div>
        </div>

        <div className="rounded-xl border border-rmared-600/30 bg-rmared-900/20 p-5">
          <h2 className="mb-3 text-center font-bold text-rmared-400">طريقة الدفع</h2>
          <div className="space-y-3 text-sm text-zinc-300">
            <p>حول المبلغ على <strong className="text-zinc-100">ونستا باي (Vodafone Cash)</strong></p>
            <div className="rounded-lg bg-zinc-800 p-4 text-center">
              <p className="text-xs text-zinc-500">رقم المحفظة</p>
              <p className="text-2xl font-bold tracking-wider text-zinc-100" dir="ltr">01001904418</p>
            </div>
          </div>
        </div>

        {msg && (
          <p className={`text-center text-sm ${msg.includes('تم') || msg.includes('انتظر') ? 'text-yellow-400' : 'text-red-400'}`}>
            {msg}
          </p>
        )}

        {!confirmed && !msg && (
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-rmared-500 active:scale-[0.98]"
            >
              تأكيد الدفع — تم التحويل
            </button>
            <p className="text-center text-xs text-zinc-500">
              بعد التأكيد، هانتظر موافقة الإدارة خلال 24 ساعة
            </p>
          </div>
        )}

        {confirmed && (
          <button
            onClick={() => navigate('/')}
            className="w-full cursor-pointer rounded-lg border border-zinc-700 px-6 py-3 font-medium text-zinc-300 transition hover:border-zinc-500"
          >
            الرجوع للرئيسية
          </button>
        )}
      </div>
    </div>
  )
}
