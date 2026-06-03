import { getExercisePools, mergePools, tagExercises, generateDayTitle } from './exercise-db.js'
import { buildDayExercises, adjust } from './exercise-selector.js'
import { validateWorkout, printDebugReport } from './workout-validator.js'
import { calculateWorkoutScore } from './quality-control.js'
import { ensureWeeklyCoverage } from './day-templates.js'

const cardioOptionsAR = {
  mma: [
    { name: 'ظل قتال HIIT (3 جولات)', duration: 9 },
    { name: 'نط حبل + بوربيز', duration: 10 },
    { name: 'تمارين تمساح متقطع', duration: 10 },
    { name: 'سباقات قصر انفجارية', duration: 8 },
    { name: 'HIIT متقطع (4 دوائر)', duration: 10 },
    { name: 'قتال ظل انفجاري', duration: 9 },
  ],
  boxing: [
    { name: 'نط حبل', duration: 10 },
    { name: 'ظل ملاكمة (3 جولات)', duration: 9 },
    { name: 'حركات قدم سريعة', duration: 10 },
    { name: 'نط حبل متقطع', duration: 10 },
    { name: 'ضغط انفجاري + نط', duration: 10 },
    { name: 'ظل سرعة (4 جولات)', duration: 8 },
  ],
  kickboxing: [
    { name: 'ظل كيك بوكس (3 جولات)', duration: 9 },
    { name: 'نط حبل + ركلات', duration: 10 },
    { name: 'ركلات متعددة الاتجاهات', duration: 8 },
    { name: 'لكمات + ركلات مركبة', duration: 10 },
    { name: 'HIIT كيك بوكس', duration: 10 },
    { name: 'ظل قتال سريع', duration: 9 },
  ],
  bjj: [
    { name: 'تمارين أرضية زحف', duration: 10 },
    { name: 'جري', duration: 15 },
    { name: 'تمارين تمساح', duration: 10 },
    { name: 'قرفصاء انفجاري', duration: 10 },
    { name: 'HIIT أرضية (4 دوائر)', duration: 10 },
    { name: 'تحمل أرضي', duration: 15 },
  ],
  muay_thai: [
    { name: 'ظل مواي تاي (3 جولات)', duration: 9 },
    { name: 'ركلات متعددة الاتجاهات', duration: 5 },
    { name: 'نط حبل + ركلات', duration: 10 },
    { name: 'ظل ركلات سريع', duration: 8 },
    { name: 'تبديل رجلين سريع', duration: 10 },
    { name: 'ركلات مركبة + نط', duration: 10 },
  ],
  taekwondo: [
    { name: 'تمارين ركلات سريعة', duration: 10 },
    { name: 'ظل تاي كون دو (3 جولات)', duration: 8 },
    { name: 'نط حبل + ركلات عالية', duration: 10 },
    { name: 'حركات قدم انفجارية', duration: 8 },
    { name: 'تمارين مرونة + ركلات', duration: 10 },
    { name: 'قفز انفجاري + ركلات', duration: 8 },
  ],
  karate: [
    { name: 'ظل كاراتيه (3 جولات)', duration: 9 },
    { name: 'تمارين انفجارية', duration: 10 },
    { name: 'حركات أساسية متكررة', duration: 10 },
    { name: 'لكمات سريعة + حركات قدم', duration: 8 },
    { name: 'نط حبل', duration: 10 },
    { name: 'تمارين كاتا سريعة', duration: 9 },
  ],
  wrestling: [
    { name: 'سباقات انفجارية', duration: 5 },
    { name: 'جري', duration: 20 },
    { name: 'تمارين جسر وانفجار', duration: 10 },
    { name: 'تمارين تدحرج', duration: 10 },
    { name: 'انطلاقات سريعة', duration: 5 },
    { name: 'جري متقطع', duration: 15 },
  ],
}

