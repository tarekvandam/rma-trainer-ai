import { jsPDF } from 'jspdf'
import { useState } from 'react'
import { useLang } from '../lib/lang'

const PW = 2480, PH = 3508, M = 160, CW = PW - M * 2, PY = PH - M, CR = 28
const C = {
  bg: '#0a0a0f', card: '#14141f', cardBorder: '#2a2a3a',
  red: '#e63946', redD: '#b71c1c',
  text: '#ffffff', text2: '#b0b0b0', text3: '#777777', gold: '#ffd700',
}
const FONT = 'Tahoma, "Segoe UI", Arial, sans-serif'
const LVL = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' }
const GOL = { fat_loss: 'حرق دهون', muscle_gain: 'تضخيم', endurance: 'تحمل', strength: 'قوة', general: 'لياقة عامة' }
const TYP = { mma: 'MMA', boxing: 'ملاكمة', kickboxing: 'كيك بوكس', bjj: 'BJJ', muay_thai: 'مواي تاي', taekwondo: 'تاي كون دو', karate: 'كاراتيه', wrestling: 'مصارعة', general: 'لياقة عامة' }

export default function PdfExport({ form, result }) {
  const { t, lang } = useLang()
  const [loading, setLoading] = useState(false)
  const handleExport = async () => {
    setLoading(true)
    try {
      if (!result) { alert(t('err_required')); return }
      await renderPdf(form, result, t, lang)
    } catch (err) { console.error(err); alert(t('err_network')) }
    finally { setLoading(false) }
  }
  return (
    <button onClick={handleExport} disabled={loading}
      className="w-full cursor-pointer rounded-lg bg-rmared-600 px-6 py-3 font-bold text-white shadow-lg shadow-rmared-600/25 transition hover:bg-rmared-500 disabled:opacity-50">
      {loading ? t('wf_submit_loading') : '📄 ' + t('res_pdf')}
    </button>
  )
}

