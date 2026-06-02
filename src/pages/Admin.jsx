import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lib/lang'
import { getRequests, getRequestsLocal, approveRequest, rejectRequest, submitProRequest, revokeSubscription, deleteRequest, syncCodesToCloud, loadPublicCodes, syncRequestsCloud, clearUnusedCodes, getActiveProUsers, saveVideosCloud, loadAds, syncAdsCloud, publishAdsToCloud, getRegisteredUsers, setUserExpiry, getNotifications, sendNotification, deleteNotificationByMessage, clearAllNotifications } from '../lib/plan'
import { publishPricingPlans } from '../lib/pricing-sync'

async function fetchCodesWithSupabase() {
  try {
    const { supabase } = await import('../lib/supabase')
    if (supabase) {
      const { data } = await supabase.from('app_data').select('value').eq('key', 'serial_codes').single()
      const cloud = data?.value
      if (Array.isArray(cloud)) {
        const local = loadFromStorage('rma_codes', [])
        const localMap = new Map(local.map(c => [c.code, c]))
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

export default function Admin() {
  const { t } = useLang()
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
  const [planDays, setPlanDays] = useState([{ day: t('plan_default_day_1'), focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60 ث' }] }])
  const [ads, setAds] = useState(() => loadAds())
  const [users, setUsers] = useState([])
  const [showAdForm, setShowAdForm] = useState(false)
  const [editingAd, setEditingAd] = useState(null)
  const [adForm, setAdForm] = useState({ name: '', type: 'banner', imageUrl: '', videoUrl: '', linkUrl: '', position: 'home_middle', order: 1, active: true, width: '', height: '' })
  const [notifMessage, setNotifMessage] = useState('')
  const [notifTargetType, setNotifTargetType] = useState('all')
  const [notifTargetEmail, setNotifTargetEmail] = useState('')
  const [notifSent, setNotifSent] = useState(false)
  const [notifHistory, setNotifHistory] = useState([])
  const [notifScheduledAt, setNotifScheduledAt] = useState('')
  const [notifUseSchedule, setNotifUseSchedule] = useState(false)

  const tabs = [
    { id: 'dashboard', label: t('tab_dashboard') },
    { id: 'plans', label: t('tab_plans') },
    { id: 'pricing', label: t('tab_pricing') },
    { id: 'requests', label: t('tab_requests') },
    { id: 'codes', label: t('tab_codes') },
    { id: 'videos', label: t('tab_videos') },
    { id: 'ads', label: t('tab_ads') },
    { id: 'users', label: t('tab_users') },
    { id: 'notifications', label: t('tab_notifications') },
    { id: 'settings', label: t('tab_settings') },
  ]

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

  useEffect(() => { if (ads.length > 0) publishAdsToCloud(ads) }, [ads])

  useEffect(() => { if (activeTab === 'users') getRegisteredUsers().then(setUsers).catch(() => {}) }, [activeTab])

  useEffect(() => {
    if (activeTab === 'notifications') {
      getNotifications().then(setNotifHistory).catch(() => {})
      const interval = setInterval(() => getNotifications().then(fresh => {
        setNotifHistory(prev => {
          const prevMsgs = new Set(prev.map(x => x.message))
          const added = fresh.filter(x => !prevMsgs.has(x.message))
          return added.length > 0 ? [...added, ...prev] : prev
        })
      }).catch(() => {}), 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab !== 'codes') return
    const interval = setInterval(async () => {
      const fresh = await fetchCodesWithSupabase()
      setCodes(fresh)
    }, 5000)
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
    if (!confirm(t('confirm_revoke_user', { email }))) return
    await revokeSubscription(email)
    refreshRequests()
  }

  const handleDeleteRequest = async (email) => {
    if (!confirm(t('confirm_delete_request'))) return
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
    setPlanDays(plan.days || [{ day: t('plan_default_day_1'), focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60 ث' }] }])
    setShowPlanForm(true)
  }

  const deletePlan = (id) => {
    if (confirm(t('confirm_delete_plan'))) setPlans(plans.filter(p => p.id !== id))
  }

  const resetPlanForm = () => {
    setPlanForm({ name: '', goal: '', level: '', days: 3 })
    setPlanDays([{ day: t('plan_default_day_1'), focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60 ث' }] }])
  }

  const addDay = () => {
    const num = planDays.length + 1
    setPlanDays([...planDays, { day: t('plan_default_day_n', { n: num }), focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60 ث' }] }])
    setPlanForm({ ...planForm, days: planDays.length + 1 })
  }

  const removeDay = (idx) => {
    if (planDays.length <= 1) return
    const newDays = planDays.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: t('plan_default_day_n', { n: i + 1 }) }))
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
          <h1 className="text-2xl font-bold md:text-3xl">{t('admin_title')}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t('admin_subtitle')}</p>
        </div>
        <button
          onClick={logout}
          className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-red-600 hover:text-red-400"
        >
          {t('admin_logout')}
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
              { label: t('stats_total_codes'), value: stats.totalCodes.toLocaleString(), color: 'text-white' },
              { label: t('stats_used_codes'), value: stats.usedCodes.toLocaleString(), color: 'text-green-400' },
              { label: t('stats_available_codes'), value: stats.availableCodes.toLocaleString(), color: 'text-rmared-500' },
              { label: t('stats_videos'), value: stats.totalVideos, color: 'text-blue-400' },
              { label: t('stats_pending_requests'), value: stats.pendingRequests.toString(), color: 'text-yellow-400' },
              { label: t('stats_custom_plans'), value: plans.length.toString(), color: 'text-purple-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="mt-1 text-sm text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-lg font-bold text-green-400">{t('active_title')}</h2>
            {getActiveProUsers().length === 0 ? (
              <p className="text-sm text-zinc-500">{t('active_no_users')}</p>
            ) : (
              <div className="space-y-2">
                {getActiveProUsers().map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{r.email}</p>
                      <p className="text-xs text-zinc-500">
                        {r.code ? `${t('active_code')}: ${r.code} | ` : ''}
                        {r.expiresAt ? `${t('active_expires')}: ${new Date(r.expiresAt).toLocaleDateString('ar-EG')} (${Math.ceil((new Date(r.expiresAt) - new Date()) / (1000*60*60*24))} ${t('dash_day')})` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => { if (confirm(t('confirm_revoke_user', { email: r.email }))) { revokeSubscription(r.email).then(() => refreshRequests()) } }}
                      className="cursor-pointer rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                    >
                      {t('active_revoke')}
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
              <label className="mb-1 block text-xs text-zinc-500">{t('code_count')}</label>
              <input type="number" value={bulkCount} onChange={e => setBulkCount(parseInt(e.target.value) || 1)} className={`${inputClass} text-sm`} />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs text-zinc-500">{t('code_length')}</label>
              <input type="number" value={bulkLength} onChange={e => setBulkLength(parseInt(e.target.value) || 14)} className={`${inputClass} text-sm`} />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={generateBulk} className="cursor-pointer rounded-lg bg-rmared-600 px-5 py-3 font-bold text-white transition hover:bg-rmared-500">
                {t('code_generate', { count: bulkCount.toLocaleString() })}
              </button>
              <button onClick={exportCodesCSV} className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-500">
                {t('code_export_csv')}
              </button>
              <button onClick={exportCodesSQL} className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-500">
                {t('code_export_sql')}
              </button>
              <button onClick={exportCodesJSON} className="cursor-pointer rounded-lg border border-rmared-600 px-4 py-3 text-sm text-rmared-400 transition hover:bg-rmared-600 hover:text-white">
                {t('code_export_json')}
              </button>
              <button onClick={() => { if (confirm(t('confirm_delete_all_codes'))) { setCodes([]); syncCodesToCloud([]) } }} className="cursor-pointer rounded-lg border border-red-900 bg-red-900/30 px-4 py-3 text-sm text-red-400 transition hover:bg-red-800/70">
                {t('code_clear_all')}
              </button>
              <button onClick={() => { if (confirm(t('confirm_clear_unused'))) { clearUnusedCodes(); setCodes(prev => prev.filter(c => c.used)) } }} className="cursor-pointer rounded-lg border border-yellow-700 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-400 transition hover:bg-yellow-800/70">
                {t('code_clear_unused')}
              </button>
            </div>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('code_search')}
            className={inputClass}
          />

          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>{t('code_total')}: {stats.totalCodes.toLocaleString()}</span>
            <span>{t('code_used_label')}: {stats.usedCodes.toLocaleString()}</span>
            <span>{t('code_available_label')}: {stats.availableCodes.toLocaleString()}</span>
          </div>

          <div className="max-h-96 space-y-1 overflow-y-auto">
            {filteredCodes.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">
                {codes.length === 0 ? t('code_no_codes_hint') : t('code_no_results')}
              </p>
            )}
            {filteredCodes.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-8 text-zinc-600">{i + 1}</span>
                  <span className="font-mono text-zinc-200">{c.code}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${c.used ? 'bg-green-900/60 text-green-300' : 'bg-zinc-800 text-zinc-500'}`}>
                    {c.used ? t('code_active_badge') : t('code_new_badge')}
                  </span>
                </div>
                <button
                  onClick={() => copyCode(c.code)}
                  className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-200"
                >
                  {copiedCode === c.code ? t('code_copied') : t('code_copy')}
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
              placeholder={t('vid_pl')}
              className={inputClass}
            />
            <button type="submit" className="cursor-pointer rounded-lg bg-rmared-600 px-5 py-3 font-bold text-white transition hover:bg-rmared-500">
              {t('vid_add')}
            </button>
          </form>
          {videos.length === 0 && <p className="text-center text-sm text-zinc-500">{t('vid_no_videos')}</p>}
          <div className="flex justify-end">
            {videos.length > 0 && (
              <button onClick={() => { setVideos([]); saveVideosCloud([]) }} className="cursor-pointer rounded-lg bg-red-700/50 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-700">
                {t('vid_clear')}
              </button>
            )}
          </div>
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
                  className="absolute top-2 right-2 cursor-pointer rounded bg-red-600/80 px-2 py-1 text-xs text-white transition hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'plans' && !showPlanForm && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">{t('admin_plan')} ({plans.length})</h2>
            <button onClick={() => { resetPlanForm(); setShowPlanForm(true); setEditingPlan(null) }} className="cursor-pointer rounded-lg bg-rmared-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rmared-500">
              {t('admin_add_plan')}
            </button>
          </div>
          {plans.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">{t('plan_no_plans')}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((p) => (
              <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-200">{p.name}</h3>
                    <p className="text-xs text-zinc-500">{p.days?.length || 0} {t('days')}{p.goal ? ` | ${p.goal}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editPlan(p)} className="cursor-pointer rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-600">{t('admin_edit_plan')}</button>
                    <button onClick={() => deletePlan(p.id)} className="cursor-pointer rounded bg-red-800 px-2 py-1 text-xs text-red-300 transition hover:bg-red-700">{t('admin_delete_plan')}</button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-zinc-400">
                  {p.days?.slice(0, 3).map((d, i) => (
                    <p key={i}><span className="text-zinc-500">{d.day}:</span> {d.exercises?.length || 0}</p>
                  ))}
                  {p.days?.length > 3 && <p className="text-zinc-600">{t('plan_more_days', { count: p.days.length - 3 })}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'plans' && showPlanForm && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">{editingPlan ? t('plan_edit_title') : t('plan_new_title')}</h2>
            <button onClick={() => { setShowPlanForm(false); setEditingPlan(null) }} className="text-sm text-zinc-500 underline">{t('plan_back')}</button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-zinc-500">{t('plan_name_label')}</label>
              <input type="text" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder={t('plan_name_pl')} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">{t('plan_goal_label')}</label>
              <input type="text" value={planForm.goal} onChange={e => setPlanForm({ ...planForm, goal: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder={t('plan_goal_pl')} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">{t('plan_level_label')}</label>
              <input type="text" value={planForm.level} onChange={e => setPlanForm({ ...planForm, level: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder={t('plan_level_pl')} />
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
                  <button onClick={() => removeDay(di)} className="cursor-pointer text-xs text-red-500 hover:text-red-400">{t('plan_delete_day')}</button>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">{t('plan_focus_label')}</label>
                  <input type="text" value={day.focus} onChange={e => {
                    const newDays = [...planDays]; newDays[di].focus = e.target.value; setPlanDays(newDays)
                  }} className="mb-3 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder={t('plan_focus_pl')} />
                </div>

                <div className="space-y-2">
                  {day.exercises.map((ex, ei) => (
                    <div key={ei} className="flex flex-wrap items-center gap-2 rounded bg-zinc-800/50 p-2">
                      <input type="text" value={ex.name} onChange={e => updateExercise(di, ei, 'name', e.target.value)} className="min-w-[180px] flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-rmared-500" placeholder={t('plan_exercise_name_pl')} />
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
                    {t('plan_add_exercise')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={addDay} className="cursor-pointer rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200">
              {t('plan_add_day')}
            </button>
            <button onClick={savePlan} className="cursor-pointer rounded-lg bg-rmared-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-rmared-500">
              {editingPlan ? t('plan_save_edit') : t('plan_save_new')}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">{t('pricing_edit_title')}</h2>
            <span className="text-xs text-zinc-500">{t('pricing_auto_save')}</span>
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
                    {t('pricing_popular')}
                  </label>
                  <button onClick={() => { if (confirm(`${t('pricing_delete')} "${pp.name}"?`)) setPricingPlans(pricingPlans.filter((_, i) => i !== pi)) }} className="cursor-pointer rounded bg-red-800 px-2 py-1 text-xs text-red-300 transition hover:bg-red-700">
                    {t('pricing_delete')}
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">{t('pricing_plan_name')}</label>
                  <input type="text" value={pp.name} onChange={e => { const c = [...pricingPlans]; c[pi].name = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">{t('pricing_price')}</label>
                  <input type="text" value={pp.price} onChange={e => { const c = [...pricingPlans]; c[pi].price = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">{t('pricing_currency')}</label>
                  <input type="text" value={pp.currency} onChange={e => { const c = [...pricingPlans]; c[pi].currency = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">{t('pricing_period')}</label>
                  <input type="text" value={pp.period} onChange={e => { const c = [...pricingPlans]; c[pi].period = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">{t('pricing_btn_text')}</label>
                  <input type="text" value={pp.btnText} onChange={e => { const c = [...pricingPlans]; c[pi].btnText = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">{t('pricing_btn_link')}</label>
                  <input type="text" value={pp.btnLink} onChange={e => { const c = [...pricingPlans]; c[pi].btnLink = e.target.value; setPricingPlans(c) }} className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs text-zinc-500">{t('pricing_features')}</label>
                <div className="space-y-1">
                  {pp.features.map((f, fi) => (
                    <div key={fi} className="flex gap-1">
                      <input type="text" value={f} onChange={e => { const c = [...pricingPlans]; c[pi].features[fi] = e.target.value; setPricingPlans(c) }} className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
                      <button onClick={() => { const c = [...pricingPlans]; c[pi].features = c[pi].features.filter((_, i) => i !== fi); setPricingPlans(c) }} className="cursor-pointer rounded bg-red-800 px-2 text-xs text-red-300">✕</button>
                    </div>
                  ))}
                  <button onClick={() => { const c = [...pricingPlans]; c[pi].features.push(t('pricing_new_feature')); setPricingPlans(c) }} className="cursor-pointer rounded border border-dashed border-zinc-700 px-3 py-1 text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-300">
                    {t('pricing_add_feature')}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => {
              const c = [...pricingPlans]
              c.push({ id: 'plan_' + Date.now(), name: t('pricing_new_plan_name'), price: '0', currency: t('pricing_default_currency'), period: t('pricing_default_period'), popular: false, features: [t('pricing_feature_1'), t('pricing_feature_2')], btnText: t('pricing_default_btn'), btnLink: '/payment' })
              setPricingPlans(c)
            }} className="cursor-pointer rounded-lg border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200">
              {t('pricing_add_plan')}
            </button>
            <button onClick={() => { if (confirm(t('confirm_reset_pricing'))) setPricingPlans(DEFAULT_PRICING) }} className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400 underline">
              {t('pricing_reset_default')}
            </button>
          </div>
          <hr className="border-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <button onClick={async () => {
                if (!confirm(t('confirm_publish'))) return
                setPublishStatus('loading')
                const ok = await publishPricingPlans(pricingPlans)
                setPublishStatus(ok ? 'success' : 'error')
                setTimeout(() => setPublishStatus(null), 4000)
              }} disabled={publishStatus === 'loading'} className="cursor-pointer rounded-lg bg-green-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-700/25 transition hover:bg-green-600 disabled:opacity-50">
                {publishStatus === 'loading' ? t('publishing') : t('pricing_publish')}
              </button>
            </div>
            <div>
              {publishStatus === 'success' && <span className="text-sm text-green-400">{t('publish_success')}</span>}
              {publishStatus === 'error' && <span className="text-sm text-red-400">{t('publish_error')}</span>}
              {!publishStatus && <span className="text-xs text-zinc-600">{t('publish_hint')}</span>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">
              {t('admin_reqs')}
              {stats.pendingRequests > 0 && (
                <span className="mr-2 rounded-full bg-yellow-600 px-2 py-0.5 text-xs text-white">{stats.pendingRequests}</span>
              )}
            </h2>
            <button onClick={refreshRequests} className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">{t('req_refresh')}</button>
          </div>
          <div className="flex gap-2">
            <input id="manualEmail" type="email" placeholder={t('req_email_pl')} className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
            <button onClick={async () => {
              const email = document.getElementById('manualEmail').value.trim()
              if (!email) return
              await submitProRequest({ email, name: 'يدوي', phone: '' })
              document.getElementById('manualEmail').value = ''
              refreshRequests()
            }} className="cursor-pointer rounded-lg bg-zinc-700 px-4 py-2 text-sm font-bold text-zinc-200 hover:bg-zinc-600">{t('req_add_manual')}</button>
          </div>
          {requests.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">{t('req_no_requests')}</p>
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
                        {t('active_expires')}: {new Date(r.expiresAt).toLocaleDateString('ar-EG')}
                        ({Math.ceil((new Date(r.expiresAt) - new Date()) / (1000*60*60*24))} {t('dash_day')})
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    r.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                    r.status === 'approved' ? 'bg-green-600/20 text-green-400' :
                    r.status === 'revoked' ? 'bg-red-800/20 text-red-300' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    {r.status === 'pending' ? t('req_pending') : r.status === 'approved' ? `${t('req_approved')} ✓` : r.status === 'revoked' ? t('req_status_revoked') : t('req_rejected')}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(r.email)} className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-500">
                      {t('req_approve')}
                    </button>
                    <button onClick={() => handleReject(r.email)} className="cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600">
                      {t('req_reject')}
                    </button>
                  </div>
                )}
                {r.status === 'approved' && (
                  <button onClick={() => handleRevoke(r.email)} className="cursor-pointer rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700">
                    {t('req_revoke')}
                  </button>
                )}
                {r.status === 'revoked' && (
                  <span className="text-xs text-zinc-500">{t('req_revoked_note')}</span>
                )}
                <button onClick={() => handleDeleteRequest(r.email)} className="mr-auto cursor-pointer rounded bg-red-900/50 px-2 py-1 text-xs text-red-400 transition hover:bg-red-800/70">{t('req_delete')}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">{t('ads_title')}</h2>
            <button onClick={() => { setEditingAd(null); setAdForm({ name: '', type: 'banner', imageUrl: '', videoUrl: '', linkUrl: '', position: 'home_middle', order: 1, active: true }); setShowAdForm(true) }} className="cursor-pointer rounded-lg bg-rmared-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rmared-500">{t('ads_add')}</button>
          </div>
          {showAdForm && (
            <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <h3 className="text-sm font-bold text-zinc-200">{editingAd ? t('ads_edit') : t('ads_new')}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" placeholder={t('ads_name_pl')} value={adForm.name} onChange={e => setAdForm({ ...adForm, name: e.target.value })} />
                <select className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={adForm.type} onChange={e => setAdForm({ ...adForm, type: e.target.value })}>
                  <option value="banner">{t('ads_type_banner')}</option>
                  <option value="video">{t('ads_type_video')}</option>
                </select>
                <input className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" placeholder={t('ads_image_url')} value={adForm.imageUrl} onChange={e => setAdForm({ ...adForm, imageUrl: e.target.value })} />
                <input className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" placeholder={t('ads_video_url')} value={adForm.videoUrl} onChange={e => setAdForm({ ...adForm, videoUrl: e.target.value })} />
                <input className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" placeholder={t('ads_link_url')} value={adForm.linkUrl} onChange={e => setAdForm({ ...adForm, linkUrl: e.target.value })} />
                <input className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" placeholder={t('ads_width')} value={adForm.width || ''} onChange={e => setAdForm({ ...adForm, width: e.target.value })} />
                <input className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" placeholder={t('ads_height')} value={adForm.height || ''} onChange={e => setAdForm({ ...adForm, height: e.target.value })} />
                <select className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" value={adForm.position} onChange={e => setAdForm({ ...adForm, position: e.target.value })}>
                  <option value="home_top">{t('ads_pos_top')}</option>
                  <option value="home_left">{t('ads_pos_left')}</option>
                  <option value="home_right">{t('ads_pos_right')}</option>
                  <option value="home_middle">{t('ads_pos_middle')}</option>
                  <option value="home_bottom">{t('ads_pos_bottom')}</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  <input type="checkbox" checked={adForm.active} onChange={e => setAdForm({ ...adForm, active: e.target.checked })} />
                  {t('ads_active')}
                </label>
                <div className="flex-1" />
                <button onClick={() => { setShowAdForm(false); setEditingAd(null) }} className="cursor-pointer rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-200">{t('code_unused')}</button>
                <button onClick={() => {
                  const updated = editingAd
                    ? ads.map(a => a === editingAd ? { ...adForm } : a)
                    : [...ads, { ...adForm, order: ads.length + 1 }]
                  setAds(updated)
                  setShowAdForm(false)
                  setEditingAd(null)
                }} className="cursor-pointer rounded bg-rmared-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rmared-500">{t('ads_save')}</button>
              </div>
            </div>
          )}
          {ads.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{t('ads_no_ads')}</p>
          ) : (
            <div className="space-y-2">
              {ads.map((ad, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                  <span className="text-xs text-zinc-500">{ad.order || i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">{ad.name || t('ads_unnamed')}</p>
                    <p className="text-xs text-zinc-500">{ad.type} · {ad.position}</p>
                  </div>
                  <span className={`text-xs ${ad.active !== false ? 'text-green-500' : 'text-zinc-500'}`}>{ad.active !== false ? t('ads_active') : '—'}</span>
                  <button onClick={() => { setEditingAd(ad); setAdForm({ ...ad }); setShowAdForm(true) }} className="cursor-pointer rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition hover:text-zinc-200">{t('pricing_edit_title')}</button>
                  <button onClick={() => { if (confirm(t('confirm_delete_ad'))) { setAds(ads.filter((_, j) => j !== i)) } }} className="cursor-pointer rounded border border-red-900 px-2 py-1 text-xs text-red-400 transition hover:bg-red-900/50">{t('req_delete')}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">{t('tab_users')}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">{users.length} {t('users_count_label')}</span>
              <button onClick={() => getRegisteredUsers().then(setUsers).catch(() => {})} className="cursor-pointer rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200">{t('req_refresh')}</button>
            </div>
          </div>
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{t('users_no_users')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 text-left text-zinc-400">
                    <th className="pb-2 pr-3">{'#'}</th>
                    <th className="pb-2 pr-3">{t('req_email_pl')}</th>
                    <th className="pb-2 pr-3">{t('users_registered_at')}</th>
                    <th className="pb-2 pr-3">{t('tab_requests')}</th>
                    <th className="pb-2">{t('pricing_expires')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.email} className="border-b border-zinc-800 text-zinc-300">
                      <td className="py-2 pr-3 text-zinc-500">{i + 1}</td>
                      <td className="py-2 pr-3">{u.email}</td>
                      <td className="py-2 pr-3 text-zinc-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="py-2 pr-3">
                        <span className={`text-xs ${u.status === 'approved' ? 'text-green-500' : u.status === 'pending' ? 'text-yellow-500' : u.status === 'revoked' ? 'text-red-500' : 'text-zinc-500'}`}>
                          {u.status || '—'}
                        </span>
                      </td>
                      <td className="py-2 text-zinc-400">
                        <div className="flex items-center gap-2">
                          <input type="date" defaultValue={u.expiresAt ? new Date(u.expiresAt).toISOString().split('T')[0] : ''} onChange={e => { u._expiry = e.target.value }} className="w-32 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200" />
                          <button onClick={async () => {
                            const val = u._expiry
                            if (val) {
                              await setUserExpiry(u.email, new Date(val).toISOString())
                              alert('تم تحديث تاريخ انتهاء الاشتراك')
                              getRegisteredUsers().then(setUsers).catch(() => {})
                            }
                          }} className="cursor-pointer rounded bg-rmared-600 px-2 py-1 text-xs text-white hover:bg-rmared-500">{t('ads_save')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-rmared-500">{t('tab_notifications')}</h2>
            {notifHistory.length > 0 && (
              <button onClick={async () => {
                if (confirm('مسح كل الإشعارات نهائياً؟')) {
                  await clearAllNotifications()
                  setNotifHistory([])
                }
              }} className="cursor-pointer rounded border border-red-900 bg-red-900/30 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-800/70">
                ✕ {t('code_clear_all')}
              </button>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <h3 className="text-sm font-bold text-zinc-200">{t('notif_title')}</h3>
            <textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500" placeholder={t('notif_message_pl')} />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input type="radio" name="notifTarget" checked={notifTargetType === 'all'} onChange={() => setNotifTargetType('all')} className="accent-rmared-500" />
                {t('notif_target_all')}
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input type="radio" name="notifTarget" checked={notifTargetType === 'specific'} onChange={() => setNotifTargetType('specific')} className="accent-rmared-500" />
                {t('notif_target_specific')}
              </label>
            </div>
            {notifTargetType === 'specific' && (
              <input type="email" value={notifTargetEmail} onChange={e => setNotifTargetEmail(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-rmared-500 focus:ring-1 focus:ring-rmared-500" placeholder={t('notif_email_pl')} />
            )}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input type="checkbox" checked={notifUseSchedule} onChange={e => setNotifUseSchedule(e.target.checked)} className="accent-rmared-500" />
                {t('notif_schedule_label')}
              </label>
              {notifUseSchedule && (
                <input type="datetime-local" value={notifScheduledAt} onChange={e => setNotifScheduledAt(e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-rmared-500" />
              )}
            </div>
            {notifMessage && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                <p className="mb-1 text-xs text-zinc-500">{t('notif_preview')}:</p>
                <p className="text-sm text-zinc-200">{notifMessage}</p>
                {notifUseSchedule && notifScheduledAt && (
                  <p className="mt-1 text-xs text-yellow-500">{t('notif_scheduled_time')}: {new Date(notifScheduledAt).toLocaleString()}</p>
                )}
              </div>
            )}
            <button onClick={async () => {
              if (!notifMessage.trim()) return
              await sendNotification({
                message: notifMessage.trim(),
                targetType: notifTargetType,
                targetEmail: notifTargetEmail,
                scheduledAt: notifUseSchedule && notifScheduledAt ? new Date(notifScheduledAt).toISOString() : null
              })
              setNotifSent(true)
              setNotifMessage('')
              setNotifTargetEmail('')
              setNotifScheduledAt('')
              setNotifUseSchedule(false)
              setTimeout(() => setNotifSent(false), 3000)
              getNotifications().then(setNotifHistory).catch(() => {})
            }} className="cursor-pointer rounded-lg bg-rmared-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-rmared-500 disabled:opacity-50" disabled={!notifMessage.trim()}>
              {notifSent ? t('notif_sent') : t('notif_send')}
            </button>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-400">{t('notif_history')} ({notifHistory.length})</h3>
            </div>
            {notifHistory.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">{t('notif_no_notifs')}</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {notifHistory.map((n, notifIdx) => (
                  <div key={n.id || notifIdx} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1 text-sm text-zinc-200">{n.message}</p>
                      <button onClick={async () => {
                        await deleteNotificationByMessage(n.message)
                        setNotifHistory(prev => prev.filter(x => x.id !== n.id))
                      }} className="shrink-0 cursor-pointer rounded bg-red-900/50 px-1.5 py-0.5 text-xs text-red-400 transition hover:bg-red-800">✕</button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-zinc-500">{n.targetType === 'all' ? t('notif_target_all') : `${t('notif_target_specific')}: ${n.targetEmail}`}</span>
                      <span className="text-xs text-zinc-600">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
                      {n.scheduledAt && (
                        <span className="text-xs text-yellow-600">
                          {t('notif_scheduled_time')}: {new Date(n.scheduledAt).toLocaleString()}
                          {new Date(n.scheduledAt).getTime() > Date.now() && <span className="text-zinc-600"> ({t('notif_pending')})</span>}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <h2 className="text-lg font-bold text-rmared-500">{t('settings_title')}</h2>
          <p className="text-sm text-zinc-400">
            {t('settings_pass_info', { pass: 'rma2025' })}
          </p>
          <p className="text-sm text-zinc-500">
            {t('settings_change_info', { file: 'src/pages/AdminLogin.jsx', var: 'ADMIN_PASS' })}
          </p>
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <h3 className="mb-2 text-sm font-bold text-zinc-300">{t('settings_quick_links')}</h3>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li><span className="text-rmared-500">/</span> — {t('settings_route_home')}</li>
              <li><span className="text-rmared-500">/generator</span> — {t('settings_route_gen')}</li>
              <li><span className="text-rmared-500">/pricing</span> — {t('settings_route_pricing')}</li>
              <li><span className="text-rmared-500">/login</span> — {t('settings_route_login')}</li>
              <li><span className="text-rmared-500">/admin</span> — {t('settings_route_admin')}</li>
              <li><span className="text-rmared-500">/admin/panel</span> — {t('settings_route_panel')}</li>
            </ul>
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
              <h4 className="mb-1 text-xs font-bold text-zinc-400">{t('settings_publish_info_title')}</h4>
              <ol className="space-y-1 text-xs text-zinc-500">
                <li>{t('settings_publish_step1', { btn: t('code_export_json') })}</li>
                <li>{t('settings_publish_step2', { file: 'codes.json', folder: 'public/' })}</li>
                <li>{t('settings_publish_step3')}</li>
                <li>{t('settings_publish_step4')}</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