const cardioOptionsEN = {
  mma: [
    { name: 'Shadow Fighting HIIT (3 rounds)', duration: 9 },
    { name: 'Jump Rope + Burpees', duration: 10 },
    { name: 'Interval Sprawls', duration: 10 },
    { name: 'Explosive Sprints', duration: 8 },
    { name: 'HIIT Intervals (4 circuits)', duration: 10 },
    { name: 'Explosive Shadow Fighting', duration: 9 },
  ],
  boxing: [
    { name: 'Jump Rope', duration: 10 },
    { name: 'Shadow Boxing (3 rounds)', duration: 9 },
    { name: 'Fast Footwork', duration: 10 },
    { name: 'Jump Rope Intervals', duration: 10 },
    { name: 'Explosive Push-ups + Jumps', duration: 10 },
    { name: 'Speed Shadow (4 rounds)', duration: 8 },
  ],
  kickboxing: [
    { name: 'Shadow Kickboxing (3 rounds)', duration: 9 },
    { name: 'Jump Rope + Kicks', duration: 10 },
    { name: 'Multi-directional Kicks', duration: 8 },
    { name: 'Punches + Kicks Combo', duration: 10 },
    { name: 'HIIT Kickboxing', duration: 10 },
    { name: 'Fast Shadow Fighting', duration: 9 },
  ],
  bjj: [
    { name: 'Ground Crawling Drills', duration: 10 },
    { name: 'Running', duration: 15 },
    { name: 'Sprawl Drills', duration: 10 },
    { name: 'Explosive Squats', duration: 10 },
    { name: 'Ground HIIT (4 circuits)', duration: 10 },
    { name: 'Ground Endurance', duration: 15 },
  ],
  muay_thai: [
    { name: 'Shadow Muay Thai (3 rounds)', duration: 9 },
    { name: 'Multi-directional Kicks', duration: 5 },
    { name: 'Jump Rope + Kicks', duration: 10 },
    { name: 'Fast Shadow Kicks', duration: 8 },
    { name: 'Fast Leg Switching', duration: 10 },
    { name: 'Combo Kicks + Jump Rope', duration: 10 },
  ],
  taekwondo: [
    { name: 'Fast Kicking Drills', duration: 10 },
    { name: 'Shadow Taekwondo (3 rounds)', duration: 8 },
    { name: 'Jump Rope + High Kicks', duration: 10 },
    { name: 'Explosive Footwork', duration: 8 },
    { name: 'Flexibility + Kicks', duration: 10 },
    { name: 'Explosive Jumps + Kicks', duration: 8 },
  ],
  karate: [
    { name: 'Shadow Karate (3 rounds)', duration: 9 },
    { name: 'Explosive Drills', duration: 10 },
    { name: 'Repetitive Basics', duration: 10 },
    { name: 'Fast Punches + Footwork', duration: 8 },
    { name: 'Jump Rope', duration: 10 },
    { name: 'Fast Kata Drills', duration: 9 },
  ],
  wrestling: [
    { name: 'Explosive Sprints', duration: 5 },
    { name: 'Running', duration: 20 },
    { name: 'Bridge + Explosion Drills', duration: 10 },
    { name: 'Rolling Drills', duration: 10 },
    { name: 'Quick Shots', duration: 5 },
    { name: 'Interval Running', duration: 15 },
  ],
}

const typeFocusAR = {
  mma: { d1: 'حركات انفجارية + قوة', d2: 'تحمل + كارديو', d3: 'قوة أساسية + قلب', d4: 'حركات MMA وظيفية', d5: 'قوة + كارديو', d6: 'تحمل عالي' },
  boxing: { d1: 'صدر + كتف + ترايسبس', d2: 'ظهر + بايسبس + قلب', d3: 'أرجل + كارديو', d4: 'كتف + ترايسبس + سرعة', d5: 'قوة كاملة', d6: 'كارديو + تحمل' },
  kickboxing: { d1: 'لكمات + ركلات أساسية', d2: 'أرجل + تحمل', d3: 'قوة انفجارية', d4: 'ركلات مركبة', d5: 'لكمات سرعة', d6: 'كارديو كيك بوكس' },
  bjj: { d1: 'سحب + قلب', d2: 'أرجل + تحمل', d3: 'قوة كاملة', d4: 'حركات أرضية', d5: 'سحب + أرجل', d6: 'كارديو + تحمل' },
  muay_thai: { d1: 'أرجل + كارديو', d2: 'دفع + كتف', d3: 'سحب + قلب', d4: 'كارديو + ركلات', d5: 'قوة كاملة', d6: 'تحمل عالي' },
  taekwondo: { d1: 'ركلات عالية + مرونة', d2: 'أرجل + انفجار', d3: 'قوة انفجارية', d4: 'ركلات سريعة', d5: 'تحمل + ركلات', d6: 'كارديو تاي كون دو' },
  karate: { d1: 'لكمات أساسية + وقفات', d2: 'كاتا + حركات', d3: 'قوة انفجارية', d4: 'ركلات + لكمات', d5: 'سرعة + دقة', d6: 'تحمل كاراتيه' },
  wrestling: { d1: 'قوة كاملة', d2: 'انفجار + أرجل', d3: 'سحب + قلب', d4: 'قوة + تحمل', d5: 'أرجل + كارديو', d6: 'كارديو عالي' },
  gym: { d1: 'دفع (صدر + كتف + ترايسبس)', d2: 'سحب (ظهر + بايسبس)', d3: 'أرجل (سكوات + ديدليفت)', d4: 'دفع + أكتاف', d5: 'سحب + أرجل', d6: 'تقسيمة كاملة' },
  general: { d1: 'دفع', d2: 'سحب', d3: 'أرجل', d4: 'أعلى جسم', d5: 'أسفل + قلب', d6: 'كارديو' },
}

