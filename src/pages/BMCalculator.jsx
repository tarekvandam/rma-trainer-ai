import { useState } from 'react'

const activityLabels = {
  sedentary: { label: 'خامل (بدون تمارين)', factor: 1.2 },
  light: { label: 'خفيف (1-3 أيام/أسبوع)', factor: 1.375 },
  moderate: { label: 'معتدل (3-5 أيام/أسبوع)', factor: 1.55 },
  very: { label: 'نشط (6-7 أيام/أسبوع)', factor: 1.725 },
  extreme: { label: 'شديد جداً (مرتين يومياً)', factor: 1.9 },
}

function calcBMR(gender, age, weight, height, bodyFat) {
  if (bodyFat > 0) {
    const lbm = weight * (1 - bodyFat / 100)
    return { bmr: Math.round(370 + 21.6 * lbm), method: 'Katch-McArdle', lbm: Math.round(lbm) }
  }
  if (age < 18) {
    if (gender === 'male') {
      if (age <= 3) return { bmr: Math.round(59.512 * weight - 30.4), method: 'Schofield (0-3)' }
      if (age <= 10) return { bmr: Math.round(22.706 * weight + 504.3), method: 'Schofield (3-10)' }
      return { bmr: Math.round(17.686 * weight + 658.2), method: 'Schofield (10-18)' }
    } else {
      if (age <= 3) return { bmr: Math.round(58.317 * weight - 31.1), method: 'Schofield (0-3)' }
      if (age <= 10) return { bmr: Math.round(20.315 * weight + 485.9), method: 'Schofield (3-10)' }
      return { bmr: Math.round(13.384 * weight + 692.6), method: 'Schofield (10-18)' }
    }
  }
  if (gender === 'male') {
    return { bmr: Math.round(10 * weight + 6.25 * height - 5 * age + 5), method: 'Mifflin-St Jeor' }
  }
  return { bmr: Math.round(10 * weight + 6.25 * height - 5 * age - 161), method: 'Mifflin-St Jeor' }
}

export default function BMCalculator() {
  const [gender, setGender] = useState('male')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [activity, setActivity] = useState('moderate')
  const [bodyFat, setBodyFat] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleCalc = (e) => {
    e.preventDefault()
    setError('')
    const a = parseInt(age)
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const bf = parseFloat(bodyFat) || 0

    if (!age || !weight || !height) { setError('السن والوزن والطول إجباريين'); return }
    if (a < 1 || a > 100) { setError('السن بين 1 و 100'); return }
    if (w < 10 || w > 400) { setError('الوزن بين 10 و 400 كجم'); return }
    if (h < 50 || h > 250) { setError('الطول بين 50 و 250 سم'); return }
    if (bf && (bf < 1 || bf > 70)) { setError('نسبة الدهون بين 1% و 70%'); return }

    const bmrResult = calcBMR(gender, a, w, h, bf)
    const factor = activityLabels[activity].factor
    const tdee = Math.round(bmrResult.bmr * factor)

    setResult({
      ...bmrResult,
      bmr: bmrResult.bmr,
      tdee,
      activityLabel: activityLabels[activity].label,
      activityFactor: factor,
      fatLoss15: Math.round(tdee * 0.85),
      fatLoss20: Math.round(tdee * 0.8),
      gain10: Math.round(tdee * 1.1),
      gain15: Math.round(tdee * 1.15),
    })
  }

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"
  const labelClass = "mb-1.5 block text-sm font-medium text-zinc-300"

  return (
    <div className="animate-fade-in space-y-6">
      <div className="pt-4 text-center">
        <div className="text-4xl">🧬</div>
        <h1 className="mt-2 text-2xl font-bold">حاسبة BMR و TDEE</h1>
        <p className="text-sm text-zinc-400">معدل الأيض الأساسي والسعرات حسب نشاطك</p>
      </div>

      <form onSubmit={handleCalc} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>الجنس</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className={inputClass}>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>السن</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="مثال: 25" min="1" max="100" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الوزن (كجم)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="مثال: 75" step="0.1" min="10" max="400" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>الطول (سم)</label>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="مثال: 175" step="0.1" min="50" max="250" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>مستوى النشاط</label>
          <select value={activity} onChange={e => setActivity(e.target.value)} className={inputClass}>
            {Object.entries(activityLabels).map(([k, v]) => (
              <option key={k} value={k}>{v.label} (×{v.factor})</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>نسبة الدهون (اختياري — لنتيجة أدق)</label>
          <input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="مثال: 15" min="1" max="70" className={inputClass} />
        </div>

        {error && <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-center text-sm text-red-300">{error}</div>}

        <button type="submit" className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-rmared-600/25 transition hover:bg-rmared-500 active:scale-[0.98]">
          احسب 🔥
        </button>
      </form>

      {result && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 md:p-6">
          <h2 className="text-center text-lg font-bold text-rmared-500">النتائج</h2>

          <div className="rounded-lg bg-zinc-800/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">الطريقة المستخدمة:</span>
              <span className="font-bold text-rmared-400">{result.method}</span>
            </div>
            {result.lbm && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-zinc-400">كتلة الجسم النحيل (LBM):</span>
                <span className="font-bold text-zinc-100">{result.lbm} كجم</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-zinc-800/50 p-4 text-center">
              <p className="text-sm text-zinc-400">BMR</p>
              <p className="text-3xl font-bold text-rmared-400">{result.bmr}</p>
              <p className="text-xs text-zinc-500">kcal/day</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-4 text-center">
              <p className="text-sm text-zinc-400">TDEE</p>
              <p className="text-3xl font-bold text-green-400">{result.tdee}</p>
              <p className="text-xs text-zinc-500">kcal/day (معامل {result.activityFactor})</p>
            </div>
          </div>

          <div className="rounded-lg bg-zinc-800/50 p-4">
            <h3 className="mb-3 text-sm font-bold text-zinc-300">شرح خطوات الحساب</h3>
            <ul className="space-y-1 text-xs text-zinc-400">
              <li>1. المعادلة: {result.method}</li>
              {result.lbm && <li>2. LBM = {weight} × (1 - {bodyFat}/100) = {result.lbm} كجم</li>}
              <li>2. BMR = {result.bmr} kcal/day</li>
              <li>3. معامل النشاط: {result.activityFactor} ({result.activityLabel})</li>
              <li>4. TDEE = {result.bmr} × {result.activityFactor} = {result.tdee} kcal/day</li>
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-red-800/40 bg-red-900/15 p-4">
              <h3 className="mb-2 text-sm font-bold text-rmared-400">🔥 لخسارة الوزن</h3>
              <p className="flex justify-between text-sm"><span>عجز 15%:</span> <span className="font-bold text-zinc-100">{result.fatLoss15} kcal/day</span></p>
              <p className="flex justify-between text-sm"><span>عجز 20%:</span> <span className="font-bold text-zinc-100">{result.fatLoss20} kcal/day</span></p>
              <p className="mt-2 text-xs text-zinc-500">TDEE × 0.85 و TDEE × 0.80</p>
            </div>
            <div className="rounded-lg border border-green-800/40 bg-green-900/15 p-4">
              <h3 className="mb-2 text-sm font-bold text-green-400">💪 لبناء العضلات</h3>
              <p className="flex justify-between text-sm"><span>فائض 10%:</span> <span className="font-bold text-zinc-100">{result.gain10} kcal/day</span></p>
              <p className="flex justify-between text-sm"><span>فائض 15%:</span> <span className="font-bold text-zinc-100">{result.gain15} kcal/day</span></p>
              <p className="mt-2 text-xs text-zinc-500">TDEE × 1.10 و TDEE × 1.15</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}