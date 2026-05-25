import { useState } from 'react'

const goals = [
  { value: 'fat_loss', label: 'حرق دهون' },
  { value: 'muscle_gain', label: 'بناء عضلات' },
  { value: 'endurance', label: 'تحمل قتالي' },
  { value: 'strength', label: 'قوة' },
  { value: 'general', label: 'لياقة عامة' },
]

const levels = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
]

const equipmentList = [
  { value: 'none', label: 'بدون أجهزة' },
  { value: 'dumbbells', label: 'دمبلز' },
  { value: 'barbell', label: 'بار' },
  { value: 'kettlebell', label: 'كيتبل' },
  { value: 'resistance_bands', label: 'أشرطة مقاومة' },
  { value: 'pullup_bar', label: 'بار عقلة' },
  { value: 'full_gym', label: 'جيم كامل' },
]

const trainingTypes = [
  { value: 'mma', label: 'MMA' },
  { value: 'boxing', label: 'ملاكمة' },
  { value: 'bjj', label: 'جيوجيتسو' },
  { value: 'muay_thai', label: 'مواي تاي' },
  { value: 'wrestling', label: 'مصارعة' },
  { value: 'general', label: 'عام' },
]

export default function WorkoutForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    weight: '',
    height: '',
    age: '',
    goal: 'general',
    level: 'beginner',
    days: '3',
    equipment: 'none',
    trainingType: 'general',
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('الاسم مطلوب'); return }
    if (!form.weight.trim()) { setError('الوزن مطلوب'); return }
    if (!form.height.trim()) { setError('الطول مطلوب'); return }
    if (!form.age.trim()) { setError('العمر مطلوب'); return }
    onSubmit(form)
  }

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"
  const labelClass = "mb-1.5 block text-sm font-medium text-zinc-300"
  const selectClass = inputClass

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in space-y-5">
      {(error) && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-center text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>الاسم</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="مثال: أحمد" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>العمر</label>
          <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="مثال: 25" min="10" max="100" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>الوزن (كجم)</label>
          <input type="number" name="weight" value={form.weight} onChange={handleChange} placeholder="مثال: 75" min="20" max="300" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>الطول (سم)</label>
          <input type="number" name="height" value={form.height} onChange={handleChange} placeholder="مثال: 175" min="50" max="250" className={inputClass} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>الهدف</label>
          <select name="goal" value={form.goal} onChange={handleChange} className={selectClass}>
            {goals.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>المستوى</label>
          <select name="level" value={form.level} onChange={handleChange} className={selectClass}>
            {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>أيام التمرين</label>
          <select name="days" value={form.days} onChange={handleChange} className={selectClass}>
            {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d} أيام</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>نوع التمرين</label>
          <select name="trainingType" value={form.trainingType} onChange={handleChange} className={selectClass}>
            {trainingTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>المعدات المتاحة</label>
          <select name="equipment" value={form.equipment} onChange={handleChange} className={selectClass}>
            {equipmentList.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-rmared-600/25 transition hover:bg-rmared-500 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? 'جاري التوليد...' : 'توليد الخطة 🥋'}
      </button>
    </form>
  )
}
