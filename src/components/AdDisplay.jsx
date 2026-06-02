import { useLang } from '../lib/lang'

export default function AdDisplay({ ads, position }) {
  const { t } = useLang()
  const filtered = ads.filter(a => a.active !== false && a.position === position)
  if (filtered.length === 0) return null
  return (
    <div className="space-y-3">
      {filtered.map((ad, i) => {
        const style = {}
        if (ad.width) style.maxWidth = ad.width
        if (ad.height) style.maxHeight = ad.height
        return (
        <div key={ad.name || i} className="relative rounded-lg border border-zinc-800 bg-zinc-900/30 p-3" style={style}>
          <span className="mb-1 block text-center text-[10px] uppercase tracking-widest text-zinc-600">{t('ads_label')}</span>
          {ad.type === 'video' && ad.videoUrl ? (
            <div className="w-full overflow-hidden rounded" style={{ aspectRatio: ad.width && ad.height ? `${parseInt(ad.width)}/${parseInt(ad.height)}` : '16/9' }}>
              <iframe src={ad.videoUrl} className="h-full w-full" allowFullScreen title={ad.name} style={{ height: ad.height || 'auto' }} />
            </div>
          ) : ad.imageUrl ? (
            <a href={ad.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block">
              <img src={ad.imageUrl} alt={ad.name} className="mx-auto w-auto object-contain" style={{ maxHeight: ad.height || '96px', maxWidth: '100%' }} />
            </a>
          ) : ad.linkUrl ? (
            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-rmared-500 underline">
              {ad.name || t('ads_unnamed')}
            </a>
          ) : (
            <p className="text-center text-xs text-zinc-500">{ad.name || t('ads_unnamed')}</p>
          )}
        </div>
      )})}
    </div>
  )
}