const typeFocusEN = {
  mma: { d1: 'Explosive Movements + Strength', d2: 'Endurance + Cardio', d3: 'Core Strength + Abs', d4: 'Functional MMA Movements', d5: 'Strength + Cardio', d6: 'High Endurance' },
  boxing: { d1: 'Chest + Shoulders + Triceps', d2: 'Back + Biceps + Core', d3: 'Legs + Cardio', d4: 'Shoulders + Triceps + Speed', d5: 'Full Strength', d6: 'Cardio + Endurance' },
  kickboxing: { d1: 'Basic Punches + Kicks', d2: 'Legs + Endurance', d3: 'Explosive Strength', d4: 'Combo Kicks', d5: 'Speed Punches', d6: 'Kickboxing Cardio' },
  bjj: { d1: 'Pulling + Core', d2: 'Legs + Endurance', d3: 'Full Strength', d4: 'Ground Movements', d5: 'Pulling + Legs', d6: 'Cardio + Endurance' },
  muay_thai: { d1: 'Legs + Cardio', d2: 'Push + Shoulders', d3: 'Pull + Core', d4: 'Cardio + Kicks', d5: 'Full Strength', d6: 'High Endurance' },
  taekwondo: { d1: 'High Kicks + Flexibility', d2: 'Legs + Explosion', d3: 'Explosive Strength', d4: 'Fast Kicks', d5: 'Endurance + Kicks', d6: 'Taekwondo Cardio' },
  karate: { d1: 'Basic Punches + Stances', d2: 'Kata + Movements', d3: 'Explosive Strength', d4: 'Kicks + Punches', d5: 'Speed + Precision', d6: 'Karate Endurance' },
  wrestling: { d1: 'Full Strength', d2: 'Explosion + Legs', d3: 'Pull + Core', d4: 'Strength + Endurance', d5: 'Legs + Cardio', d6: 'High Cardio' },
  gym: { d1: 'Push (Chest + Shoulders + Triceps)', d2: 'Pull (Back + Biceps)', d3: 'Legs (Squats + Deadlifts)', d4: 'Push + Shoulders', d5: 'Pull + Legs', d6: 'Full Split' },
  general: { d1: 'Push', d2: 'Pull', d3: 'Legs', d4: 'Upper Body', d5: 'Lower Body + Core', d6: 'Cardio' },
}

const dayNamesAR = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس']
const dayNamesEN = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']

const nutriMapAR = {
  fat_loss: (bmr, protein, w) => `عجز ${Math.round(bmr * 0.25)} سعرة → ${Math.round(bmr * 1.2 - 500)} سعرة/يوم. بروتين ${protein}ج. كارب 100-150ج. دهون 40ج. خضار غير محدود. موية ${Math.round(w * 0.04)} لتر.`,
  muscle_gain: (bmr, protein, w) => `فائض ${Math.round(bmr * 0.15)} سعرة → ${Math.round(bmr * 1.55 + 300)} سعرة/يوم. بروتين ${protein}ج. كارب 300ج. دهون 60ج. 5-6 وجبات. موية ${Math.round(w * 0.04)} لتر.`,
  endurance: (bmr, protein, w) => `${Math.round(bmr * 1.55)} سعرة/يوم. بروتين ${protein}ج. كارب 300-400ج. دهون 50ج. موية 3.5 لتر.`,
  strength: (bmr, protein, w) => `${Math.round(bmr * 1.55 + 100)} سعرة/يوم. بروتين ${protein}ج. كارب 250-300ج. دهون 50-60ج.`,
  general: (bmr, protein, w) => `${Math.round(bmr * 1.4)} سعرة/يوم. بروتين ${protein}ج. توازن 40% كارب - 30% بروتين - 30% دهون. موية ${Math.round(w * 0.04)} لتر.`,
}

