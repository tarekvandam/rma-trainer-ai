import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/lang'
import { getVisitorCount, loadAds, syncAdsCloud } from '../lib/plan'
import AdDisplay from '../components/AdDisplay'

export default function Home() {
  const { t } = useLang()
  const [visitors, setVisitors] = useState(0)
  const [ads, setAds] = useState([])

  useEffect(() => {
    getVisitorCount().then(setVisitors)
    syncAdsCloud().then(data => { if (data) setAds(data) })
    const interval = setInterval(() => syncAdsCloud().then(data => { if (data) setAds(data) }), 30000)
    return () => clearInterval(interval)
  }, [])

  const mainContent = (
    <>
      <div className="flex flex-col items-center gap-4 pt-8 text-center">
        <div className="text-5xl">🥋</div>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
          <span className="text-rmared-500">{t('home_title1')}</span> {t('home_title2')}
        </h1>
        <p className="max-w-md text-lg text-zinc-400">{t('home_desc')}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link to="/generator" className="inline-block w-full max-w-xs rounded-lg bg-rmared-600 px-8 py-4 text-center text-lg font-bold text-white shadow-lg shadow-rmared-600/25 transition hover:bg-rmared-500 active:scale-[0.98]">{t('home_btn')}</Link>
        <Link to="/pricing" className="inline-block w-full max-w-xs rounded-lg border border-zinc-700 px-8 py-3 text-center font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100">{t('home_pricing')}</Link>
        <Link to="/bmr" className="inline-block w-full max-w-xs rounded-lg border border-zinc-700 px-8 py-3 text-center font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100">{t('home_bmr')}</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: '🎯', title: t('home_feat1'), desc: t('home_feat1d') },
          { icon: '🧠', title: t('home_feat2'), desc: t('home_feat2d') },
          { icon: '📊', title: t('home_feat3'), desc: t('home_feat3d') },
        ].map((item) => (
          <div key={item.title} className="card-glow rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
            <div className="mb-2 text-3xl">{item.icon}</div>
            <h3 className="mb-1 font-bold text-zinc-100">{item.title}</h3>
            <p className="text-sm text-zinc-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <AdDisplay ads={ads} position="home_middle" />

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
        <p className="text-sm text-zinc-500">{t('home_tagline')}</p>
      </div>

      <div className="text-center text-xs text-zinc-600">
        {t('home_visitors')} <span className="font-bold text-zinc-400" dir="ltr">{visitors.toLocaleString()}</span>
      </div>
    </>
  )

  return (
    <div className="animate-fade-in space-y-8">
      <AdDisplay ads={ads} position="home_top" />

      <div className="mx-auto flex max-w-7xl gap-6">
        <div className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-24 space-y-3">
            <AdDisplay ads={ads} position="home_left" />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-8">
          {mainContent}
        </div>

        <div className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-24 space-y-3">
            <AdDisplay ads={ads} position="home_right" />
          </div>
        </div>
      </div>

      <AdDisplay ads={ads} position="home_bottom" />
    </div>
  )
}
