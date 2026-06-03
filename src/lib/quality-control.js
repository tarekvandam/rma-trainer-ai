export function calculateWorkoutScore(plan) {
  const days = plan.days || []
  const equipList = plan.equipmentList || plan._equipmentList || []
  const level = plan.level || ''

  const split = checkSplitValidation(days)
  const movement = checkMovementPatterns(days)
  const dup = checkDuplicateQC(days)
  const muscle = checkMuscleCoverage(days)
  const equip = checkEquipmentQC(plan)
  const realSquat = checkRealSquat(days)
  const pushDiversity = checkPushDayDiversity(days)
  const upperDayCheck = checkUpperDayMovements(days)

  const splitScore = split.passed ? 20 : 0
  const missingPatterns = 6 - countTrue(movement)
  const movementScore = Math.round(Math.max(0, 20 - missingPatterns * (20 / 6)))
  const duplicateScore = dup.passed ? 20 : Math.max(0, 20 - dup.weeklyOver2.length * 2 - dup.withinDay.length * 5)
  const missingMuscles = muscle.missing.length
  const muscleScore = Math.round(Math.max(0, 20 - missingMuscles * (20 / 12)))
  const equipmentScore = equip.passed ? 20 : 0

  let total = splitScore + movementScore + duplicateScore + muscleScore + equipmentScore

  // Real Squat penalty: -20 if gym intermediate+ and no real squat
  const isGymUser = equipList.length === 0 || equipList.some(e => GYM_EQUIPMENT.includes(e))
  const needsRealSquat = isGymUser && (level === 'intermediate' || level === 'advanced')
  if (needsRealSquat && !realSquat.found) {
    total -= 20
  }

  // Push day diversity penalty: -5
  if (!pushDiversity.passed) {
    total -= 5
  }

  // Upper Day movement penalty: -10 per missing pattern
  if (upperDayCheck.violations.length > 0) {
    total -= upperDayCheck.violations.length * 10
  }

  // Pull Day Volume check: -5 if missing Secondary Pull
  const pullDayVolume = checkPullDayVolume(days)
  const pullDayVolumePenalty = pullDayVolume.passed ? 0 : -5
  total += pullDayVolumePenalty

  // Lateral Raise frequency: no penalty but check (handled by generator)
  const lateralRaiseFreq = checkLateralRaiseFrequency(days)

  // Weekly Muscle Volume Validation: -10 per muscle out of range
  const weeklyVolume = checkWeeklyMuscleVolume(days)
  let volumePenalty = 0
  const volumeViolations = weeklyVolume.filter(v => !v.inRange)
  volumePenalty = volumeViolations.length * -10
  total += volumePenalty

  const splitType = detectSplitType(days)

  const details = {
    total: Math.max(0, Math.round(total)),
    rawScore: total,
    split: { score: splitScore, ...split },
    movement: { score: movementScore, found: movement },
    duplicate: { score: duplicateScore, ...dup },
    muscle: { score: muscleScore, present: muscle.present, missing: muscle.missing },
    equipment: { score: equipmentScore, ...equip },
    realSquat: { found: realSquat.found, exercises: realSquat.exercises, penalty: needsRealSquat && !realSquat.found ? -20 : 0 },
    pushDiversity: { passed: pushDiversity.passed, violations: pushDiversity.violations, penalty: pushDiversity.passed ? 0 : -5 },
    upperDayCheck: { passed: upperDayCheck.passed, violations: upperDayCheck.violations, penalty: upperDayCheck.violations.length * -10 },
    pullDayVolume: pullDayVolume,
    lateralRaiseFreq: lateralRaiseFreq,
    weeklyVolume: { details: weeklyVolume, penalty: volumePenalty },
    splitType,
    verdict: total >= 90 ? 'PASS' : total >= 80 ? 'REGENERATE' : 'FAIL',
  }

  console.log('================= QUALITY CONTROL =================')
  console.log(`Split Validation:        ${split.passed ? '✔' : '✗'} ${splitScore}/20`)
  console.log(`Movement Patterns:       ${missingPatterns === 0 ? '✔' : '✗'} ${movementScore}/20  (missing: ${missingPatterns > 0 ? Object.entries(movement).filter(([k, v]) => !v && k !== 'pass').map(([k]) => k).join(', ') : 'none'})`)
  console.log(`Duplicate Validation:    ${dup.passed ? '✔' : '✗'} ${duplicateScore}/20`)
  console.log(`Muscle Coverage:         ${missingMuscles === 0 ? '✔' : '✗'} ${muscleScore}/20  (missing: ${missingMuscles > 0 ? muscle.missing.join(', ') : 'none'})`)
  console.log(`Equipment Validation:    ${equip.passed ? '✔' : '✗'} ${equipmentScore}/20`)
  console.log(`Real Squat Found:        ${realSquat.found ? '✔ YES' : '✗ NO'} ${needsRealSquat && !realSquat.found ? '(-20 penalty)' : ''}`)
  console.log(`Push Day Diversity:      ${pushDiversity.passed ? '✔' : '✗ VIOLATION'} ${!pushDiversity.passed ? '(-5 penalty)' : ''}`)
  const upperMissing = upperDayCheck.violations.map(v => v.missing).join(', ')
  console.log(`Upper Day Patterns:      ${upperDayCheck.passed ? '✔' : '✗ MISSING'} ${!upperDayCheck.passed ? `(-${upperDayCheck.violations.length * 10} penalty: ${upperMissing})` : ''}`)
  console.log(`Pull Day Secondary Pull: ${pullDayVolume.passed ? '✔' : '✗ MISSING'} ${!pullDayVolume.passed ? '(-5 penalty)' : ''}`)
  console.log(`Lateral Raise Frequency: ${lateralRaiseFreq.passed ? `✔ ${lateralRaiseFreq.count}x` : `✗ ${lateralRaiseFreq.count}x (fixed by generator)`}`)
  console.log(`Weekly Volume:           ${volumeViolations.length === 0 ? '✔ ALL IN RANGE' : `✗ ${volumeViolations.map(v => `${v.muscle} ${v.sets}s`).join(', ')} (-${volumePenalty} penalty)`}`)
  console.log(`Split Type:              ${splitType}`)
  console.log(`-----------------------------------------------------`)
  console.log(`Workout Score: ${Math.max(0, Math.round(total))}/100`)
  console.log(`Verdict: ${details.verdict}${details.verdict === 'REGENERATE' ? ' (score < 90, regenerating...)' : ''}${details.verdict === 'FAIL' ? ' (score < 80, plan discarded)' : ''}`)
  console.log('=====================================================')

  return details
}