const nutriMapEN = {
  fat_loss: (bmr, protein, w) => `Deficit ${Math.round(bmr * 0.25)} cal → ${Math.round(bmr * 1.2 - 500)} cal/day. Protein ${protein}g. Carbs 100-150g. Fat 40g. Unlimited veggies. Water ${Math.round(w * 0.04)}L.`,
  muscle_gain: (bmr, protein, w) => `Surplus ${Math.round(bmr * 0.15)} cal → ${Math.round(bmr * 1.55 + 300)} cal/day. Protein ${protein}g. Carbs 300g. Fat 60g. 5-6 meals. Water ${Math.round(w * 0.04)}L.`,
  endurance: (bmr, protein, w) => `${Math.round(bmr * 1.55)} cal/day. Protein ${protein}g. Carbs 300-400g. Fat 50g. Water 3.5L.`,
  strength: (bmr, protein, w) => `${Math.round(bmr * 1.55 + 100)} cal/day. Protein ${protein}g. Carbs 250-300g. Fat 50-60g.`,
  general: (bmr, protein, w) => `${Math.round(bmr * 1.4)} cal/day. Protein ${protein}g. Balance 40% carbs - 30% protein - 30% fat. Water ${Math.round(w * 0.04)}L.`,
}

export function generateGymPlan(form) {
  const lang = form.lang || 'ar'
  const w = parseFloat(form.weight) || 70
  const h = parseFloat(form.height) || 170
  const a = parseInt(form.age) || 25
  const days = parseInt(form.days) || 3
  const goal = form.goal || 'general'
  const level = form.level || 'beginner'
  const equipRaw = form.equipment || []
  const equipList = Array.isArray(equipRaw) ? equipRaw : equipRaw ? [equipRaw] : []
  const trainingType = form.trainingType || 'general'

  const bmr = Math.round(10 * w + 6.25 * h - 5 * a + 5)
  const protein = Math.round(w * ({ fat_loss: 2.0, muscle_gain: 2.2, endurance: 1.6, strength: 2.0, general: 1.5 }[goal] || 1.5))

  // Get exercise pools
  const pools = getExercisePools(lang)
  let pool = mergePools(pools, equipList)
  tagExercises(pool)

  // Day focuses
  const typeFocus = lang === 'en' ? typeFocusEN : typeFocusAR
  let focus = typeFocus[trainingType] || typeFocus.general

  // 5-Day gym intermediate+: PPL + Upper/Lower
  if (trainingType === 'gym' && days === 5 && (level === 'intermediate' || level === 'advanced')) {
    focus = lang === 'en'
      ? { d1: 'Push (Chest + Shoulders + Triceps)', d2: 'Pull (Back + Biceps)', d3: 'Legs (Squats + Deadlifts)', d4: 'Upper Body', d5: 'Lower Body + Core' }
      : { d1: 'دفع (صدر + كتف + ترايسبس)', d2: 'سحب (ظهر + بايسبس)', d3: 'أرجل (سكوات + ديدليفت)', d4: 'أعلى جسم', d5: 'أسفل جسم + قلب' }
  }

  // Cardio
  const generalCardioAR = goal === 'fat_loss' ? [
    { name: 'مشي سريع', duration: 20 },
    { name: 'HIIT دائري', duration: 15 },
    { name: 'نط حبل', duration: 10 },
    { name: 'جري', duration: 15 },
    { name: 'ركوب دراجة', duration: 15 },
    { name: 'كارديو دائري', duration: 15 },
  ] : goal === 'endurance' ? [
    { name: 'جري', duration: 20 },
    { name: 'نط حبل', duration: 12 },
    { name: 'تمارين هوائية شاملة', duration: 15 },
    { name: 'جري متقطع', duration: 15 },
    { name: 'HIIT خفيف', duration: 12 },
    { name: 'كارديو مطول', duration: 20 },
  ] : [
    { name: 'مشي إحماء', duration: 10 },
    { name: 'تمارين هوائية خفيفة', duration: 10 },
    { name: 'نط حبل', duration: 8 },
    { name: 'جري خفيف', duration: 10 },
    { name: 'حركات إحماء', duration: 10 },
    { name: 'كارديو عام', duration: 10 },
  ]

  const generalCardioEN = goal === 'fat_loss' ? [
    { name: 'Brisk Walking', duration: 20 },
    { name: 'HIIT Circuit', duration: 15 },
    { name: 'Jump Rope', duration: 10 },
    { name: 'Running', duration: 15 },
    { name: 'Cycling', duration: 15 },
    { name: 'Cardio Circuit', duration: 15 },
  ] : goal === 'endurance' ? [
    { name: 'Running', duration: 20 },
    { name: 'Jump Rope', duration: 12 },
    { name: 'Comprehensive Aerobics', duration: 15 },
    { name: 'Interval Running', duration: 15 },
    { name: 'Light HIIT', duration: 12 },
    { name: 'Extended Cardio', duration: 20 },
  ] : [
    { name: 'Warm-up Walk', duration: 10 },
    { name: 'Light Aerobics', duration: 10 },
    { name: 'Jump Rope', duration: 8 },
    { name: 'Light Jog', duration: 10 },
    { name: 'Warm-up Moves', duration: 10 },
    { name: 'General Cardio', duration: 10 },
  ]

  const cardioOptions = {
    ...(lang === 'en' ? cardioOptionsEN : cardioOptionsAR),
    general: lang === 'en' ? generalCardioEN : generalCardioAR,
  }

  const dailyCardio = (dayIndex) => {
    const opts = cardioOptions[trainingType] || cardioOptions.general
    return opts[dayIndex % opts.length]
  }

  const dayNames = lang === 'en' ? dayNamesEN : dayNamesAR
  const nutriMap = lang === 'en' ? nutriMapEN : nutriMapAR

  // Retry loop
  const MAX_ATTEMPTS = 8
  let dayData = []
  let report = null
  let qcResult = null
  let attempts = 0
  const globalUsedNames = new Set()

  do {
    attempts++
    globalUsedNames.clear()
    dayData = []

    for (let i = 0; i < days; i++) {
      const focusText = focus['d' + (i + 1)] || (lang === 'en' ? 'Balanced exercises' : 'تمارين متوازنة')
      const exs = buildDayExercises(i, pool, focusText, trainingType, goal, lang, globalUsedNames)
      const cardio = dailyCardio(i)
      exs.push({
        name: `🔥 ${lang === 'en' ? 'Cardio' : 'كارديو'}: ${cardio.name}`,
        durationMinutes: cardio.duration,
        sets: '-', reps: '-', rest: '-',
      })
      dayData.push({
        day: lang === 'en' ? `Day ${dayNames[i + 1]} — ${focusText}` : `اليوم ${dayNames[i + 1]} — ${focusText}`,
        focus: focusText,
        exercises: exs,
      })
    }

    // Ensure minimum weekly coverage for ABS (>=2) and CALVES (>=2)
    ensureWeeklyCoverage(dayData, pool, (ex) => adjust(ex, goal), globalUsedNames)

    // Regenerate day titles from actual exercises
    dayData.forEach((dd, i) => {
      const forcedTitle = focus['d' + (i + 1)] || null
      const title = generateDayTitle(dd, lang, forcedTitle)
      const prefix = lang === 'en' ? `Day ${dayNames[i + 1]} — ` : `اليوم ${dayNames[i + 1]} — `
      dd.day = prefix + title
      dd.focus = title
    })

    if (trainingType === 'gym') {
      // Run existing validation (movement pattern checks)
      report = validateWorkout(dayData)
      if (attempts === 1 || !report.allPassed) {
        printDebugReport(report, attempts, MAX_ATTEMPTS)
      }
      // Run Quality Control engine
      qcResult = calculateWorkoutScore({ days: dayData, equipmentList: equipList })
    } else {
      report = { allPassed: true }
      qcResult = { total: 100, verdict: 'PASS' }
    }
  } while ((!report.allPassed || (qcResult && qcResult.verdict === 'REGENERATE')) && attempts < MAX_ATTEMPTS)

  // Strip metadata before returning to user
  dayData.forEach(dd => {
    dd.exercises.forEach(e => {
      delete e.cat
      delete e.type
      delete e.mov
      delete e.primaryMuscles
      delete e.secondaryMuscles
      delete e.movementPattern
    })
  })

  const split = lang === 'en'
    ? (days <= 3 ? `Full Body — ${days}-Day Full Body` :
       days === 4 ? 'Upper / Lower Split — Upper Day + Lower Day' :
       'Push / Pull / Legs Rotation')
    : (days <= 3 ? `Full Body — ${days} أيام كامل للجسم` :
       days === 4 ? 'Upper / Lower Split — يوم أعلى + يوم أسفل' :
       'Push / Pull / Legs مكرر')

  const tips = lang === 'en'
    ? [
        'Warm up 10 min before every session — dynamic movements, not static',
        'Form over weight — one bad rep can ruin months of progress',
        'Sleep 7-9 hours is not a luxury — it is an essential part of training',
        `Drink ${Math.round(w * 0.04)}L of water daily — weight × 0.04`,
        'Track your progress every week — no tracking, no real progress',
        goal === 'fat_loss' ? 'Losing 0.5-1 kg per week is realistic and healthy. Not 5 kg in a week.' :
        goal === 'muscle_gain' ? 'Muscle takes time — 0.5-1 kg per month is excellent progress.' :
        'Consistency beats intensity — a weak workout is better than none',
      ]
    : [
        'الإحماء 10 د قبل كل تمرين — حركات ديناميكية مش ثابتة',
        'الفورم قبل الوزن — إصابة اليوم تدمر شهور من التقدم',
        'النوم 7-9 ساعات مش رفاهية — هو جزء أساسي من التدريب',
        `اشرب ${Math.round(w * 0.04)} لتر مية يومياً — الوزن × 0.04`,
        'سجل تقدمك كل أسبوع — بدون تسجيل مفيش تطور حقيقي',
        goal === 'fat_loss' ? 'خسارة 0.5-1 كجم أسبوعياً واقعي وصحي. مش 5 كجم في أسبوع.' :
        goal === 'muscle_gain' ? 'العضلة بتاخد وقت — 0.5-1 كجم شهرياً تقدم ممتاز.' :
        'الاستمرارية أهم من الشدة — تمرين ضعيف أحسن من عدمه',
      ]

  const dailyCalories = Math.round(bmr * ({ fat_loss: 1.2, muscle_gain: 1.55, endurance: 1.55, strength: 1.55, general: 1.4 }[goal] || 1.4)) - (goal === 'fat_loss' ? 500 : goal === 'muscle_gain' ? 300 : 0) + (goal === 'muscle_gain' ? 300 : goal === 'strength' ? 100 : 0)

  if (qcResult && qcResult.verdict === 'FAIL') {
    console.error('QC ENGINE: Plan FAILED (score < 80) after max attempts.')
  }

  const result = {
    split,
    days: dayData,
    nutrition: nutriMap[goal](bmr, protein, w),
    bmr: lang === 'en' ? `${bmr} cal/day` : `${bmr} سعرة/يوم`,
    dailyCalories: lang === 'en' ? `${dailyCalories} cal/day` : `${dailyCalories} سعرة/يوم`,
    protein: lang === 'en' ? `${protein} g/day` : `${protein} جرام/يوم`,
    trainingType: lang === 'en'
      ? ({ mma: 'MMA', boxing: 'Boxing', kickboxing: 'Kickboxing', bjj: 'Jiu-Jitsu', muay_thai: 'Muay Thai', taekwondo: 'Taekwondo', karate: 'Karate', wrestling: 'Wrestling', gym: 'Gym (Full Equipment)', general: 'General Fitness' }[trainingType] || 'General Fitness')
      : ({ mma: 'MMA', boxing: 'ملاكمة', kickboxing: 'كيك بوكس', bjj: 'جيوجيتسو', muay_thai: 'مواي تاي', taekwondo: 'تاي كون دو', karate: 'كاراتيه', wrestling: 'مصارعة', gym: 'جيم (معدات كاملة)', general: 'لياقة عامة' }[trainingType] || 'لياقة عامة'),
    tips,
    _qc: qcResult,
  }
  return result
}
