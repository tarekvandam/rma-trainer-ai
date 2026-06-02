import { useState } from 'react'
import { useLang } from '../lib/lang'

const goals = [
  { value: 'fat_loss', label: 'goal_fat_loss' },
  { value: 'muscle_gain', label: 'goal_muscle_gain' },
  { value: 'endurance', label: 'goal_endurance' },
  { value: 'strength', label: 'goal_strength' },
  { value: 'general', label: 'goal_general' },
]

const levels = [
  { value: 'beginner', label: 'level_beginner' },
  { value: 'intermediate', label: 'level_intermediate' },
  { value: 'advanced', label: 'level_advanced' },
]

const equipmentItems = [
  { value: 'full_gym', label: 'equip_full_gym' },
  { value: 'dumbbell', label: 'equip_dumbbell' },
  { value: 'barbell', label: 'equip_barbell' },
  { value: 'pullup_bar', label: 'equip_pullup_bar' },
  { value: 'bench', label: 'equip_bench' },
  { value: 'step', label: 'equip_step' },
  { value: 'kettlebell', label: 'equip_kettlebell' },
  { value: 'resistance_bands', label: 'equip_resistance_bands' },
  { value: 'cable', label: 'equip_cable' },
  { value: 'gym_machine', label: 'equip_gym_machine' },
  { value: 'leg_press', label: 'equip_leg_press' },
  { value: 'lat_pulldown', label: 'equip_lat_pulldown' },
  { value: 'smith_machine', label: 'equip_smith_machine' },
]

const GYM_EQUIP = ['dumbbell', 'barbell', 'pullup_bar', 'bench', 'cable', 'gym_machine', 'leg_press', 'lat_pulldown', 'smith_machine']

const trainingTypes = [
  { value: 'mma', label: 'type_mma' },
  { value: 'boxing', label: 'type_boxing' },
  { value: 'kickboxing', label: 'type_kickboxing' },
  { value: 'bjj', label: 'type_bjj' },
  { value: 'muay_thai', label: 'type_muay_thai' },
  { value: 'taekwondo', label: 'type_taekwondo' },
  { value: 'karate', label: 'type_karate' },
  { value: 'wrestling', label: 'type_wrestling' },
  { value: 'gym', label: 'type_gym' },
  { value: 'general', label: 'type_general' },
]

export default function WorkoutForm({ onSubmit, loading }) {
  const { t } = useLang()
  const [form, setForm] = useState({
    name: '',
    weight: '',
    height: '',
    age: '',
    goal: 'general',
    level: 'beginner',
    days: '3',
    equipment: [],
    trainingType: 'general',
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const val = e.target.value
    if (e.target.name === 'trainingType' && val === 'gym') {
      setForm({ ...form, trainingType: val, equipment: GYM_EQUIP })
    } else if (e.target.name === 'trainingType' && form.trainingType === 'gym' && val !== 'gym') {
      setForm({ ...form, trainingType: val, equipment: [] })
    } else {
      setForm({ ...form, [e.target.name]: val })
    }
  }

  const toggleEquipment = (value) => {
    if (value === 'full_gym') {
      const hasAll = GYM_EQUIP.every(eq => form.equipment.includes(eq))
      if (hasAll) {
        setForm({ ...form, equipment: form.equipment.filter(eq => !GYM_EQUIP.includes(eq)) })
      } else {
        const existing = new Set(form.equipment)
        GYM_EQUIP.forEach(eq => existing.add(eq))
        setForm({ ...form, equipment: [...existing] })
      }
      return
    }
    if (value === 'gym_all') {
      setForm({ ...form, equipment: form.equipment.length === GYM_EQUIP.length ? [] : GYM_EQUIP })
      return
    }
    const current = form.equipment
    const idx = current.indexOf(value)
    if (idx >= 0) {
      setForm({ ...form, equipment: current.filter(v => v !== value) })
    } else {
      setForm({ ...form, equipment: [...current, value] })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError(t('wf_error_name')); return }
    if (!form.weight.trim()) { setError(t('wf_error_weight')); return }
    if (!form.height.trim()) { setError(t('wf_error_height')); return }
    if (!form.age.trim()) { setError(t('wf_error_age')); return }
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
          <label className={labelClass}>{t('wf_name')}</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder={t('wf_name_pl')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t('wf_age')}</label>
          <input type="number" name="age" value={form.age} onChange={handleChange} placeholder={t('wf_age_pl')} min="10" max="100" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t('wf_weight')}</label>
          <input type="number" name="weight" value={form.weight} onChange={handleChange} placeholder={t('wf_weight_pl')} min="20" max="300" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t('wf_height')}</label>
          <input type="number" name="height" value={form.height} onChange={handleChange} placeholder={t('wf_height_pl')} min="50" max="250" className={inputClass} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>{t('wf_goal')}</label>
          <select name="goal" value={form.goal} onChange={handleChange} className={selectClass}>
            {goals.map((g) => <option key={g.value} value={g.value}>{t(g.label)}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('wf_level')}</label>
          <select name="level" value={form.level} onChange={handleChange} className={selectClass}>
            {levels.map((l) => <option key={l.value} value={l.value}>{t(l.label)}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('wf_days')}</label>
          <select name="days" value={form.days} onChange={handleChange} className={selectClass}>
            {[2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{d} {t('days')}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t('wf_type')}</label>
          <select name="trainingType" value={form.trainingType} onChange={handleChange} className={selectClass}>
            {trainingTypes.map((type) => <option key={type.value} value={type.value}>{t(type.label)}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>{t('wf_equip')}</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { const all = form.equipment.length === GYM_EQUIP.length ? [] : GYM_EQUIP; setForm({ ...form, equipment: all }) }}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition ${
                form.equipment.length === GYM_EQUIP.length
                  ? 'border-green-500 bg-green-600/20 text-green-400'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {form.equipment.length === GYM_EQUIP.length ? '✓ ' : ''}{t('equip_gym_all')}
            </button>
            {equipmentItems.map((item) => {
              const checked = item.value === 'full_gym'
                ? GYM_EQUIP.every(eq => form.equipment.includes(eq))
                : form.equipment.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggleEquipment(item.value)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    checked
                      ? 'border-rmared-500 bg-rmared-600/20 text-rmared-400'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {checked ? '✓ ' : ''}{t(item.label)}
                </button>
              )
            })}
            {form.equipment.length === 0 && (
              <span className="text-sm text-zinc-500">{t('wf_equip_none')}</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-rmared-600/25 transition hover:bg-rmared-500 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? t('wf_submit_loading') : t('wf_submit')}
      </button>
    </form>
  )
}
