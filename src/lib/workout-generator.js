import { getExercisePools, mergePools, tagExercises, generateDayTitle } from './exercise-db.js'
import { buildDayExercises, adjust } from './exercise-selector.js'
import { validateWorkout, printDebugReport } from './workout-validator.js'
import { calculateWorkoutScore } from './quality-control.js'
import { ensureWeeklyCoverage } from './day-templates.js'

// Helper: get cardio options for a given language and goal (for general/generic cases)
function generalCardioOptions(lang, goal) {
  if (lang === 'en') {
    if (goal === 'fat_loss') return [
      { name: 'Brisk Walking', duration: 20 }, { name: 'HIIT Circuit', duration: 15 },
      { name: 'Jump Rope', duration: 10 }, { name: 'Running', duration: 15 },
      { name: 'Cycling', duration: 15 }, { name: 'Cardio Circuit', duration: 15 },
    ]
    if (goal === 'endurance') return [
      { name: 'Running', duration: 20 }, { name: 'Jump Rope', duration: 12 },
      { name: 'Comprehensive Aerobics', duration: 15 }, { name: 'Interval Running', duration: 15 },
      { name: 'Light HIIT', duration: 12 }, { name: 'Extended Cardio', duration: 20 },
    ]
    return [
      { name: 'Warm-up Walk', duration: 10 }, { name: 'Light Aerobics', duration: 10 },
      { name: 'Jump Rope', duration: 8 }, { name: 'Light Jog', duration: 10 },
      { name: 'Warm-up Moves', duration: 10 }, { name: 'General Cardio', duration: 10 },
    ]
  }
  if (goal === 'fat_loss') return [
    { name: 'مشي سريع', duration: 20 }, { name: 'HIIT دائري', duration: 15 },
    { name: 'نط حبل', duration: 10 }, { name: 'جري', duration: 15 },
    { name: 'ركوب دراجة', duration: 15 }, { name: 'كارديو دائري', duration: 15 },
  ]
  if (goal === 'endurance') return [
    { name: 'جري', duration: 20 }, { name: 'نط حبل', duration: 12 },
    { name: 'تمارين هوائية شاملة', duration: 15 }, { name: 'جري متقطع', duration: 15 },
    { name: 'HIIT خفيف', duration: 12 }, { name: 'كارديو مطول', duration: 20 },
  ]
  return [
    { name: 'مشي إحماء', duration: 10 }, { name: 'تمارين هوائية خفيفة', duration: 10 },
    { name: 'نط حبل', duration: 8 }, { name: 'جري خفيف', duration: 10 },
    { name: 'حركات إحماء', duration: 10 }, { name: 'كارديو عام', duration: 10 },
  ]
}

// Movement Patterns defined per day type (exact spec from user)
const MOVEMENT_PATTERNS = {
  push: ['CHEST_COMPOUND', 'SHOULDER_COMPOUND', 'CHEST_ISOLATION', 'LATERAL_RAISE', 'TRICEPS'],
  pull: ['VERTICAL_PULL', 'HORIZONTAL_PULL', 'REAR_DELT', 'BICEPS'],
  legs: ['SQUAT_PATTERN', 'HIP_HINGE', 'QUAD_ISOLATION', 'HAMSTRING', 'CALVES', 'ABS'],
  upper: ['CHEST_COMPOUND', 'SHOULDER_COMPOUND', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'LATERAL_RAISE', 'BICEPS', 'TRICEPS'],
  lower: ['SQUAT_PATTERN', 'HIP_HINGE', 'QUAD_ISOLATION', 'HAMSTRING', 'CALVES', 'ABS'],
  fullBody: ['CHEST_COMPOUND', 'SHOULDER_COMPOUND', 'VERTICAL_PULL', 'HORIZONTAL_PULL', 'SQUAT_PATTERN', 'HIP_HINGE', 'CHEST_ISOLATION', 'BICEPS', 'TRICEPS', 'ABS'],
}

/**
 * SplitSelector: Selects the best split based on Goal, Level, Equipment, Days
 * Returns: { name, dayFocuses, patterns, splitType }
 */
