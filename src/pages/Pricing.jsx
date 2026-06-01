import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPlan, isPro, activatePro, getRemainingFreePlans, validateCode, daysRemaining } from '../lib/plan'
import { getLocalSession } from '../lib/auth'
import { fetchPricingPlansPublic } from '../lib/pricing-sync'
import { useLang } from '../lib/lang'

function getDefaultPricing(t) {
  return [
    { id: 'free', name: 'Free', price: '0', currency: 'ريال', period: '/شهر', popular: false, features: [t('pr_feat_limited'), 'تمارين أساسية', 'نصائح غذائية عامة', 'عرض النتائج'], btnText: t('pr_btn'), btnLink: '' },
    { id: 'pro', name: 'Pro', price: '1000', currency: 'جنيه', period: t('pr_once'), popular: true, features: [t('pr_feat_unlimited'), t('pr_feat_advanced'), t('pr_feat_diet'), t('pr_feat_pdf'), t('pr_feat_videos'), t('pr_feat_contact')], btnText: t('pr_btn_pro'), btnLink: '/payment' },
  ]
}

function loadPricing(t) {
  try {
    const data = localStorage.getItem('rma_pricing_plans')
    return data ? JSON.parse(data) : getDefaultPricing(t)
  } catch {
    return getDefaultPricing(t)
  }
}

export default function Pricing() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [pricingPlans, setPricingPlans] = useState(() => { return loadPricing(t) })
  const [serialCode, setSerialCode] = useState('')
  const [msg, setMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [plan, setPlan] = useState(getPlan())

  useEffect(() => {
    setPlan(getPlan())
    const hasLocal = localStorage.getItem('rma_pricing_plans')
    if (!hasLocal) {
      fetchPricingPlansPublic(getDefaultPricing(t)).then(data => {
        if (data && data.length) setPricingPlans(data)
      })
    }
  }, [t])

  const handleActivate = async (e) => {
    e.preventDefault()
    setMsg('')
    setSuccess(false)
    if (!serialCode.trim()) { setMsg('ادخل الكود'); return }
    const session = getLocalSession()
    if (!session || !session.email) {
      sessionStorage.setItem('pending_code', serialCode.trim().toUpperCase())
      setMsg(t('pr_login_req'))
      setTimeout(() => navigate('/login'), 1200)
      return
    }
    const found = await validateCode(serialCode.trim().toUpperCase())
    if (found) {
      const ok = await activatePro(found.code)
      if (!ok) { setMsg('هذا الكود مستخدم من قبل'); return }
      setPlan(getPlan())
      setSuccess(true)
      setMsg('تم التفعيل! أنت الآن مشترك في الباقة Pro 🎉')
      setSerialCode('')
    } else {
      setMsg('كود غير صحيح أو مستخدم من قبل')
    }
  }

  // Auto-activate pending code after login
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_code')
    if (pending) {
      sessionStorage.removeItem('pending_code')
      const session = getLocalSession()
      if (session && session.email) {
        setSerialCode(pending)
        // Auto-trigger activation after brief delay for UX
        const timer = setTimeout(async () => {
          const found = await validateCode(pending)
          if (found) {
            const ok = await activatePro(found.code)
            if (ok) {
              setPlan(getPlan())
              setSuccess(true)
              setMsg('تم التفعيل! أنت الآن مشترك في الباقة Pro 🎉')
              setSerialCode('')
            }
          }
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const planType = plan.type === 'pro' ? 'pro' : 'free'
  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold md:text-3xl">{t('pr_title')}</h1>
        <p className="mt-1 text-zinc-400">
          {plan.type === 'pro'
            ? `Pro — ${t('dash_days')} ${daysRemaining()} ${t('days')}`
            : `${t('pr_free')} — ${getRemainingFreePlans()} ${t('pr_feat_limited')}`
          }
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 md:px-8">
        {pricingPlans.map((p) => {
          const isCurrentPlan = planType === p.id
          const isPopular = p.popular
          return (
            <div
              key={p.id}
              className={`relative rounded-xl border-2 bg-zinc-900/50 p-6 ${isPopular ? 'border-rmared-600 card-glow' : 'border-zinc-700'} ${isCurrentPlan ? 'ring-2 ring-rmared-500' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rmared-600 px-4 py-1 text-xs font-bold text-white">
                  {isCurrentPlan ? t('code_active_badge') : t('pricing_popular')}
                </div>
              )}
              <h3 className={`text-xl font-bold ${isPopular ? 'text-rmared-500' : 'text-zinc-300'}`}>{p.name}</h3>
              <div className="my-4">
                <span className="text-4xl font-bold text-zinc-100">{p.price}</span>
                <span className="mr-1 text-zinc-400">{p.currency}{p.period}</span>
              </div>
              <ul className="mb-6 space-y-2 text-sm text-zinc-300">
                {p.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2">
                    <span className="text-rmared-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {p.btnLink && !isCurrentPlan && (
                <Link
                  to={p.btnLink}
                  className={`block w-full rounded-lg py-3 text-center font-bold transition ${
                    isPopular
                      ? 'bg-rmared-600 text-white hover:bg-rmared-500'
                      : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {p.btnText || t('pr_btn_pro')}
                </Link>
              )}
              {isCurrentPlan && (
                <div className={`block w-full rounded-lg py-3 text-center font-bold text-white ${plan.type === 'pro' ? 'bg-green-600' : 'border border-zinc-700 text-zinc-300'}`}>
                  {plan.type === 'pro' ? t('code_active_badge') : (p.btnText || t('pr_btn'))}
                </div>
              )}
              {!p.btnLink && !isCurrentPlan && (
                <div className="block w-full rounded-lg border border-zinc-700 py-3 text-center font-bold text-zinc-300">
                  {p.btnText || '—'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
        <h2 className="mb-3 text-center text-lg font-bold text-rmared-500">{t('pr_activate')} {t('pr_code_pl')}</h2>
        <form onSubmit={handleActivate} className="mx-auto flex max-w-md gap-3">
          <input
            type="text"
            value={serialCode}
            onChange={(e) => setSerialCode(e.target.value)}
            placeholder={t('pr_code_pl')}
            className={inputClass}
            dir="ltr"
            style={{ textAlign: 'left' }}
          />
          <button type="submit" className="cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white transition hover:bg-rmared-500">
            {t('pr_activate')}
          </button>
        </form>
        {msg && (
          <p className={`mt-3 text-center text-sm ${success ? 'text-green-400' : 'text-red-400'}`}>
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}
