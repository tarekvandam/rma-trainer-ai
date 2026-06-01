import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLocalSession, localSignOut } from '../lib/auth'
import { getRequestStatus, getPlan, activatePro, getProfile, saveProfile, daysRemaining, syncVideosCloud } from '../lib/plan'
import { useLang } from '../lib/lang'

export default function Dashboard() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState(null)
  const [profile, setProfile] = useState({ name: '', phone: '', goal: '' })
  const [saved, setSaved] = useState(false)
  const [videos, setVideos] = useState([])

  useEffect(() => {
    ;(async () => {
      const s = getLocalSession()
      if (!s) { navigate('/login'); return }
      setSession(s)
      const st = await getRequestStatus(s.email)
      if (st === 'revoked') { setStatus('revoked'); return }
      const plan = getPlan()
      if (plan.type !== 'pro') {
        setStatus(st)
        if (st === 'approved') {
          await activatePro('approved')
          return
        }
        if (st === 'pending') return
        if (st === 'rejected') return
        navigate('/pricing')
        return
      }
      setStatus('approved')
      setProfile(getProfile(s.email))
    })()
  }, [navigate])

  useEffect(() => {
    ;(async () => {
      const cloud = await syncVideosCloud()
      if (cloud) setVideos(cloud)
      else setVideos(() => { try { return JSON.parse(localStorage.getItem('rma_videos')) || [] } catch { return [] } })
    })()
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    if (!session) return
    saveProfile(session.email, profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = () => {
    localSignOut()
    navigate('/')
  }

  if (!session) return null
  if (status === 'pending') {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-4 pt-16 text-center">
        <div className="text-6xl">⏳</div>
        <h1 className="text-2xl font-bold">{t('dash_pending_title')}</h1>
        <p className="max-w-sm text-zinc-400">{t('dash_pending_desc')}</p>
        <button onClick={() => navigate('/')} className="text-rmared-500 underline">{t('dash_pending_home')}</button>
      </div>
    )
  }

  if (status === 'rejected' || status === 'revoked') {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-4 pt-16 text-center">
        <div className="text-6xl">{status === 'revoked' ? '🔒' : '😞'}</div>
        <h1 className="text-2xl font-bold">{status === 'revoked' ? t('dash_revoked_title') : t('dash_rejected_title')}</h1>
        <p className="max-w-sm text-zinc-400">
          {status === 'revoked' ? t('dash_revoked_desc') : t('dash_rejected_desc')}
        </p>
        <div className="rounded-lg bg-zinc-800 p-4 text-sm text-zinc-300">
          <p>{t('dash_revoked_contact')}: <span className="text-rmared-400" dir="ltr">01001904418</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="text-rmared-500 underline">{t('dash_pending_home')}</button>
          <button onClick={() => { localSignOut(); navigate('/login') }} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500">
            {t('auth_signout')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dash_title')}</h1>
          <p className="text-sm text-zinc-400">{session.email}</p>
          <p className="text-xs text-green-500">{t('dash_pro')} — {t('dash_days')} {daysRemaining()} {t('dash_day')}</p>
        </div>
        <button onClick={handleLogout} className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-red-600 hover:text-red-400">
          {t('auth_signout')}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
        <h2 className="mb-4 text-lg font-bold text-rmared-500">{t('dash_profile')}</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">الاسم</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition focus:border-rmared-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">{t('dash_phone')}</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition focus:border-rmared-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-zinc-400">{t('dash_goal')}</label>
              <textarea
                value={profile.goal}
                onChange={e => setProfile({ ...profile, goal: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition focus:border-rmared-500"
              />
            </div>
          </div>
          <button type="submit" className="cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white transition hover:bg-rmared-500">
            {saved ? t('dash_saved') : t('dash_save')}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
        <h2 className="mb-4 text-lg font-bold text-rmared-500">{t('dash_videos')}</h2>
        {videos.length === 0 && (
          <p className="text-center text-sm text-zinc-500">{t('dash_no_videos')}</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {videos.map((v, i) => (
            <div key={i} className="overflow-hidden rounded-lg">
              <iframe
                src={`https://www.youtube.com/embed/${v.id}`}
                title="YouTube"
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center md:p-6">
        <h2 className="mb-3 text-lg font-bold text-rmared-500">{t('dash_contact')}</h2>
        <div className="space-y-2 text-sm text-zinc-300">
          <p>واتساب: <span className="text-rmared-400 font-bold" dir="ltr">01001904418</span></p>
        </div>
      </div>
    </div>
  )
}
