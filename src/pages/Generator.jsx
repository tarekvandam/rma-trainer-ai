import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lib/lang'
import WorkoutForm from '../components/WorkoutForm'
import { generateWorkoutPlan } from '../lib/ai'
import { canGeneratePlan, incrementPlanCount, getRemainingFreePlans, isPro, daysRemaining } from '../lib/plan'
import { getLocalSession } from '../lib/auth'

export default function Generator() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getLocalSession()) navigate('/login')
  }, [navigate])

  const handleSubmit = async (formData) => {
    if (!canGeneratePlan()) {
      setError('خلصت الخطط المجانية. فعت حساب Pro عشان تكمل.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await generateWorkoutPlan(formData)
      incrementPlanCount()
      navigate('/result', { state: { form: formData, result } })
    } catch (err) {
      setError('حدث خطأ. حاول مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const remaining = getRemainingFreePlans()

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold md:text-3xl">{t('gen_title')}</h1>
        <p className="mt-1 text-zinc-400">{t('gen_desc')}</p>
        {!isPro() && (
          <p className="mt-2 text-sm text-zinc-500">
            باقي {remaining} خطط مجانية
            {remaining === 0 && (
              <span> — <a href="/pricing" className="text-rmared-500 underline">اشترك Pro</a></span>
            )}
          </p>
        )}
        {isPro() && (
          <p className="mt-2 text-sm text-green-500">Pro — متبقي {daysRemaining()} يوم ✓</p>
        )}
      </div>
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-center text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="mx-auto max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
        <WorkoutForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}