function countTrue(obj) {
  let c = 0
  for (const v of Object.values(obj)) { if (v === true) c++ }
  return c
}

// ---------- 1. Split Validation (20 pts) ----------
function checkSplitValidation(days) {
  const details = days.map(d => {
    const type = detectDayType(d.focus || d.day)
    const exMoves = d.exercises
      .filter(e => !e.name.includes('Cardio') && !e.name.includes('كارديو'))
      .map(e => e.movementPattern || e.mov || '')

    const mismatch = !exercisesMatchType(exMoves, type)
    return { day: d.day || d.focus, type, mismatch, exercises: exMoves.length }
  })

  const anyMismatch = details.some(d => d.mismatch)
  return { passed: !anyMismatch, details }
}

function detectDayType(focus) {
  const f = (focus || '').toLowerCase()
  const pushKw = ['push', 'chest', 'shoulder', 'triceps', 'دفع', 'صدر', 'كتف', 'تراي']
  const pullKw = ['pull', 'back', 'biceps', 'row', 'سحب', 'ظهر', 'باي']
  const legsKw = ['legs', 'squat', 'deadlift', 'أرجل', 'سكوات', 'ديد']
  const upperKw = ['upper', 'أعلى']
  const lowerKw = ['lower', 'أسفل']

  const isUpper = upperKw.some(k => f.includes(k))
  const isLower = lowerKw.some(k => f.includes(k))
  const isPush = pushKw.some(k => f.includes(k))
  const isPull = pullKw.some(k => f.includes(k))
  const isLegs = legsKw.some(k => f.includes(k))

  if (isUpper) return 'upper'
  if (isLower) return 'lower'
  if (isPush && !isPull && !isLegs) return 'push'
  if (isPull && !isPush && !isLegs) return 'pull'
  if (isLegs && !isPush && !isPull) return 'legs'
  if (isPush && isPull && isLegs) return 'full'
  if (isPush && isPull) return 'push+pull'
  if (isPush && isLegs) return 'push+legs'
  if (isPull && isLegs) return 'pull+legs'
  return 'unknown'
}