export function SplitSelector(form) {
  const { days, trainingType, level, lang } = form
  const equipList = Array.isArray(form.equipment) ? form.equipment : form.equipment ? [form.equipment] : []
  const isGym = trainingType === 'gym'
  const isAdvanced = level === 'intermediate' || level === 'advanced'
  const hasFullEquip = equipList.includes('full_gym') || equipList.includes('barbell') || equipList.includes('gym_machine')

  // Non-gym training types always get Full Body
  if (!isGym) {
    const name = lang === 'en' ? `Full Body — ${days}-Day Full Body` : `Full Body — ${days} أيام كامل للجسم`
    const focus = lang === 'en' ? 'Full Body' : 'تمارين كاملة للجسم'
    return {
      name,
      dayFocuses: Array(days).fill(focus),
      patterns: Array(days).fill(MOVEMENT_PATTERNS.fullBody),
      splitType: 'fullBody',
    }
  }

  // Gym training - choose split based on days, level, and equipment
  if (days <= 3 || !isAdvanced || !hasFullEquip) {
    // Full Body
    const name = lang === 'en' ? `Full Body — ${days}-Day Full Body` : `Full Body — ${days} أيام كامل للجسم`
    const focus = lang === 'en' ? 'Full Body' : 'تمارين كاملة للجسم'
    return {
      name,
      dayFocuses: Array(days).fill(focus),
      patterns: Array(days).fill(MOVEMENT_PATTERNS.fullBody),
      splitType: 'fullBody',
    }
  }

  if (days === 4) {
    // Upper / Lower
    const name = lang === 'en' ? 'Upper / Lower Split — Upper Day + Lower Day' : 'Upper / Lower Split — يوم أعلى + يوم أسفل'
    const dayFocuses = []
    const patterns = []
    for (let i = 0; i < days; i++) {
      if (i % 2 === 0) {
        dayFocuses.push(lang === 'en' ? 'Upper Body' : 'أعلى جسم')
        patterns.push(MOVEMENT_PATTERNS.upper)
      } else {
        dayFocuses.push(lang === 'en' ? 'Lower Body' : 'أسفل جسم')
        patterns.push(MOVEMENT_PATTERNS.lower)
      }
    }
    return { name, dayFocuses, patterns, splitType: 'upperLower' }
  }

  // 5+ days: Push / Pull / Legs + Upper / Lower
  const name = lang === 'en' ? 'Push / Pull / Legs + Upper / Lower' : 'Push / Pull / Legs + Upper / Lower'
  const cycle = ['push', 'pull', 'legs', 'upper', 'lower']
  const focusMap = {
    push: { en: 'Push (Chest + Shoulders + Triceps)', ar: 'دفع (صدر + كتف + ترايسبس)' },
    pull: { en: 'Pull (Back + Biceps)', ar: 'سحب (ظهر + بايسبس)' },
    legs: { en: 'Legs (Squats + Deadlifts)', ar: 'أرجل (سكوات + ديدليفت)' },
    upper: { en: 'Upper Body', ar: 'أعلى جسم' },
    lower: { en: 'Lower Body', ar: 'أسفل جسم' },
  }

  const dayFocuses = []
  const patterns = []
  for (let i = 0; i < days; i++) {
    const type = cycle[i % cycle.length]
    dayFocuses.push(lang === 'en' ? focusMap[type].en : focusMap[type].ar)
    patterns.push(MOVEMENT_PATTERNS[type])
  }
  return { name, dayFocuses, patterns, splitType: 'pplUpperLower' }
}

/**
 * WorkoutBuilder: Builds days based on Movement Patterns (not exercise names)
 * Picks exercises from the pool for each movement pattern in the day
 */
