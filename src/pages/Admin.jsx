import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRequests, getRequestsLocal, approveRequest, rejectRequest, submitProRequest, revokeSubscription, deleteRequest, syncCodesToCloud, loadPublicCodes, syncRequestsCloud, clearUnusedCodes, getActiveProUsers, saveVideosCloud } from '../lib/plan'
import { publishPricingPlans } from '../lib/pricing-sync'

async function fetchCodesWithSupabase() {
  // Fetch Supabase data directly and merge with local admin codes
  try {
    const { supabase } = await import('../lib/supabase')
    if (supabase) {
      const { data } = await supabase.from('app_data').select('value').eq('key', 'serial_codes').single()
      const cloud = data?.value
      if (Array.isArray(cloud)) {
        const local = loadFromStorage('rma_codes', [])
        const localMap = new Map(local.map(c => [c.code, c]))
        // Update local codes with cloud status
        cloud.forEach(c => {
          const match = localMap.get(c.code)
          if (match) {
            match.used = c.used
            match.usedBy = c.usedBy
            match.date = c.date
          }
        })
        saveToStorage('rma_codes', local)
        return local
      }
    }
  } catch { /* ignore */ }
  return loadFromStorage('rma_codes', [])
}

function generateCode(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function loadFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

const DEFAULT_PRICING = [
  { id: 'free', name: 'Free', price: '0', currency: 'ريال', period: '/شهر', popular: false, features: ['توليد 3 خطط شهرياً', 'تمارين أساسية', 'نصائح غذائية عامة', 'عرض النتائج'], btnText: 'خطتك الحالية', btnLink: '' },
  { id: 'pro', name: 'Pro', price: '1000', currency: 'جنيه', period: 'مرة واحدة', popular: true, features: ['توليد غير محدود', 'تمارين متقدمة', 'نظام غذائي مخصص', 'تصدير PDF', 'فيديوهات تمارين يوتيوب', 'دعم أولوية'], btnText: 'اشترك الآن', btnLink: '/payment' },
]

const tabs = [
  { id: 'dashboard', label: 'الرئيسية' },
  { id: 'plans', label: 'خطط مخصصة' },
  { id: 'pricing', label: 'الباقات' },
  { id: 'requests', label: 'طلبات التفعيل' },
  { id: 'codes', label: 'أكواد التفعيل' },
  { id: 'videos', label: 'فيديوهات' },
  { id: 'settings', label: 'الإعدادات' },
]

export default function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [codes, setCodes] = useState(() => loadFromStorage('rma_codes', []))
  const [videos, setVideos] = useState(() => loadFromStorage('rma_videos', []))
  const [videoUrl, setVideoUrl] = useState('')
  const [bulkCount, setBulkCount] = useState(1000)
  const [bulkLength, setBulkLength] = useState(14)
  const [copiedCode, setCopiedCode] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [requests, setRequests] = useState([])
  const [pricingPlans, setPricingPlans] = useState(() => loadFromStorage('rma_pricing_plans', DEFAULT_PRICING))
  const [publishStatus, setPublishStatus] = useState(null)
  const [plans, setPlans] = useState(() => loadFromStorage('rma_custom_plans', []))
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState({ name: '', goal: '', level: '', days: 3 })
  const [planDays, setPlanDays] = useState([{ day: 'اليوم 1', focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60 ث' }] }])

  const refreshRequests = () => setRequests(getRequestsLocal())

  useEffect(() => {
    refreshRequests()
    syncRequestsCloud().then(() => refreshRequests())
    const isAdmin = localStorage.getItem('rma_admin')
    if (isAdmin !== 'true') navigate('/admin')
  }, [navigate])

  useEffect(() => {
    const interval = setInterval(() => { syncRequestsCloud().then(refreshRequests) }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { saveToStorage('rma_codes', codes) }, [codes])
  useEffect(() => { saveToStorage('rma_videos', videos) }, [videos])
  useEffect(() => { saveToStorage('rma_custom_plans', plans) }, [plans])
  useEffect(() => { saveToStorage('rma_pricing_plans', pricingPlans) }, [pricingPlans])

  // Poll Supabase + localStorage every 5s when codes tab is open
  // to always show up-to-date used-code status
  useEffect(() => {
    if (activeTab !== 'codes') return
    const interval = setInterval(async () => {
      const fresh = await fetchCodesWithSupabase()
      setCodes(fresh)
    }, 5000)
    // Initial fetch immediately
    fetchCodesWithSupabase().then(setCodes)
    return () => clearInterval(interval)
  }, [activeTab])

  const logout = () => {
    localStorage.removeItem('rma_admin')
    navigate('/admin')
  }

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500"

  const generateBulk = () => {
    const count = Math.min(bulkCount, 10000)
    const newCodes = []
    const seen = new Set(codes.map(c => c.code))
    let attempts = 0
    while (newCodes.length < count && attempts < count * 3) {
      const code = generateCode(bulkLength)
      if (!seen.has(code)) {
        seen.add(code)
        newCodes.push({ code, used: false, usedBy: null, date: null })
      }
      attempts++
    }
    const updated = [...newCodes, ...codes]
    setCodes(updated)
    syncCodesToCloud(updated)
    loadPublicCodes()
  }

  const exportCodesCSV = () => {
    const header = 'الرقم,الكود,الحالة,المستخدم,تاريخ التفعيل\n'
    const rows = codes.map((c, i) =>
      `${i + 1},${c.code},${c.used ? 'مفعل' : 'غير مفعل'},${c.usedBy || ''},${c.date || ''}`
    ).join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rma_serial_codes.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCodesSQL = () => {
    const values = codes.map(c => `('${c.code}', 'pro', false, null, null, now())`).join(',\n')
    const sql = `INSERT INTO serial_codes (code, plan_type, is_used, used_by, used_at, created_at)\nVALUES\n${values};\n`
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rma_serial_codes.sql'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCodesJSON = () => {
    const codesOnly = codes.map(c => c.code)
    const blob = new Blob([JSON.stringify(codesOnly, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'codes.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const addVideo = (e) => {
    e.preventDefault()
    if (!videoUrl) return
    const id = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
    if (id) {
      const updated = [{ id, url: videoUrl, date: new Date().toISOString() }, ...videos]
      setVideos(updated)
      saveVideosCloud(updated)
      setVideoUrl('')
    }
  }

  const deleteVideo = (idx) => {
    const updated = videos.filter((_, i) => i !== idx)
    setVideos(updated)
    saveVideosCloud(updated)
  }

  const handleApprove = async (email) => {
    await approveRequest(email)
    refreshRequests()
  }

  const handleReject = async (email) => {
    await rejectRequest(email)
    refreshRequests()
  }

  const handleRevoke = async (email) => {
    if (!confirm('إلغاء اشتراك هذا المستخدم؟')) return
    await revokeSubscription(email)
    refreshRequests()
  }

  const handleDeleteRequest = async (email) => {
    if (!confirm('مسح هذا الطلب نهائياً؟')) return
    await deleteRequest(email)
    refreshRequests()
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')

  const savePlan = () => {
    if (!planForm.name.trim()) return
    const newPlan = { ...planForm, days: planDays, id: Date.now().toString(), createdAt: new Date().toISOString() }
    if (editingPlan) {
      setPlans(plans.map(p => p.id === editingPlan.id ? { ...newPlan } : p))
    } else {
      setPlans([newPlan, ...plans])
    }
    setShowPlanForm(false)
    setEditingPlan(null)
    resetPlanForm()
  }

  const editPlan = (plan) => {
    setEditingPlan(plan)
    setPlanForm({ name: plan.name, goal: plan.goal || '', level: plan.level || '', days: plan.days?.length || 3 })
    setPlanDays(plan.days || [{ day: 'اليوم 1', focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60 ث' }] }])
    setShowPlanForm(true)
  }

  const deletePlan = (id) => {
    if (confirm('تحذف الخطة؟')) setPlans(plans.filter(p => p.id !== id))
  }

  const resetPlanForm = () => {
    setPlanForm({ name: '', goal: '', level: '', days: 3 })
    setPlanDays([{ day: 'اليوم 1', focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60 ث' }] }])
  }

  const addDay = () => {
    const num = planDays.length + 1
    setPlanDays([...planDays, { day: `اليوم ${num}`, focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60 ث' }] }])
    setPlanForm({ ...planForm, days: planDays.length + 1 })
  }

  const removeDay = (idx) => {
    if (planDays.length <= 1) return
    const newDays = planDays.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: `اليوم ${i + 1}` }))
    setPlanDays(newDays)
    setPlanForm({ ...planForm, days: newDays.length })
  }

  const addExercise = (dayIdx) => {
    const newDays = [...planDays]
    newDays[dayIdx].exercises.push({ name: '', sets: 3, reps: '10', rest: '60 ث' })
    setPlanDays(newDays)
  }

  const removeExercise = (dayIdx, exIdx) => {
    const newDays = [...planDays]
    newDays[dayIdx].exercises = newDays[dayIdx].exercises.filter((_, i) => i !== exIdx)
    setPlanDays(newDays)
  }

  const updateExercise = (dayIdx, exIdx, field, value) => {
    const newDays = [...planDays]
    newDays[dayIdx].exercises[exIdx][field] = value
    setPlanDays(newDays)
  }

  const stats = {
    totalCodes: codes.length,
    usedCodes: codes.filter(c => c.used).length,
    availableCodes: codes.filter(c => !c.used).length,
    totalVideos: videos.length,
    pendingRequests: pendingRequests.length,
  }

  const filteredCodes = searchTerm
    ? codes.filter(c => c.code.includes(searchTerm.toUpperCase()))
    : codes

  if (!localStorage.getItem('rma_admin')) return null

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">لوحة الإدارة</h1>
          <p className="mt-1 text-sm text-zinc-400">تحكم بكل شيء</p>
        </div>
        <button
          onClick={logout}
          className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-red-600 hover:text-red-400"
        >
          خروج
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-rmared-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'إجمالي الأكواد', value: stats.totalCodes.toLocaleString(), color: 'text-white' },
              { label: 'المفعلة من الأكواد', value: stats.usedCodes.toLocaleString(), color: 'text-green-400' },
              { label: 'المتبقية من الأكواد', value: stats.availableCodes.toLocaleString(), color: 'text-rmared-500' },
              { label: 'الفيديوهات', value: stats.totalVideos, color: 'text-blue-400' },
              { label: 'طلبات معلقة', value: stats.pendingRequests.toString(), color: 'text-yellow-400' },
              { label: 'خطط مخصصة', value: plans.length.toString(), color: 'text-purple-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="mt-1 text-sm text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-lg font-bold text-green-400">مشتركين Pro النشطين</h2>
            {getActiveProUsers().length === 0 ? (
              <p className="text-sm text-zinc-500">ما في مشتركين Pro حالياً</p>
            ) : (
              <div className="space-y-2">
                {getActiveProUsers().map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{r.email}</p>
                      <p className="text-xs text-zinc-500">
                        {r.code ? `كود: ${r.code} | ` : ''}
                        {r.expiresAt ? `ينتهي: ${new Date(r.expiresAt).toLocaleDateString('ar-EG')} (${Math.ceil((new Date(r.expiresAt) - new Date()) / (1000*60*60*24))} يوم)` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => { if (confirm(`إلغاء اشتراك ${r.email}؟`)) { revokeSubscription(r.email).then(() => refreshRequests()) } }}
                      className="cursor-pointer rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                      إلغاء الاشتراك
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'codes' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs text-zinc-500">عدد الأكواد</label>
              <input type="number" value={bulkCount} onChange={e => setBulkCount(parseInt(e.target.value) || 1)} className={`${inputClass} text-sm`} />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs text-zinc-500">طول الكود</label>
              <input type="number" value={bulkLength} onChange={e => setBulkLength(parseInt(e.target.value) || 14)} className={`${inputClass} text-sm`} />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={generateBulk} className="cursor-pointer rounded-lg bg-rmared-600 px-5 py-3 font-bold text-white transition hover:bg-rmared-500">
                توليد {bulkCount.toLocaleString()} كود
              </button>
              <button onClick={exportCodesCSV} className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-500">
                CSV
              </button>
              <button onClick={exportCodesSQL} className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-500">
                SQL
              </button>
              <button onClick={exportCodesJSON} className="cursor-pointer rounded-lg border border-rmared-600 px-4 py-3 text-sm text-rmared-400 transition hover:bg-rmared-600 hover:text-white">
                JSON للنشر
              </button>
              <button onClick={() => { if (confirm('مسح كل الأكواد نهائياً؟')) { setCodes([]); syncCodesToCloud([]) } }} className="cursor-pointer rounded-lg border border-red-900 bg-red-900/30 px-4 py-3 text-sm text-red-400 transition hover:bg-red-800/70">
                ✕ مسح الكل
              </button>
              <button onClick={() => { if (confirm('مسح الأكواد غير المفعلة؟')) { clearUnusedCodes(); setCodes(prev => prev.filter(c => c.used)) } }} className="cursor-pointer rounded-lg border border-yellow-700 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-400 transition hover:bg-yellow-800/70">
                مسح الغير مفعلة
              </button>
            </div>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث عن كود..."
            className={inputClass}
          />

          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>إجمالي: {stats.totalCodes.toLocaleString()}</span>
            <span>مفعل: {stats.usedCodes.toLocaleString()}</span>
            <span>متبقي: {stats.availableCodes.toLocaleString()}</span>
          </div>

          <div className="max-h-96 space-y-1 overflow-y-auto">
            {filteredCodes.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">
                {codes.length === 0 ? 'ما في أكواد. اضغط توليد.' : 'ما في نتائج بحث'}
              </p>
            )}
            {filteredCodes.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-zinc-600">{i + 1}</span>
                  <span className="font-mono text-zinc-200">{c.code}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${c.used ? 'bg-green-900/60 text-green-300' : 'bg-zinc-800 text-zinc-500'}`}>
                    {c.used ? 'مفعل ✓' : 'جديد'}
                  </span>
                </div>
                <button
                  onClick={() => copyCode(c.code)}
                  className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-200"
                >
                  {copiedCode === c.code ? 'تم النسخ ✓' : 'نسخ'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <form onSubmit={addVideo} className="flex gap-3">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="رابط يوتيوب"
              className={inputClass}
            />
            <button type="submit" className="cursor-pointer rounded-lg bg-rmared-600 px-5 py-3 font-bold text-white transition hover:bg-rmared-500">
              إضافة
            </button>
          </form>
          {videos.length === 0 && <p className="text-center text-sm text-zinc-500">ما في فيديوهات مضافة</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {videos.map((v, i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${v.id}`}
                  title="YouTube"
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <button
                  onClick={() => deleteVideo(i)}
                  className="absolute top-2 right-2 hidden cursor-pointer rounded bg-red-600/80 px-2 py-1 text-xs text-white group-hover:block"
                >
                  مسح
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'plans' && !showPlanForm && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">الخطط المخصصة ({plans.length})</h2>
            <button onClick={() => { resetPlanForm(); setShowPlanForm(true); setEditingPlan(null) }} className="cursor-pointer rounded-lg bg-rmared-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rmared-500">
              إضافة خطة
            </button>
          </div>
          {plans.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">ما في خطط مخصصة. اضغط إضافة.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((p) => (
              <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-200">{p.name}</h3>
                    <p className="text-xs text-zinc-500">{p.days?.length || 0} أيام {p.goal ? `| ${p.goal}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editPlan(p)} className="cursor-pointer rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-600">تعديل</button>
                    <button onClick={() => deletePlan(p.id)} className="cursor-pointer rounded bg-red-800 px-2 py-1 text-xs text-red-300 transition hover:bg-red-700">مسح</button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-zinc-400">
                  {p.days?.slice(0, 3).map((d, i) => (
                    <p key={i}><span className="text-zinc-500">{d.day}:</span> {d.exercises?.length || 0} تمارين</p>
                  ))}
                  {p.days?.length > 3 && <p className="text-zinc-600">+{p.days.length - 3} أيام أخرى</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'plans' && showPlanForm && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">{editingPlan ? 'تعديل خطة' : 'خطة جديدة'}</h2>
            <button onClick={() => { setShowPlanForm(false); setEditingPlan(null) }} className="text-sm text-zinc-500 underline">رجوع</button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">اسم الخطة</label>
              <input type="text" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder="مثال: خطة متقدم MMA" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">الهدف</label>
              <input type="text" value={planForm.goal} onChange={e => setPlanForm({ ...planForm, goal: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder="حرق دهون / قوة" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">المستوى</label>
              <input type="text" value={planForm.level} onChange={e => setPlanForm({ ...planForm, level: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder="مبتدئ / متوسط" />
            </div>
          </div>

          <div className="space-y-6">
            {planDays.map((day, di) => (
              <div key={di} className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rmared-600 text-xs font-bold text-white">{di + 1}</span>
                    <input type="text" value={day.day} onChange={e => {
                      const newDays = [...planDays]; newDays[di].day = e.target.value; setPlanDays(newDays)
                    }} className="w-32 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                  </div>
                  <button onClick={() => removeDay(di)} className="cursor-pointer text-xs text-red-500 hover:text-red-400">حذف اليوم</button>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">تركيز اليوم</label>
                  <input type="text" value={day.focus} onChange={e => {
                    const newDays = [...planDays]; newDays[di].focus = e.target.value; setPlanDays(newDays)
                  }} className="mb-3 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder="صدر + كتف + ترايسبس" />
                </div>

                <div className="space-y-2">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="flex flex-wrap items-center gap-2 rounded bg-zinc-800/50 p-2">
                      <input type="text" value={ex.name} onChange={e => updateExercise(di, ei, 'name', e.target.value)} className="min-w-[180px] flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder="اسم التمرين" />
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-zinc-500">Sets:</span>
                        <input type="number" value={ex.sets} onChange={e => updateExercise(di, ei, 'sets', parseInt(e.target.value) || 0)} className="w-12 rounded border border-zinc-700 bg-zinc-900 px-1 py-1 text-center text-zinc-100 outline-none" />
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-zinc-500">Reps:</span>
                        <input type="text" value={ex.reps} onChange={e => updateExercise(di, ei, 'reps', e.target.value)} className="w-16 rounded border border-zinc-700 bg-zinc-900 px-1 py-1 text-center text-zinc-100 outline-none" />
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-zinc-500">Rest:</span>
                        <input type="text" value={ex.rest} onChange={e => updateExercise(di, ei, 'rest', e.target.value)} className="w-16 rounded border border-zinc-700 bg-zinc-900 px-1 py-1 text-center text-zinc-100 outline-none" />
                      </div>
                      <button onClick={() => removeExercise(di, ei)} className="cursor-pointer text-red-500 hover:text-red-400 text-xs ml-auto">✕</button>
                    </div>
                  ))}
                  <button onClick={() => addExercise(di)} className="cursor-pointer rounded border border-dashed border-zinc-700 px-3 py-1 text-xs text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300">
                    + إضافة تمرين
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={addDay} className="cursor-pointer rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200">
              + إضافة يوم
            </button>
            <button onClick={savePlan} className="cursor-pointer rounded-lg bg-rmared-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-rmared-500">
              {editingPlan ? 'حفظ التعديلات' : 'حفظ الخطة'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">تعديل الباقات</h2>
            <span className="text-xs text-zinc-500">التعديلات بتنحفظ تلقائياً ✓</span>
          </div>
          {pricingPlans.map((pp, pi) => (
            <div key={pp.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-zinc-200">{pp.name}</h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    <input type="checkbox" checked={pp.popular} onChange={e => {
                      const copy = [...pricingPlans]; copy[pi].popular = e.target.checked; setPricingPlans(copy)
                    }} className="accent-rmared-500" />
                    الأكثر رواجاً
                  </label>
                  <button onClick={() => { if (confirm(`مسح "${pp.name}"؟`)) setPricingPlans(pricingPlans.filter((_, i) => i !== pi)) }} className="cursor-pointer rounded bg-red-800 px-2 py-1 text-xs text-red-300 transition hover:bg-red-700">
                    ✕ مسح
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">اسم الباقة</label>
                  <input type="text" value={pp.name} onChange={e => { const c = [...pricingPlans]; c[pi].name = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">السعر</label>
                  <input type="text" value={pp.price} onChange={e => { const c = [...pricingPlans]; c[pi].price = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">العملة</label>
                  <input type="text" value={pp.currency} onChange={e => { const c = [...pricingPlans]; c[pi].currency = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">المدة</label>
                  <input type="text" value={pp.period} onChange={e => { const c = [...pricingPlans]; c[pi].period = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">نص الزر</label>
                  <input type="text" value={pp.btnText} onChange={e => { const c = [...pricingPlans]; c[pi].btnText = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">رابط الزر (مثال: /payment)</label>
                  <input type="text" value={pp.btnLink} onChange={e => { const c = [...pricingPlans]; c[pi].btnLink = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs text-zinc-500">المميزات</label>
                <div className="space-y-1">
                  {pp.features.map((f, fi) => (
                    <div key={fi} className="flex gap-1">
                      <input type="text" value={f} onChange={e => { const c = [...pricingPlans]; c[pi].features[fi] = e.target.value; setPricingPlans(c) }} className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                      <button onClick={() => { const c = [...pricingPlans]; c[pi].features = c[pi].features.filter((_, i) => i !== fi); setPricingPlans(c) }} className="cursor-pointer rounded bg-red-800 px-2 text-xs text-red-300">✕</button>
                    </div>
                  ))}
                  <button onClick={() => { const c = [...pricingPlans]; c[pi].features.push('ميزة جديدة'); setPricingPlans(c) }} className="cursor-pointer rounded border border-dashed border-zinc-700 px-3 py-1 text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-300">
                    + إضافة ميزة
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => {
              const c = [...pricingPlans]
              c.push({ id: 'plan_' + Date.now(), name: 'باقة جديدة', price: '0', currency: 'ريال', period: '/شهر', popular: false, features: ['ميزة 1', 'ميزة 2'], btnText: 'اشترك', btnLink: '/payment' })
              setPricingPlans(c)
            }} className="cursor-pointer rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200">
              + إضافة باقة جديدة
            </button>
            <button onClick={() => { if (confirm('رجوع للإعدادات الافتراضية؟')) setPricingPlans(DEFAULT_PRICING) }} className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400 underline">
              استعادة الإعدادات الافتراضية
            </button>
          </div>
          <hr className="border-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <button onClick={async () => {
                if (!confirm('نشر التعديلات لكل المستخدمين؟')) return
                setPublishStatus('loading')
                const ok = await publishPricingPlans(pricingPlans)
                setPublishStatus(ok ? 'success' : 'error')
                setTimeout(() => setPublishStatus(null), 4000)
              }} disabled={publishStatus === 'loading'} className="cursor-pointer rounded-lg bg-green-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-700/25 transition hover:bg-green-600 disabled:opacity-50">
                {publishStatus === 'loading' ? 'جاري النشر...' : '📡 نشر التعديلات'}
              </button>
            </div>
            <div>
              {publishStatus === 'success' && <span className="text-sm text-green-400">✓ تم النشر للجميع</span>}
              {publishStatus === 'error' && <span className="text-sm text-red-400">✕ فشل النشر — تأكد من إعدادات Supabase</span>}
              {!publishStatus && <span className="text-xs text-zinc-600">ينشر التعديلات لكل المستخدمين</span>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">
              طلبات التفعيل
              {stats.pendingRequests > 0 && (
                <span className="mr-2 rounded-full bg-yellow-600 px-2 py-0.5 text-xs text-white">{stats.pendingRequests}</span>
              )}
            </h2>
            <button onClick={refreshRequests} className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">⟳ تحديث</button>
          </div>
          <div className="flex gap-2">
            <input id="manualEmail" type="email" placeholder="إيميل المستخدم" className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
            <button onClick={async () => {
              const email = document.getElementById('manualEmail').value.trim()
              if (!email) return
              await submitProRequest({ email, name: 'يدوي', phone: '' })
              document.getElementById('manualEmail').value = ''
              refreshRequests()
            }} className="cursor-pointer rounded-lg bg-zinc-700 px-4 py-2 text-sm font-bold text-zinc-200 hover:bg-zinc-600">+ إضافة طلب يدوي</button>
          </div>
          {requests.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">ما في طلبات</p>
          )}
          <div className="space-y-3">
            {requests.map((r, i) => (
              <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-zinc-200">{r.email}</p>
                    <p className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleDateString('ar-EG')}</p>
                    {r.status === 'approved' && r.expiresAt && (
                      <p className="mt-1 text-xs text-zinc-500">
                        ينتهي: {new Date(r.expiresAt).toLocaleDateString('ar-EG')}
                        ({Math.ceil((new Date(r.expiresAt) - new Date()) / (1000*60*60*24))} يوم)
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    r.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                    r.status === 'approved' ? 'bg-green-600/20 text-green-400' :
                    r.status === 'revoked' ? 'bg-red-800/20 text-red-300' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    {r.status === 'pending' ? 'معلق' : r.status === 'approved' ? 'مقبول ✓' : r.status === 'revoked' ? 'ملغي' : 'مرفوض'}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(r.email)} className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-500">
                      موافقة
                    </button>
                    <button onClick={() => handleReject(r.email)} className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600">
                      رفض
                    </button>
                  </div>
                )}
                {r.status === 'approved' && (
                  <button onClick={() => handleRevoke(r.email)} className="cursor-pointer rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700">
                    إلغاء الاشتراك
                  </button>
                )}
                {r.status === 'revoked' && (
                  <span className="text-xs text-zinc-500">تم الإلغاء</span>
                )}
                <button onClick={() => handleDeleteRequest(r.email)} className="mr-auto cursor-pointer rounded bg-red-900/50 px-2 py-1 text-xs text-red-400 transition hover:bg-red-800/70">مسح</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <h2 className="text-lg font-bold text-rmared-500">حماية لوحة الإدارة</h2>
          <p className="text-sm text-zinc-400">
            الباسوورد الافتراضي: <span className="font-mono text-zinc-200">rma2025</span>
          </p>
          <p className="text-sm text-zinc-500">
            لتغييره، افتح ملف <code className="text-zinc-300">src/pages/AdminLogin.jsx</code> وغير قيمة <code className="text-zinc-300">ADMIN_PASS</code>
          </p>
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <h3 className="mb-2 text-sm font-bold text-zinc-300">روابط سريعة</h3>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li><span className="text-rmared-500">/</span> — الرئيسية</li>
              <li><span className="text-rmared-500">/generator</span> — مولد الخطط</li>
              <li><span className="text-rmared-500">/pricing</span> — الباقات + تفعيل الكود</li>
              <li><span className="text-rmared-500">/login</span> — تسجيل الدخول</li>
              <li><span className="text-rmared-500">/admin</span> — دخول المشرفين</li>
              <li><span className="text-rmared-500">/admin/panel</span> — لوحة الإدارة</li>
            </ul>
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <h4 className="mb-1 text-xs font-bold text-zinc-400">📢 نشر الأكواد للمستخدمين</h4>
              <ol className="space-y-1 text-xs text-zinc-500">
                <li>1. في تبويب "أكواد التفعيل" اضغط <span className="text-rmared-400">JSON للنشر</span></li>
                <li>2. حط الملف <code className="text-zinc-300">codes.json</code> في مجلد <code className="text-zinc-300">public/</code></li>
                <li>3. المستخدمين يدخلوا الكود من <code className="text-zinc-300">/pricing</code></li>
                <li>4. أو شغّل SQL حق Supabase عشان قاعدة البيانات</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
