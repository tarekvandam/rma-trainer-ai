import { useRef, useState } from 'react'
import { useLang } from '../lib/lang'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export default function PdfExport({ form, result }) {
  const { t, lang } = useLang()
  const iframeRef = useRef(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const isCapacitor = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()

  const buildHtml = (showPrintBtn) => {
    const LVL = { beginner: lang === 'ar' ? 'مبتدئ' : 'Beginner', intermediate: lang === 'ar' ? 'متوسط' : 'Intermediate', advanced: lang === 'ar' ? 'متقدم' : 'Advanced' }
    const GOL = { fat_loss: lang === 'ar' ? 'حرق دهون' : 'Fat Loss', muscle_gain: lang === 'ar' ? 'تضخيم' : 'Muscle Gain', endurance: lang === 'ar' ? 'تحمل' : 'Endurance', strength: lang === 'ar' ? 'قوة' : 'Strength', general: lang === 'ar' ? 'لياقة عامة' : 'General Fitness' }
    const TYP = { mma: 'MMA', boxing: lang === 'ar' ? 'ملاكمة' : 'Boxing', kickboxing: lang === 'ar' ? 'كيك بوكس' : 'Kickboxing', bjj: 'BJJ', muay_thai: lang === 'ar' ? 'مواي تاي' : 'Muay Thai', taekwondo: lang === 'ar' ? 'تاي كون دو' : 'Taekwondo', karate: lang === 'ar' ? 'كاراتيه' : 'Karate', wrestling: lang === 'ar' ? 'مصارعة' : 'Wrestling', general: lang === 'ar' ? 'لياقة عامة' : 'General Fitness' }
    const dir = lang === 'ar' ? 'rtl' : 'ltr'
    const align = lang === 'ar' ? 'right' : 'left'
    const daysHtml = (result?.days || []).map((day, di) => {
      const exs = day.exercises || []
      const cardioIdx = exs.findIndex(e => e.name?.includes('كارديو') || e.name?.includes('Cardio'))
      const normalExs = cardioIdx >= 0 ? exs.filter((_, i) => i !== cardioIdx) : exs
      const cardio = cardioIdx >= 0 ? exs[cardioIdx] : null
      return `<div class="day-card">
        <div class="day-header"><div class="day-num">${di + 1}</div><div class="day-name">${day.day || (t('res_day') + ' ' + (di + 1))}</div></div>
        <div class="day-focus">🎯 ${day.focus || ''}</div>
        ${normalExs.map(ex => `<div class="ex-row"><span class="ex-name">${ex.name}</span><span class="ex-detail">${ex.sets || '-'} × ${ex.reps || '-'} ⏱ ${ex.rest || '-'}</span></div>`).join('')}
        ${cardio ? `<div class="cardio"><div class="ex-row"><span class="ex-name">${cardio.name}</span><span class="ex-detail">${cardio.durationMinutes ? `⏱ ${cardio.durationMinutes} ${t('res_min')}` : ''}</span></div></div>` : ''}
      </div>`
    }).join('')
    const printBtn = showPrintBtn ? `<div class="no-print" style="text-align:center;margin-bottom:20px;display:flex;flex-direction:column;gap:10px;align-items:center">
      <button onclick="window.print()" style="padding:12px 24px;background:#e63946;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer">🖨️ ${lang === 'ar' ? 'حفظ كـ PDF' : 'Save as PDF'}</button>
      <p style="margin-top:4px;color:#888;font-size:12px">${lang === 'ar' ? 'اضغط الزر، ثم اختر "حفظ كـ PDF"' : 'Press the button, then choose "Save as PDF"'}</p>
    </div>` : ''
    return `<!DOCTYPE html><html dir="${dir}" lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t('pdf_title')}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Tahoma,'Segoe UI',Arial,sans-serif;background:#fff;color:#000;padding:20px;text-align:${align};direction:${dir}}
      h1{text-align:center;color:#e63946;font-size:28px;margin:20px 0}
      .info{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0}
      .info-item{background:#f5f5f5;border:1px solid #ddd;border-radius:12px;padding:20px}
      .info-item .label{color:#666;font-size:13px}
      .info-item .value{color:#000;font-size:20px;font-weight:bold;margin-top:4px}
      .section-title{color:#e63946;font-size:22px;font-weight:bold;margin:30px 0 10px;padding-bottom:8px;border-bottom:3px solid #e63946}
      .day-card{background:#fafafa;border:1px solid #ddd;border-radius:12px;padding:20px;margin:15px 0}
      .day-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
      .day-num{background:#e63946;color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold}
      .day-name{font-size:18px;font-weight:bold;color:#000}
      .day-focus{color:#555;font-size:14px;margin-bottom:12px}
      .ex-row{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:6px;margin:3px 0;font-size:14px}
      .ex-row:nth-child(odd){background:#f0f0f0}
      .ex-name{color:#000;font-weight:bold}
      .ex-detail{color:#555}
      .cardio{background:#fff0f0;border:1px solid #e63946;border-radius:6px;padding:10px 12px;margin:8px 0}
      .cardio .ex-name{color:#e63946}
      .nutrition-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:15px 0}
      .nutri-item{background:#f5f5f5;border:1px solid #ddd;border-radius:12px;padding:20px;text-align:center}
      .nutri-icon{font-size:36px}
      .nutri-label{color:#666;font-size:13px;margin-top:8px}
      .nutri-value{color:#e63946;font-size:24px;font-weight:bold;margin-top:4px}
      .nutrition-text{background:#f5f5f5;border:1px solid #ddd;border-radius:12px;padding:20px;margin:15px 0;color:#333;font-size:14px;line-height:1.8}
      .tip-item{display:flex;gap:10px;padding:8px 0;font-size:14px;color:#555}
      .tip-icon{color:#e63946;font-size:18px}
      .footer{text-align:center;margin-top:30px;padding:30px;border-top:1px solid #ddd}
      .footer h2{color:#e63946;margin-bottom:10px}
      .footer p{color:#888;font-size:12px}
      @media print{body{background:#fff!important;color:#000!important}.no-print{display:none!important}}
    </style></head><body>
    ${printBtn}
    <h1>⚔ ${t('pdf_title')}</h1>
    <div class="info">
      <div class="info-item"><div class="label">${t('wf_name')}</div><div class="value">${form?.name || '—'}</div></div>
      <div class="info-item"><div class="label">${t('pdf_goal')}</div><div class="value">${GOL[form?.goal] || form?.goal || '—'}</div></div>
      <div class="info-item"><div class="label">${t('wf_level')}</div><div class="value">${LVL[form?.level] || form?.level || '—'}</div></div>
      <div class="info-item"><div class="label">${t('pdf_type')}</div><div class="value">${TYP[form?.trainingType] || form?.trainingType || result?.trainingType || '—'}</div></div>
      <div class="info-item"><div class="label">${t('pdf_split')}</div><div class="value">${result?.split || `${form?.days || 3} ${t('days')}`}</div></div>
      <div class="info-item"><div class="label">${t('pdf_nutrition')}</div><div class="value">${result?.dailyCalories || '—'}</div></div>
    </div>
    ${daysHtml}
    <div class="section-title">🍎 ${t('pdf_nutrition')}</div>
    <div class="nutrition-grid">
      <div class="nutri-item"><div class="nutri-icon">🔥</div><div class="nutri-label">${t('pdf_bmr')}</div><div class="nutri-value">${result?.bmr || '—'}</div></div>
      <div class="nutri-item"><div class="nutri-icon">⚡</div><div class="nutri-label">${t('pdf_calories')}</div><div class="nutri-value">${result?.dailyCalories || '—'}</div></div>
      <div class="nutri-item"><div class="nutri-icon">💪</div><div class="nutri-label">${t('pdf_protein')}</div><div class="nutri-value">${result?.protein || '—'}</div></div>
    </div>
    ${result?.nutrition ? `<div class="nutrition-text">${result.nutrition}</div>` : ''}
    ${result?.tips?.length ? `<div class="section-title">⭐ ${t('pdf_tips')}</div>${result.tips.map(t => `<div class="tip-item"><span class="tip-icon">✦</span><span>${t}</span></div>`).join('')}` : ''}
    <div class="footer">
      <h2>RMA TRAINER AI</h2>
      <p>${t('pdf_generated')} &middot; rma-trainer-ai.vercel.app</p>
    </div>
  </body></html>`
  }

  const handleDownload = () => {
    setShowOverlay(true)
  }

  const handlePrint = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    const html = buildHtml(true)
    const doc = iframe.contentDocument || iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()
    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print() }, 500)
  }

  const handleExport = () => {
    if (!result) return
    if (isCapacitor) { handleDownload(); return }
    handlePrint()
  }

  const handleSave = async () => {
    try {
      const html = buildHtml(false)
      await Filesystem.writeFile({
        path: 'RMA_Trainer_Plan.html',
        data: html,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      })
      const uriResult = await Filesystem.getUri({
        path: 'RMA_Trainer_Plan.html',
        directory: Directory.Cache,
      })
      await Share.share({
        title: 'RMA Trainer Plan',
        files: [uriResult.uri],
      })
    } catch (e) {
      alert(lang === 'ar' ? 'فشل الحفظ: ' + e.message : 'Save failed: ' + e.message)
    }
  }

  const handleCopy = async () => {
    const text = document.getElementById('plan-text-content')?.innerText
    if (text) {
      try { await navigator.clipboard.writeText(text); alert(lang === 'ar' ? 'تم النسخ' : 'Copied!') }
      catch { prompt(lang === 'ar' ? 'انسخ النص' : 'Copy:', text) }
    }
  }

  const LVL = { beginner: lang === 'ar' ? 'مبتدئ' : 'Beginner', intermediate: lang === 'ar' ? 'متوسط' : 'Intermediate', advanced: lang === 'ar' ? 'متقدم' : 'Advanced' }
  const GOL = { fat_loss: lang === 'ar' ? 'حرق دهون' : 'Fat Loss', muscle_gain: lang === 'ar' ? 'تضخيم' : 'Muscle Gain', endurance: lang === 'ar' ? 'تحمل' : 'Endurance', strength: lang === 'ar' ? 'قوة' : 'Strength', general: lang === 'ar' ? 'لياقة عامة' : 'General Fitness' }
  const TYP = { mma: 'MMA', boxing: lang === 'ar' ? 'ملاكمة' : 'Boxing', kickboxing: lang === 'ar' ? 'كيك بوكس' : 'Kickboxing', bjj: 'BJJ', muay_thai: lang === 'ar' ? 'مواي تاي' : 'Muay Thai', taekwondo: lang === 'ar' ? 'تاي كون دو' : 'Taekwondo', karate: lang === 'ar' ? 'كاراتيه' : 'Karate', wrestling: lang === 'ar' ? 'مصارعة' : 'Wrestling', general: lang === 'ar' ? 'لياقة عامة' : 'General Fitness' }

  return (
    <>
      {!isCapacitor && <iframe ref={iframeRef} style={{ position: 'fixed', left: '-9999px', width: 0, height: 0 }} title="pdf-print" />}
      <button onClick={handleExport}
        className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white shadow-lg shadow-rmared-600/25 transition hover:bg-rmared-500">
        📄 {t('res_pdf')}
      </button>
      {isCapacitor && showOverlay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#fff', overflow: 'auto', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '2px solid #e63946', padding: '12px 16px', display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={handleSave} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
              💾 {lang === 'ar' ? 'حفظ' : 'Save'}
            </button>
            <button onClick={handleCopy} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
              📋 {lang === 'ar' ? 'نسخ' : 'Copy'}
            </button>
            <button onClick={() => { setShowOverlay(false) }} style={{ padding: '10px 20px', background: '#666', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              ✕ {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
          <div id="plan-text-content" style={{ padding: 16, fontFamily: 'Tahoma, sans-serif', color: '#000', fontSize: 14, lineHeight: 1.6 }}>
            <h1 style={{ textAlign: 'center', color: '#e63946', fontSize: 24, margin: '20px 0' }}>⚔ {t('pdf_title')}</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0' }}>
              {[
                { label: t('wf_name'), value: form?.name || '—' },
                { label: t('pdf_goal'), value: GOL[form?.goal] || form?.goal || '—' },
                { label: t('wf_level'), value: LVL[form?.level] || form?.level || '—' },
                { label: t('pdf_type'), value: TYP[form?.trainingType] || form?.trainingType || result?.trainingType || '—' },
                { label: t('pdf_split'), value: result?.split || `${form?.days || 3} ${t('days')}` },
                { label: t('pdf_nutrition'), value: result?.dailyCalories || '—' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
                  <div style={{ color: '#666', fontSize: 12 }}>{item.label}</div>
                  <div style={{ color: '#000', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>{item.value}</div>
                </div>
              ))}
            </div>
            {(result?.days || []).map((day, di) => {
              const exs = day.exercises || []
              const cardioIdx = exs.findIndex(e => e.name?.includes('كارديو') || e.name?.includes('Cardio'))
              const normalExs = cardioIdx >= 0 ? exs.filter((_, i) => i !== cardioIdx) : exs
              const cardio = cardioIdx >= 0 ? exs[cardioIdx] : null
              return (
                <div key={di} style={{ background: '#fafafa', border: '1px solid #ddd', borderRadius: 12, padding: 16, margin: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ background: '#e63946', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold' }}>{di + 1}</span>
                    <span style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>{day.day || `${t('res_day')} ${di + 1}`}</span>
                  </div>
                  {day.focus && <div style={{ color: '#555', fontSize: 13, marginBottom: 12 }}>🎯 {day.focus}</div>}
                  {normalExs.map((ex, ei) => (
                    <div key={ei} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6, margin: '3px 0', backgroundColor: ei % 2 === 0 ? '#f0f0f0' : 'transparent', fontSize: 13 }}>
                      <span style={{ fontWeight: 'bold', color: '#000' }}>{ex.name}</span>
                      <span style={{ color: '#555' }}>{ex.sets || '-'} × {ex.reps || '-'} ⏱ {ex.rest || '-'}</span>
                    </div>
                  ))}
                  {cardio && (
                    <div style={{ background: '#fff0f0', border: '1px solid #e63946', borderRadius: 6, padding: '8px 12px', margin: '8px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ fontWeight: 'bold', color: '#e63946' }}>{cardio.name}</span>
                        <span style={{ color: '#555' }}>{cardio.durationMinutes ? `⏱ ${cardio.durationMinutes} ${t('res_min')}` : ''}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {result?.nutrition && (
              <div style={{ background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 12, padding: 16, margin: '12px 0', color: '#333', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result.nutrition}</div>
            )}
            {result?.tips?.length > 0 && (
              <div style={{ margin: '12px 0' }}>
                <div style={{ color: '#e63946', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>⭐ {t('pdf_tips')}</div>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', fontSize: 13, color: '#555' }}>
                    <span style={{ color: '#e63946' }}>✦</span><span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 24, padding: 20, borderTop: '1px solid #ddd' }}>
              <div style={{ color: '#e63946', fontWeight: 'bold', fontSize: 18 }}>RMA TRAINER AI</div>
              <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{t('pdf_generated')}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}