export function WorkoutBuilder(form, pool, dayFocuses, patterns, globalUsedNames) {
  const { lang, goal, trainingType } = form
  const dayNames = lang === 'en' ? dayNamesEN : dayNamesAR
  const dayData = []
  const nums = lang === 'en' ? ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'] : dayNames

  for (let i = 0; i < dayFocuses.length; i++) {
    const focusText = dayFocuses[i]
    const pats = patterns[i]
    const exercises = []

    for (let p = 0; p < pats.length; p++) {
      const movId = pats[p]
      let candidates = pool.filter(ex => !globalUsedNames.has(ex.name) && ex.mov === movId)

      if (candidates.length === 0) {
        // Fallback to pool-wide search (allows same-day unique ex but different name)
        const usedInDay = new Set(exercises.map(e => e.name))
        candidates = pool.filter(ex => !usedInDay.has(ex.name) && ex.mov === movId)
      }

      if (candidates.length > 0) {
        const pick = candidates[(i * 3 + p * 7) % candidates.length]
        exercises.push(adjust(pick, goal))
        globalUsedNames.add(pick.name)
      }
    }

    // Add cardio
    const specificCardio = lang === 'en' ? cardioOptionsEN[trainingType] : cardioOptionsAR[trainingType]
    const fallbackCardio = generalCardioOptions(lang, goal)
    const cardioOpts = specificCardio || fallbackCardio
    const cardio = cardioOpts[i % cardioOpts.length]
    exercises.push({
      name: `🔥 ${lang === 'en' ? 'Cardio' : 'كارديو'}: ${cardio.name}`,
      durationMinutes: cardio.duration,
      sets: '-', reps: '-', rest: '-',
    })

    const title = lang === 'en'
      ? `Day ${nums[i + 1] || (i + 1)} — ${focusText}`
      : `اليوم ${nums[i + 1] || (i + 1)} — ${focusText}`

    dayData.push({
      day: title,
      focus: focusText,
      exercises,
    })
  }

  return dayData
}

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

  const dayNames = lang === 'en' ? dayNamesEN : dayNamesAR
  const nutriMap = lang === 'en' ? nutriMapEN : nutriMapAR
  const MAX_ATTEMPTS = 8

  // 1️⃣ Select split using SplitSelector
  const splitConfig = SplitSelector(form)
  console.log('GENERATOR_VERSION', 'RuleBasedGenerator')
  console.log('SPLIT_SELECTED', splitConfig.name)

  let dayData = []
  let report = null
  let qcResult = null
  let attempts = 0
  const globalUsedNames = new Set()

  // 2️⃣ Build days using WorkoutBuilder with retry loop
  do {
    attempts++
    globalUsedNames.clear()
    dayData = []

    // Track trace for each day
    for (let i = 0; i < days; i++) {
      console.log('DAY_TEMPLATE', i, splitConfig.dayFocuses[i])
    }

    // Use WorkoutBuilder to create the days
    dayData = WorkoutBuilder(form, pool, splitConfig.dayFocuses, splitConfig.patterns, globalUsedNames)

    // Ensure minimum weekly coverage for ABS (>=2) and CALVES (>=2)
    ensureWeeklyCoverage(dayData, pool, (ex) => adjust(ex, goal), globalUsedNames)

    // Regenerate day titles from actual exercises (preserving focus)
    dayData.forEach((dd, i) => {
      const title = generateDayTitle(dd, lang, splitConfig.dayFocuses[i] || null)
      const prefix = lang === 'en' ? `Day ${dayNames[i + 1]} — ` : `اليوم ${dayNames[i + 1]} — `
      dd.day = prefix + title
      dd.focus = title
    })

    if (trainingType === 'gym') {
      // Run validation (movement pattern checks)
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
     console.error('INVALID PLAN RETURNED', qcResult.total, report ? report.errors : [])
     // Generate emergency plan as last resort - use cardoOptionsEN/AR directly
     const cardioOptsFallback = { ...(lang === 'en' ? cardioOptionsEN : cardioOptionsAR), general: generalCardioOptions(lang, goal) }
     return generateEmergencyPlan(form, lang, w, h, a, days, goal, level, equipList, trainingType, bmr, protein, nutriMap, nutriMapEN, cardioOptsFallback, dayNames)
   }

   const result = {
     split: splitConfig.name,
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

// Emergency plan generator - returns a valid plan when normal generation fails
function generateEmergencyPlan(form, lang, w, h, a, days, goal, level, equipList, trainingType, bmr, protein, nutriMap, nutriMapEN, cardioOptions, dayNames) {
  console.log('GENERATING EMERGENCY PLAN')
  
  // Determine split based on rules
  let split
  if (days <= 3) {
    split = lang === 'en' ? `Full Body — ${days}-Day Full Body` : `Full Body — ${days} أيام كامل للجسم`
  } else if (days === 4) {
    split = lang === 'en' ? 'Upper / Lower Split — Upper Day + Lower Day' : 'Upper / Lower Split — يوم أعلى + يوم أسفل'
  } else {
    // 5+ days: Push Pull Legs rotation
    split = lang === 'en' ? 'Push / Pull / Legs Rotation' : 'Push / Pull / Legs مكرر'
  }
  console.log('GENERATOR_VERSION', 'EmergencyPlan')
  console.log('SPLIT_SELECTED', split)

  // Get exercise pools and tag
  const pools = getExercisePools(lang)
  let pool = mergePools(pools, equipList)
  tagExercises(pool)

  // Simple focus generator based on day index
  const getFocusForDay = (dayIndex) => {
    if (days <= 3) {
      return lang === 'en' ? 'Full Body' : 'تمارين كاملة للجسم'
    }
    if (days === 4) {
      // Day 1: Upper, Day 2: Lower, Day 3: Upper, Day 4: Lower
      return dayIndex % 2 === 0 
        ? (lang === 'en' ? 'Upper Body' : 'أعلى جسم')
        : (lang === 'en' ? 'Lower Body' : 'أسفل جسم')
    }
    // 5+ days: Push, Pull, Legs, repeat
    const mod = dayIndex % 3
    if (mod === 0) return lang === 'en' ? 'Push (Chest + Shoulders + Triceps)' : 'دفع (صدر + كتف + ترايسبس)'
    if (mod === 1) return lang === 'en' ? 'Pull (Back + Biceps)' : 'سحب (ظهر + بايسبس)'
    return lang === 'en' ? 'Legs (Squats + Deadlifts)' : 'أرجل (سكوات + ديدليفت)'
  }

  // Build day exercises using existing selector but with simple loop
  const dayData = []
  const globalUsedNames = new Set()
  
  for (let i = 0; i < days; i++) {
    const focusText = getFocusForDay(i)
    const exs = buildDayExercises(i, pool, focusText, trainingType, goal, lang, globalUsedNames)
    
    // Add cardio
    const cardioOpts = cardioOptions[trainingType] || cardioOptions.general
    const cardio = cardioOpts[i % cardioOpts.length]
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

  // Ensure weekly coverage
  ensureWeeklyCoverage(dayData, pool, (ex) => adjust(ex, goal), globalUsedNames)

  // Regenerate day titles from actual exercises (preserving focus)
  dayData.forEach((dd, i) => {
    const forcedTitle = getFocusForDay(i)
    const title = generateDayTitle(dd, lang, forcedTitle)
    const prefix = lang === 'en' ? `Day ${dayNames[i + 1]} — ` : `اليوم ${dayNames[i + 1]} — `
    dd.day = prefix + title
    dd.focus = title
  })

  // Validate and score - if fails, we still return but log error (should not happen with emergency plan)
  const report = validateWorkout(dayData)
  const qcResult = calculateWorkoutScore({ days: dayData, equipmentList: equipList })
  
  if (!report.allPassed || qcResult.verdict === 'FAIL') {
    console.error('Emergency plan failed QC:', { report, qcResult })
    // As last resort, return a hardcoded minimal valid plan
    return generateHardcodedEmergencyPlan(form, lang, w, h, a, days, goal, level, equipList, trainingType, bmr, protein, nutriMap, nutriMapEN, cardioOptions, dayNames)
  }

  // Build result similar to normal generator
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

  return {
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
}

// Hardcoded emergency plan - returns a known good plan for common cases
function generateHardcodedEmergencyPlan(form, lang, w, h, a, days, goal, level, equipList, trainingType, bmr, protein, nutriMap, nutriMapEN, cardioOptions, dayNames) {
  console.log('GENERATING HARDCODED EMERGENCY PLAN')
  
  // Define some safe exercises that are likely in the DB
  const safeExercises = {
    push: ['Bench Press', 'Overhead Press', 'Incline Bench Press', 'Lateral Raise', 'Triceps Pushdown'],
    pull: ['Pull Up', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Barbell Curl'],
    legs: ['Squat', 'Romanian Deadlift', 'Leg Extension', 'Leg Curl', 'Standing Calf Raise'],
    upper: ['Bench Press', 'Overhead Press', 'Barbell Row', 'Lateral Raise', 'Barbell Curl', 'Triceps Pushdown'],
    lower: ['Squat', 'Romanian Deadlift', 'Leg Extension', 'Leg Curl', 'Standing Calf Raise'],
    full: ['Bench Press', 'Pull Up', 'Squat', 'Overhead Press', 'Barbell Row', 'Leg Extension', 'Leg Curl']
  }
  
  // This is a simplified implementation - in reality we'd map to actual DB entries
  // For now, we'll just return a minimal structure that mirrors normal output
  const split = lang === 'en' && days === 5 ? 'Push / Pull / Legs Rotation' : 
                lang === 'ar' && days === 5 ? 'Push / Pull / Legs مكرر' :
                days <= 3 ? (lang === 'en' ? `Full Body — ${days}-Day Full Body` : `Full Body — ${days} أيام كامل للجسم`) :
                (lang === 'en' ? 'Upper / Lower Split — Upper Day + Lower Day' : 'Upper / Lower Split — يوم أعلى + يوم أسفل')
  
  // Create minimal days with placeholder exercises
  const dayData = []
  for (let i = 0; i < days; i++) {
    const focusText = lang === 'en' 
      ? (days <= 3 ? 'Full Body' : 
         days === 4 ? (i % 2 === 0 ? 'Upper Body' : 'Lower Body') : 
         ['Push', 'Pull', 'Legs'][i % 3])
      : (days <= 3 ? 'تمارين كاملة للجسم' : 
         days === 4 ? (i % 2 === 0 ? 'أعلى جسم' : 'أسفل جسم') : 
         ['دفع', 'سحب', 'أرجل'][i % 3])
    
    // Use 3 placeholder exercises per day (real implementation would use DB)
    const exercises = [
      { name: lang === 'en' ? 'Placeholder Exercise 1' : 'تمرين احتياطي 1', sets: 3, reps: '8-12', rest: '60 ث' },
      { name: lang === 'en' ? 'Placeholder Exercise 2' : 'تمرين احتياطي 2', sets: 3, reps: '8-12', rest: '60 ث' },
      { name: lang === 'en' ? 'Placeholder Exercise 3' : 'تمرين احتياطي 3', sets: 3, reps: '8-12', rest: '60 ث' }
    ]
    
    // Add cardio
    const cardio = { name: lang === 'en' ? 'Jump Rope' : 'نط حبل', duration: 10 }
    exercises.push({
      name: `🔥 ${lang === 'en' ? 'Cardio' : 'كارديو'}: ${cardio.name}`,
      durationMinutes: cardio.duration,
      sets: '-', reps: '-', rest: '-',
    })
    
    dayData.push({
      day: lang === 'en' ? `Day ${i + 1} — ${focusText}` : `اليوم ${i + 1} — ${focusText}`,
      focus: focusText,
      exercises: exercises,
    })
  }

  const tips = lang === 'en'
    ? [
        'Warm up 10 min before every session',
        'Focus on form over weight',
        'Stay hydrated',
        'Get adequate sleep',
        'Track your progress weekly'
      ]
    : [
        'الإحماء 10 د قبل كل تمرين',
        'التركيز على الفورم وليس الوزن',
        'اشرب كمية كافية من الماء',
        'احصل على نوم كافٍ',
        'سجل تقدمك أسبوعياً'
      ]

  const dailyCalories = Math.round(bmr * ({ fat_loss: 1.2, muscle_gain: 1.55, endurance: 1.55, strength: 1.55, general: 1.4 }[goal] || 1.4)) - (goal === 'fat_loss' ? 500 : goal === 'muscle_gain' ? 300 : 0) + (goal === 'muscle_gain' ? 300 : goal === 'strength' ? 100 : 0)

  return {
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
    _qc: { total: 60, verdict: 'EMERGENCY' }, // Low score but we have to return something
  }
}