const pushMoves = ['Horizontal Push', 'Vertical Push', 'Chest Isolation', 'Lateral Raise', 'Triceps Extension', 'CHEST_COMPOUND', 'SHOULDER_COMPOUND', 'CHEST_ISOLATION', 'LATERAL_RAISE', 'TRICEPS']
const pullMoves = ['Vertical Pull', 'Horizontal Pull', 'Row Variation', 'Rear Delt Fly', 'Bicep Curl', 'VERTICAL_PULL', 'HORIZONTAL_PULL', 'BACK_ACCESSORY', 'REAR_DELT', 'BICEPS']
const legMoves = ['Squat', 'Hip Hinge', 'Leg Extension', 'Leg Curl', 'Calf Raise', 'Core Flexion', 'Core Stabilization', 'Core Rotation', 'Back Extension', 'SQUAT_PATTERN', 'HIP_HINGE', 'QUAD_ISOLATION', 'HAMSTRING', 'CALVES', 'ABS']
const fullMoves = [...pushMoves, ...pullMoves, ...legMoves]

function exercisesMatchType(exMoves, type) {
  if (!exMoves.length) return false
  const upperMoves = [...pushMoves, ...pullMoves]
  const lowerMoves = [...legMoves]
  const allowed = type === 'push' ? pushMoves :
    type === 'pull' ? pullMoves :
    type === 'legs' ? legMoves :
    type === 'upper' ? upperMoves :
    type === 'lower' ? lowerMoves :
    type === 'full' ? fullMoves :
    type === 'push+pull' ? upperMoves :
    type === 'push+legs' ? [...pushMoves, ...legMoves] :
    type === 'pull+legs' ? [...pullMoves, ...legMoves] : fullMoves

  const badMoves = exMoves.filter(m => !allowed.includes(m))
  if (badMoves.length === 0) return true

  const goodCount = exMoves.filter(m => allowed.includes(m)).length
  return goodCount / exMoves.length >= 0.6
}

// ---------- 2. Movement Pattern Validation (20 pts) ----------
function checkMovementPatterns(days) {
  const allMoves = []
  days.forEach(d => {
    d.exercises.forEach(e => {
      if (!e.name.includes('Cardio') && !e.name.includes('كارديو')) {
        allMoves.push(e.movementPattern || e.mov || '')
      }
    })
  })

  return {
    pushPattern: allMoves.some(m => /push/i.test(m) || m === 'CHEST_COMPOUND' || m === 'SHOULDER_COMPOUND'),
    pullPattern: allMoves.some(m => /pull/i.test(m) || m === 'VERTICAL_PULL' || m === 'HORIZONTAL_PULL' || m === 'BACK_ACCESSORY'),
    squatPattern: allMoves.some(m => m === 'Squat' || m === 'SQUAT_PATTERN'),
    hipHinge: allMoves.some(m => m === 'Hip Hinge' || m === 'HIP_HINGE'),
    core: allMoves.some(m => /core|abs|back extension/i.test(m) || m === 'ABS'),
    calves: allMoves.some(m => m === 'Calf Raise' || m === 'CALVES'),
  }
}

// ---------- 3. Duplicate Validation (20 pts) ----------
function checkDuplicateQC(days) {
  const withinDay = []
  const weeklyCount = {}
  const weeklyOver2 = []

  days.forEach(dd => {
    const daySeen = new Set()
    dd.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      if (daySeen.has(e.name)) withinDay.push(e.name)
      daySeen.add(e.name)
      weeklyCount[e.name] = (weeklyCount[e.name] || 0) + 1
    })
  })

  for (const [name, count] of Object.entries(weeklyCount)) {
    if (count > 2) weeklyOver2.push(`${name} (${count}x)`)
  }

  return {
    passed: withinDay.length === 0 && weeklyOver2.length === 0,
    withinDay,
    weeklyOver2,
  }
}