async function renderPdf(form, result, t, lang) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pages = []
  let cv = null, cx = null, y = M

  function np() {
    if (cv) pages.push(cv)
    cv = document.createElement('canvas'); cv.width = PW; cv.height = PH
    cx = cv.getContext('2d'); cx.textBaseline = 'top'
    cx.fillStyle = C.bg; cx.fillRect(0, 0, PW, PH); y = M
  }

  function eh(h) { if (y + h > PY) { np(); return true } return false }

  function sf(s, w = 'normal') { cx.font = `${w} ${s}px ${FONT}` }

  function wr(t, m) {
    if (cx.measureText(t).width <= m) return [t]
    const ws = t.split(' '), ls = []; let c = ''
    for (const w of ws) { const n = c ? c + ' ' + w : w; if (cx.measureText(n).width <= m) c = n; else { if (c) ls.push(c); c = w } }
    if (c) ls.push(c); return ls
  }

  function rr(x, y, w, h, r = CR) {
    cx.beginPath(); cx.moveTo(x + r, y); cx.lineTo(x + w - r, y)
    cx.quadraticCurveTo(x + w, y, x + w, y + r)
    cx.lineTo(x + w, y + h - r)
    cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    cx.lineTo(x + r, y + h)
    cx.quadraticCurveTo(x, y + h, x, y + h - r)
    cx.lineTo(x, y + r)
    cx.quadraticCurveTo(x, y, x + r, y); cx.closePath()
  }

  function dc(x, y, w, h) {
    rr(x, y, w, h); cx.fillStyle = C.card; cx.fill()
    cx.strokeStyle = C.cardBorder; cx.lineWidth = 1.5; cx.stroke()
  }

  function ab(y, h = 10) { cx.fillStyle = C.red; cx.fillRect(0, y, PW, h) }

  function dl(y, w = 400) {
    cx.strokeStyle = C.red; cx.lineWidth = 2
    cx.beginPath(); cx.moveTo(PW - M, y); cx.lineTo(PW - M - w, y); cx.stroke()
  }

  // ===================== COVER =====================
  function renderCover() {
    np()
    ab(0)

    y = 130
    sf(72, 'bold'); cx.textAlign = 'right'; cx.fillStyle = C.red
    cx.fillText('RMA TRAINER AI', PW - M, y)

    y += 100
    sf(36); cx.fillStyle = C.text2
    cx.fillText(t('pdf_title'), PW - M, y)

    y += 60; dl(y)

    const cw = (CW - 50) / 2, ch = 140, gap = 50
    const rows = [
      [
        { icon: '🥊', label: t('wf_name'), value: form?.name || '—' },
        { icon: '🎯', label: t('pdf_goal'), value: GOL[form?.goal] || form?.goal || '—' },
      ],
      [
        { icon: '📊', label: t('wf_level'), value: LVL[form?.level] || form?.level || '—' },
        { icon: '🥋', label: t('pdf_type'), value: TYP[form?.trainingType] || form?.trainingType || result?.trainingType || '—' },
      ],
      [
        { icon: '📅', label: t('dash_days'), value: new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') },
        { icon: '📋', label: t('pdf_split'), value: result?.split || `${form?.days || 3} ${t('days')}` },
      ],
    ]

    y += 80
    for (const row of rows) {
      for (let ci = 0; ci < 2; ci++) {
        const cx2 = PW - M - cw - ci * (cw + gap)
        dc(cx2, y, cw, ch)
        cx.fillStyle = C.red
        cx.fillRect(cx2 + cw - 6, y + 20, 6, ch - 40)

        sf(28); cx.textAlign = 'right'; cx.fillStyle = C.text3
        cx.fillText(row[ci].icon + '  ' + row[ci].label, cx2 + cw - 30, y + 20)

        sf(34, 'bold'); cx.fillStyle = C.text
        cx.fillText(row[ci].value, cx2 + cw - 30, y + 68)
      }
      y += ch + 25
    }

    y += 60; eh(120)
    sf(30); cx.textAlign = 'center'; cx.fillStyle = C.text3
    cx.fillText(lang === 'ar'
      ? '« القوة الحقيقية لا تأتي من الجسد بل من الإرادة التي لا تستسلم »'
      : '« True strength comes not from the body, but from an unyielding will »', PW / 2, y)
    cx.textAlign = 'right'
  }

  // ===================== WORKOUT DAYS =====================
  function renderWorkoutDays() {
    if (!result?.days?.length) return

    eh(60)
    ab(y); y += 20; eh(80)
    sf(44, 'bold'); cx.textAlign = 'right'; cx.fillStyle = C.text
    cx.fillText('⚡ ' + t('res_exercises'), PW - M, y)
    cx.fillStyle = C.red; cx.fillRect(PW - M, y + 8, 120, 4)
    y += 60

    for (let di = 0; di < result.days.length; di++) {
      const day = result.days[di]
      if (!day?.exercises?.length) continue
      const exs = day.exercises
      const cardioIdx = exs.findIndex(e => e.name?.includes('كارديو') || e.name?.includes('Cardio'))
      const normalExs = cardioIdx >= 0 ? exs.filter((_, i) => i !== cardioIdx) : exs
      const h = 100 + normalExs.length * 50 + (cardioIdx >= 0 ? 60 : 0)

      eh(h + 20)

      dc(M, y, CW, h)

      const cirX = PW - M - 70
      cx.beginPath(); cx.arc(cirX, y + 40, 28, 0, Math.PI * 2)
      cx.fillStyle = C.red; cx.fill()
      sf(28, 'bold'); cx.textAlign = 'center'; cx.fillStyle = C.text
      cx.fillText(String(di + 1), cirX, y + 32)
      cx.textAlign = 'right'

      sf(34, 'bold'); cx.fillStyle = C.text
      const dayLabel = t('res_day') + ' ' + (di + 1)
      cx.fillText(day.day || dayLabel, PW - M - 120, y + 22)
      sf(24); cx.fillStyle = C.text2
      cx.fillText('🎯 ' + (day.focus || ''), PW - M - 120, y + 60)

      let ey = y + 105
      const ew = CW - 60, ex2 = M + 30

      for (const ex of normalExs) {
        cx.fillStyle = di % 2 === 0 ? '#181828' : C.card
        cx.fillRect(ex2, ey, ew, 44)
        sf(26, 'bold'); cx.fillStyle = C.text; cx.textAlign = 'right'
        cx.fillText(ex.name, ex2 + ew - 20, ey + 8)
        const det = `${ex.sets || '-'} × ${ex.reps || '-'}  ⏱ ${ex.rest || '-'}`
        sf(22); cx.fillStyle = C.text2; cx.textAlign = 'left'
        cx.fillText(det, ex2 + 20, ey + 10)
        cx.textAlign = 'right'
        ey += 50
      }

      if (cardioIdx >= 0) {
        const cardio = exs[cardioIdx]
        cx.fillStyle = '#1a1020'
        cx.fillRect(ex2, ey, ew, 48)
        sf(26, 'bold'); cx.fillStyle = C.red; cx.textAlign = 'right'
        const cName = cardio.name.replace('🔥 كارديو:', t('res_cardio')).replace('🔥 Cardio:', t('res_cardio'))
        cx.fillText(cName, ex2 + ew - 20, ey + 10)
        if (cardio.durationMinutes) {
          sf(24); cx.fillStyle = '#ff6666'; cx.textAlign = 'left'
          cx.fillText(`⏱ ${cardio.durationMinutes} ${t('res_min')}`, ex2 + 20, ey + 12)
        }
        cx.textAlign = 'right'
        ey += 55
      }

      y = ey + 25
    }
  }

  // ===================== NUTRITION =====================
  function renderNutrition() {
    eh(60); ab(y); y += 20; eh(80)
    sf(44, 'bold'); cx.textAlign = 'right'; cx.fillStyle = C.text
    cx.fillText('🍎 ' + t('pdf_nutrition'), PW - M, y)
    cx.fillStyle = C.red; cx.fillRect(PW - M, y + 8, 120, 4)
    y += 60

    const cw = (CW - 60) / 3, ch = 150
    eh(ch + 20); const sy = y
    const items = [
      { icon: '🔥', label: t('pdf_bmr'), value: result?.bmr || '—' },
      { icon: '⚡', label: t('pdf_calories'), value: result?.dailyCalories || '—' },
      { icon: '💪', label: t('pdf_protein'), value: result?.protein || '—' },
    ]
    for (let i = 0; i < 3; i++) {
      const cx2 = PW - M - cw - i * (cw + 30)
      dc(cx2, sy, cw, ch)
      sf(50); cx.textAlign = 'center'; cx.fillText(items[i].icon, cx2 + cw / 2, sy + 18)
      cx.textAlign = 'right'
      sf(22); cx.fillStyle = C.text3
      cx.fillText(items[i].label, cx2 + cw - 20, sy + 80)
      sf(36, 'bold'); cx.fillStyle = C.red; cx.textAlign = 'center'
      cx.fillText(items[i].value, cx2 + cw / 2, sy + 110)
      cx.textAlign = 'right'
    }

    y = sy + ch + 50

    if (result?.nutrition) {
      eh(140); dc(M, y, CW, 130); sf(26); cx.fillStyle = C.text2
      const ls = wr(result.nutrition, CW - 60)
      let ny = y + 25
      for (const l of ls) {
        if (ny > y + 110) break
        cx.textAlign = 'right'; cx.fillText(l, PW - M - 30, ny)
        ny += 36
      }
      y += 140
    }

    if (result?.tips?.length) {
      eh(60); ab(y); y += 20; eh(80)
      sf(44, 'bold'); cx.textAlign = 'right'; cx.fillStyle = C.text
      cx.fillText('⭐ ' + t('pdf_tips'), PW - M, y)
      cx.fillStyle = C.red; cx.fillRect(PW - M, y + 8, 120, 4)
      y += 60

      for (const tip of result.tips) {
        const ls = wr(tip, CW - 100)
        eh(ls.length * 40 + 20)
        y += 8
        cx.beginPath(); cx.arc(PW - M - 20, y + 18, 8, 0, Math.PI * 2)
        cx.fillStyle = C.gold; cx.fill()
        sf(26); cx.fillStyle = C.text2; cx.textAlign = 'right'
        for (const l of ls) { cx.fillText(l, PW - M - 50, y); y += 38 }
        y += 10
      }
    }
  }

  // ===================== FOOTER =====================
  function renderFooter() {
    eh(260); y = PY - 200
    cx.strokeStyle = C.cardBorder; cx.lineWidth = 1
    cx.beginPath(); cx.moveTo(PW / 2 - 250, y); cx.lineTo(PW / 2 + 250, y); cx.stroke()
    y += 50
    sf(34, 'bold'); cx.textAlign = 'center'; cx.fillStyle = C.red
    cx.fillText('RMA TRAINER AI', PW / 2, y); y += 50
    sf(26); cx.fillStyle = C.text3
    cx.fillText('www.rma-trainer-ai.vercel.app', PW / 2, y); y += 60
    sf(28); cx.fillStyle = C.text2
    cx.fillText(lang === 'ar'
      ? '« النجاح ليس نهاية المطاف، بل هو الإصرار على الاستمرار رغم كل الصعاب »'
      : '« Success is not final, it is the determination to keep going despite all odds »', PW / 2, y)
    cx.textAlign = 'right'
  }

  // ===================== RENDER =====================
  renderCover()
  renderWorkoutDays()
  renderNutrition()
  renderFooter()
  if (cv) pages.push(cv)

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage()
    doc.addImage(pages[i].toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297)
  }
  doc.save('RMA_Trainer_Workout.pdf')
}
