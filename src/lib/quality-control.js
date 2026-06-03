export function calculateWorkoutScore(plan) {
  const days = plan.days || []

  const split = checkSplitValidation(days)
  const movement = checkMovementPatterns(days)
  const dup = checkDuplicateQC(days)
  const muscle = checkMuscleCoverage(days)
  const equip = checkEquipmentQC(plan)

  const splitScore = split.passed ? 20 : 0
  const missingPatterns = 6 - countTrue(movement)
  const movementScore = Math.round(Math.max(0, 20 - missingPatterns * (20 / 6)))
  const duplicateScore = dup.passed ? 20 : 0
  const missingMuscles = muscle.missing.length
  const muscleScore = Math.round(Math.max(0, 20 - missingMuscles * (20 / 12)))
  const equipmentScore = equip.passed ? 20 : 0

  const total = splitScore + movementScore + duplicateScore + muscleScore + equipmentScore

  const details = {
    total: Math.round(total),
    rawScore: total,
    split: { score: splitScore, ...split },
    movement: { score: movementScore, found: movement },
    duplicate: { score: duplicateScore, ...dup },
    muscle: { score: muscleScore, present: muscle.present, missing: muscle.missing },
    equipment: { score: equipmentScore, ...equip },
    verdict: total >= 90 ? 'PASS' : total >= 80 ? 'REGENERATE' : 'FAIL',
  }

  console.log('================= QUALITY CONTROL =================')
  console.log(`Split Validation:        ${split.passed ? '✔' : '✗'} ${splitScore}/20`)
  console.log(`Movement Patterns:       ${missingPatterns === 0 ? '✔' : '✗'} ${movementScore}/20  (missing: ${missingPatterns > 0 ? Object.entries(movement).filter(([k, v]) => !v && k !== 'pass').map(([k]) => k).join(', ') : 'none'})`)
  console.log(`Duplicate Validation:    ${dup.passed ? '✔' : '✗'} ${duplicateScore}/20`)
  console.log(`Muscle Coverage:         ${missingMuscles === 0 ? '✔' : '✗'} ${muscleScore}/20  (missing: ${missingMuscles > 0 ? muscle.missing.join(', ') : 'none'})`)
  console.log(`Equipment Validation:    ${equip.passed ? '✔' : '✗'} ${equipmentScore}/20`)
  console.log(`-----------------------------------------------------`)
  console.log(`Workout Score: ${Math.round(total)}/100`)
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
  const pushKw = ['push', 'chest', 'shoulder', 'triceps', 'upper', 'دفع', 'صدر', 'كتف', 'تراي', 'أعلى']
  const pullKw = ['pull', 'back', 'biceps', 'row', 'سحب', 'ظهر', 'باي']
  const legsKw = ['legs', 'squat', 'deadlift', 'lower', 'أرجل', 'سكوات', 'ديد', 'أسفل']

  const isPush = pushKw.some(k => f.includes(k))
  const isPull = pullKw.some(k => f.includes(k))
  const isLegs = legsKw.some(k => f.includes(k))

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
  const allowed = type === 'push' ? pushMoves :
    type === 'pull' ? pullMoves :
    type === 'legs' ? legMoves :
    type === 'full' ? fullMoves :
    type === 'push+pull' ? [...pushMoves, ...pullMoves] :
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