// ---------- 4. Muscle Coverage Validation (20 pts) ----------
const REQUIRED_MUSCLES = ['Chest', 'Back', 'Front Delts', 'Side Delts', 'Rear Delts', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs']

function checkMuscleCoverage(days) {
  const covered = new Set()
  days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      const pMuscles = e.primaryMuscles || []
      const sMuscles = e.secondaryMuscles || []
      pMuscles.forEach(m => covered.add(m))
      sMuscles.forEach(m => covered.add(m))
    })
  })

  const missing = REQUIRED_MUSCLES.filter(m => !covered.has(m))
  return { present: REQUIRED_MUSCLES.filter(m => covered.has(m)), missing }
}

// ---------- 5. Equipment Validation (20 pts) ----------
const GYM_EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'gym_machine', 'pullup_bar', 'smith_machine', 'leg_press', 'lat_pulldown']

function checkEquipmentQC(plan) {
  const equipList = plan.equipmentList || plan._equipmentList || []
  const isGymUser = equipList.length === 0 || equipList.some(e => GYM_EQUIPMENT.includes(e))
  if (!isGymUser) return { passed: true, reason: 'Not a gym equipment user — equipment validation skipped' }

  const homeSources = new Set(['none', 'resistance_bands', 'step'])
  const homeExercises = []
  ;(plan.days || []).forEach(d => {
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      if (e.equipSource && homeSources.has(e.equipSource)) {
        homeExercises.push({ name: e.name, source: e.equipSource })
      }
    })
  })

  return { passed: homeExercises.length === 0, homeExercises }
}

// ---------- 6. Real Squat Check ----------
const REAL_SQUAT_PATTERNS = /back squat|front squat|hack squat|smith.*squat|squats|سكوات.*بار|سكوات أمامي|سكوات.*سميث|سكوات/

function checkRealSquat(days) {
  const found = []
  days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      const n = e.name.toLowerCase()
      if (REAL_SQUAT_PATTERNS.test(n) && e.mov !== 'QUAD_ISOLATION') {
        found.push(e.name)
      }
    })
  })
  return { found: found.length > 0, exercises: found }
}

// ---------- 7. Push Day Exercise Diversity ----------
function checkPushDayDiversity(days) {
  const violations = []

  days.forEach(d => {
    const type = detectDayType(d.focus || d.day)
    if (type !== 'push' && type !== 'upper') return

    const pushExs = d.exercises.filter(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return false
      const cat = e.cat || ''
      return cat === 'push'
    })

    // Check for barbell bench + flat DB bench in same day (excluding machine/incline/decline)
    const hasBarbellBench = pushExs.some(e => {
      const n = e.name.toLowerCase()
      return /\bbench press\b/.test(n) && !/dumbbell|db/i.test(n) && !/incline|decline/i.test(n) && !/machine|smith/i.test(n)
    })
    const hasFlatDBBench = pushExs.some(e => {
      const n = e.name.toLowerCase()
      return /dumbbell.*bench.*press/i.test(n) && !/incline|decline/i.test(n)
    })

    if (hasBarbellBench && hasFlatDBBench) {
      violations.push({ day: d.day || d.focus, issue: 'Barbell Bench Press + Dumbbell Bench Press in same day' })
    }
  })

  return { passed: violations.length === 0, violations }
}

// ---------- 8. Upper Day Movement Pattern Check ----------
const UPPER_REQUIRED = [
  { pattern: 'Horizontal Push', alt: 'CHEST_COMPOUND' },
  { pattern: 'Horizontal Pull', alt: 'HORIZONTAL_PULL' },
  { pattern: 'Vertical Push', alt: 'SHOULDER_COMPOUND' },
  { pattern: 'Vertical Pull', alt: 'VERTICAL_PULL' },
  { pattern: 'Lateral Raise', alt: 'LATERAL_RAISE' },
  { pattern: 'Bicep Curl', alt: 'BICEPS' },
  { pattern: 'Triceps Extension', alt: 'TRICEPS' },
]

function checkUpperDayMovements(days) {
  const violations = []

  days.forEach(d => {
    const type = detectDayType(d.focus || d.day)
    if (type !== 'upper') return

    const dayMoves = d.exercises
      .filter(e => !e.name.includes('Cardio') && !e.name.includes('كارديو'))
      .map(e => e.movementPattern || e.mov || '')

    UPPER_REQUIRED.forEach(req => {
      const found = dayMoves.some(m =>
        m === req.pattern || m === req.alt ||
        (req.pattern === 'Horizontal Push' && /push/i.test(m) && !/vertical/i.test(m)) ||
        (req.pattern === 'Horizontal Pull' && /pull/i.test(m) && !/vertical/i.test(m)) ||
        (req.pattern === 'Vertical Push' && /vertical.*push|shoulder.*compound/i.test(m)) ||
        (req.pattern === 'Vertical Pull' && /vertical.*pull/i.test(m))
      )
      if (!found) {
        violations.push({ day: d.day || d.focus, missing: req.pattern })
      }
    })
  })

  return { passed: violations.length === 0, violations }
}
function detectSplitType(days) {
  const types = days.map(d => detectDayType(d.focus || d.day))
  const unique = [...new Set(types)]

  // Check for Upper/Lower keywords in focus
  const hasUpper = days.some(d => (d.focus || '').toLowerCase().includes('upper'))
  const hasLower = days.some(d => (d.focus || '').toLowerCase().includes('lower'))
  const hasArms = days.some(d => (d.focus || '').toLowerCase().includes('arms') || (d.focus || '').toLowerCase().includes('أذرع'))

  if (unique.includes('push') && unique.includes('pull') && unique.includes('legs')) {
    if (hasUpper || hasLower) return hasArms ? 'PPL + Upper/Lower + Arms' : 'PPL + Upper/Lower'
    return 'PPL'
  }
  if (hasUpper && hasLower) return 'Upper/Lower'
  if (unique.includes('push') && unique.includes('pull') && !unique.includes('legs')) return 'Upper/Lower'
  if (days.length === 3 && unique.every(t => t === 'full' || t === 'push+pull+legs')) return 'Full Body'
  return 'Custom'
}

// ---------- 9. Pull Day Volume Check (Secondary Pull) ----------
function checkPullDayVolume(days) {
  const violations = []
  days.forEach(d => {
    const type = detectDayType(d.focus || d.day)
    if (type !== 'pull') return
    const backAccessoryCount = d.exercises.filter(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return false
      const mov = e.movementPattern || e.mov || ''
      return mov === 'BACK_ACCESSORY' || mov === 'Row Variation'
    }).length
    if (backAccessoryCount === 0) {
      violations.push({ day: d.day || d.focus, issue: 'Missing secondary pull (BACK_ACCESSORY)' })
    }
  })
  return { passed: violations.length === 0, violations }
}

// ---------- 10. Lateral Raise Frequency Check ----------
function checkLateralRaiseFrequency(days) {
  let count = 0
  days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      if (/lateral raise|جانبي/i.test(e.name)) count++
    })
  })
  return { passed: count <= 2, count }
}

// ---------- 11. Weekly Muscle Volume Validation ----------
const VOLUME_RANGES = {
  Chest: { min: 10, max: 20 },
  Back: { min: 12, max: 22 },
  'Front Delts': { min: 10, max: 20, group: 'Shoulders' },
  'Side Delts': { min: 10, max: 20, group: 'Shoulders' },
  'Rear Delts': { min: 10, max: 20, group: 'Shoulders' },
  Quads: { min: 10, max: 18 },
  Hamstrings: { min: 8, max: 16 },
  Biceps: { min: 8, max: 16 },
  Triceps: { min: 8, max: 16 },
  Calves: { min: 6, max: 15 },
  Abs: { min: 6, max: 15 },
}

function checkWeeklyMuscleVolume(days) {
  const muscleSets = {}
  days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      const primary = e.primaryMuscles || []
      primary.forEach(m => {
        muscleSets[m] = (muscleSets[m] || 0) + (parseInt(e.sets) || 3)
      })
    })
  })

  // Group by muscle group (Shoulders = Front + Side + Rear Delts)
  const grouped = {}
  for (const [muscle, sets] of Object.entries(muscleSets)) {
    const range = VOLUME_RANGES[muscle]
    if (range && range.group) {
      grouped[range.group] = (grouped[range.group] || 0) + sets
    } else {
      grouped[muscle] = (grouped[muscle] || 0) + sets
    }
  }

  const results = []
  for (const [muscle, sets] of Object.entries(grouped)) {
    const range = VOLUME_RANGES[muscle]
    if (range) {
      const inRange = sets >= range.min && sets <= range.max
      results.push({ muscle, sets, min: range.min, max: range.max, inRange })
    }
  }
  return results
}


