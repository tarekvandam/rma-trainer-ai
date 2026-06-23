import { parseMaxRep, parseMinRest } from './exercise-selector.js'

// ===== SINGLE SOURCE OF TRUTH: Volume limits used by both QC and generator =====
export const VOLUME_LIMITS = {
  perMuscle: {
    Chest: { min: 10, max: 20 },
    Back: { min: 12, max: 22 },
    Shoulders: { min: 10, max: 20 },
    Quads: { min: 10, max: 18 },
    Hamstrings: { min: 8, max: 16 },
    Glutes: { min: 6, max: 16 },
    Biceps: { min: 8, max: 16 },
    Triceps: { min: 8, max: 16 },
    Calves: { min: 6, max: 15 },
    Abs: { min: 6, max: 15 },
  },
  perMuscleGrouped: {
    Chest: { min: 10, max: 20 },
    Back: { min: 12, max: 22 },
    Shoulders: { min: 10, max: 20 },
    'Front Delts': { min: 10, max: 20, group: 'Shoulders' },
    'Side Delts': { min: 10, max: 20, group: 'Shoulders' },
    'Rear Delts': { min: 10, max: 20, group: 'Shoulders' },
    Quads: { min: 10, max: 18 },
    Hamstrings: { min: 8, max: 16 },
    Glutes: { min: 6, max: 16 },
    Biceps: { min: 8, max: 16 },
    Triceps: { min: 8, max: 16 },
    Calves: { min: 6, max: 15 },
    Abs: { min: 6, max: 15 },
  },
  beginnerMaxSetsPerMuscle: 14,
}
// =====================================================================

export function calculateWorkoutScore(plan) {
  const days = plan.days || []
  const equipList = plan.equipmentList || plan._equipmentList || []
  const level = plan.level || ''
  const goal = plan.goal || 'general'

  // Hard fail: beginner with PPL split
  const splitType = detectSplitType(days)
  if (level === 'beginner' && (splitType === 'pplUpperLower' || splitType === 'pplUpperLowerArms' || splitType === 'PPL')) {
    console.log('BEGINNER_SPLIT_FAIL: beginner cannot use PPL split')
    return { total: 0, split: { passed: false }, movement: { score: 0, found: { pushPattern: false, pullPattern: false, squatPattern: false, hipHinge: false, core: false, calves: false } }, duplicate: { passed: false }, muscle: { passed: false, present: [], missing: [] }, equipment: { passed: false }, realSquat: { found: false }, pushDiversity: { passed: true, violations: [] }, upperDayCheck: { passed: true, violations: [] }, pullDayVolume: { passed: true }, lateralRaiseFreq: { passed: true }, weeklyVolume: { details: [], penalty: 0 }, fullBodyCheck: { passed: true, violations: [] }, coachScore: { total: 0, balance: 0, recovery: 0, quality: 0, progression: 0, specificity: 0 }, splitType, verdict: 'FAIL', coachVerdict: 'REGENERATE' }
  }

  // Hard fail: beginner weekly sets per muscle (safety net — VolumeBalancer handles primary cap at 14)
  if (level === 'beginner') {
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
    // Use VOLUME_RANGES max as safety threshold (VolumeBalancer caps at 14 for beginners)
    const overLimit = Object.entries(muscleSets).filter(([m, s]) => {
      const range = VOLUME_LIMITS.perMuscleGrouped[m]
      return s > (range ? range.max : VOLUME_LIMITS.beginnerMaxSetsPerMuscle)
    })
    if (overLimit.length > 0) {
      console.log('BEGINNER_VOLUME_FAIL: beginner sets exceed VOLUME_RANGES for', overLimit.map(([m, s]) => `${m} ${s}s`).join(', '))
      return { total: 0, split: { passed: false }, movement: { score: 0, found: { pushPattern: false, pullPattern: false, squatPattern: false, hipHinge: false, core: false, calves: false } }, duplicate: { passed: false }, muscle: { passed: false, present: [], missing: [] }, equipment: { passed: false }, realSquat: { found: false }, pushDiversity: { passed: true, violations: [] }, upperDayCheck: { passed: true, violations: [] }, pullDayVolume: { passed: true }, lateralRaiseFreq: { passed: true }, weeklyVolume: { details: [], penalty: 0 }, fullBodyCheck: { passed: true, violations: [] }, coachScore: { total: 0, balance: 0, recovery: 0, quality: 0, progression: 0, specificity: 0 }, splitType, verdict: 'FAIL', coachVerdict: 'REGENERATE' }
    }
  }

  // Hard fail: protein > 2.2 g/kg
  const protein = plan._protein || 0
  const weight = plan._weight || 0
  if (protein > 0 && weight > 0 && protein > Math.round(weight * 2.2)) {
    console.log('PROTEIN_FAIL: protein', protein, 'g exceeds 2.2 g/kg for weight', weight)
    return { total: 0, split: { passed: false }, movement: { score: 0, found: { pushPattern: false, pullPattern: false, squatPattern: false, hipHinge: false, core: false, calves: false } }, duplicate: { passed: false }, muscle: { passed: false, present: [], missing: [] }, equipment: { passed: false }, realSquat: { found: false }, pushDiversity: { passed: true, violations: [] }, upperDayCheck: { passed: true, violations: [] }, pullDayVolume: { passed: true }, lateralRaiseFreq: { passed: true }, weeklyVolume: { details: [], penalty: 0 }, fullBodyCheck: { passed: true, violations: [] }, coachScore: { total: 0, balance: 0, recovery: 0, quality: 0, progression: 0, specificity: 0 }, splitType, verdict: 'FAIL', coachVerdict: 'REGENERATE' }
  }

  // Hard fail: displayed sets contain "-" (ranges not resolved) — skip cardio
  const hasRangeSets = days.some(d => d.exercises.some(e => !e.name.includes('Cardio') && !e.name.includes('كارديو') && e.sets && typeof e.sets === 'string' && e.sets.includes('-')))
  if (hasRangeSets) {
    console.log('SETS_RANGE_FAIL: displayed sets contain range (-)')
    return { total: 0, split: { passed: false }, movement: { score: 0, found: { pushPattern: false, pullPattern: false, squatPattern: false, hipHinge: false, core: false, calves: false } }, duplicate: { passed: false }, muscle: { passed: false, present: [], missing: [] }, equipment: { passed: false }, realSquat: { found: false }, pushDiversity: { passed: true, violations: [] }, upperDayCheck: { passed: true, violations: [] }, pullDayVolume: { passed: true }, lateralRaiseFreq: { passed: true }, weeklyVolume: { details: [], penalty: 0 }, fullBodyCheck: { passed: true, violations: [] }, coachScore: { total: 0, balance: 0, recovery: 0, quality: 0, progression: 0, specificity: 0 }, splitType, verdict: 'FAIL', coachVerdict: 'REGENERATE' }
  }

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

  // Full Body Day validation: -10 per day missing push/pull/legs/core
  const fullBodyCheck = checkFullBodyDayCoverage(days)
  let fullBodyPenalty = 0
  if (fullBodyCheck.violations.length > 0) {
    fullBodyPenalty = fullBodyCheck.violations.length * -10
    total += fullBodyPenalty
  }

  // Pull Day Volume check: -5 if missing Secondary Pull
  const pullDayVolume = checkPullDayVolume(days)
  const pullDayVolumePenalty = pullDayVolume.passed ? 0 : -5
  total += pullDayVolumePenalty

  // Lateral Raise frequency: no penalty but check (handled by generator)
  const lateralRaiseFreq = checkLateralRaiseFrequency(days)

  // Weekly Muscle Volume Validation: -10 per muscle out of range
  const weeklyVolume = checkWeeklyMuscleVolume(days, level)
  let volumePenalty = 0
  const volumeViolations = weeklyVolume.filter(v => !v.inRange)
  volumePenalty = volumeViolations.length * -10
  total += volumePenalty

  // Arms Day Validation
  const armsCheck = checkArmsDay(days)
  const armsScore = armsCheck.passed ? 10 : Math.max(0, 10 - armsCheck.violations.length * 5)

  // Coach Score: new 100-point scoring system
  const coachScore = calculateCoachScore(days, plan)

  // Protein score (use existing protein/weight from hard fail check above)
  const proteinScore = (protein > 0 && weight > 0 && protein > Math.round(weight * 2.2)) ? 0 : 10

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
    fullBodyCheck: { passed: fullBodyCheck.passed, violations: fullBodyCheck.violations, penalty: fullBodyPenalty },
    armsCheck,
    coachScore: coachScore,
    splitScore: splitScore,
    proteinScore: proteinScore,
    armsScore: armsScore,
    splitType,
    verdict: total >= 90 ? 'PASS' : total >= 80 ? 'REGENERATE' : 'FAIL',
    coachVerdict: coachScore.total >= 90 ? 'PASS' : 'REGENERATE',
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
  const fbMissing = fullBodyCheck.violations.map(v => `${v.dayName}:${v.missing.join(',')}`).join('; ')
  console.log(`Full Body Day Coverage:  ${fullBodyCheck.passed ? '✔' : '✗ MISSING'} ${!fullBodyCheck.passed ? `(-${fullBodyPenalty} penalty: ${fbMissing})` : ''}`)
  console.log(`Pull Day Secondary Pull: ${pullDayVolume.passed ? '✔' : '✗ MISSING'} ${!pullDayVolume.passed ? '(-5 penalty)' : ''}`)
  console.log(`Lateral Raise Frequency: ${lateralRaiseFreq.passed ? `✔ ${lateralRaiseFreq.count}x` : `✗ ${lateralRaiseFreq.count}x (fixed by generator)`}`)
  console.log(`Weekly Volume:           ${volumeViolations.length === 0 ? '✔ ALL IN RANGE' : `✗ ${volumeViolations.map(v => `${v.muscle} ${v.sets}s`).join(', ')} (-${volumePenalty} penalty)`}`)
  console.log(`Split Type:              ${splitType}`)
  console.log(`Arms Day:                ${armsCheck.passed ? '✔' : '✗ VIOLATIONS'} (${armsCheck.violations.join(', ') || 'none'})`)
  console.log(`Arms Score:              ${armsScore}/10`)
  console.log(`-----------------------------------------------------`)
  console.log(`Workout Score: ${Math.max(0, Math.round(total))}/100`)
  console.log(`Coach Score:   ${coachScore.total}/100 (Balance:${coachScore.balance}/30 Recovery:${coachScore.recovery}/20 Quality:${coachScore.quality}/25 Progression:${coachScore.progression}/15 Specificity:${coachScore.specificity}/10)`)
  console.log(`Verdict: ${details.verdict}${details.verdict === 'REGENERATE' ? ' (score < 90, regenerating...)' : ''}${details.verdict === 'FAIL' ? ' (score < 80, plan discarded)' : ''}`)
  console.log(`Coach: ${details.coachVerdict}${details.coachVerdict === 'REGENERATE' ? ' (coach score < 90, regenerating...)' : ''}`)
  console.log('=====================================================')

  return details
}

/**
 * Split-aware Recovery Validator
 * 
 * Allowed frequency per split type:
 *   FullBody: major muscles ≤ 3x/week (penalty at 4+)
 *   UpperLower: upper ≤ 3, lower ≤ 3
 *   PPL: push ≤ 2, pull ≤ 2, legs ≤ 2
 *   Arms Day: only Biceps/Triceps/Rear Delts/Forearms/Grip count (not full push)
 *
 * Score formula:
 *   -5 per minor violation (1 over limit)
 *   -10 per moderate violation (2 over limit)
 *   -20 per severe violation (3+ over limit)
 *   Clamped 0-100
 */
function calculateRecoveryScore(days, splitType) {
  const isFullBody = splitType === 'fullBody'
  const isUpperLower = splitType === 'upperLower'
  const isPPL = splitType === 'pplUpperLower' || splitType === 'pplUpperLowerArms' || splitType === 'PPL'
  const hasArms = splitType === 'pplUpperLowerArms'

  // Define muscle groups
  const majorMuscles = ['Chest', 'Back', 'Quads', 'Hamstrings', 'Glutes', 'Shoulders']
  const minorMuscles = ['Biceps', 'Triceps', 'Calves', 'Abs', 'Forearms', 'Rear Delts', 'Side Delts', 'Front Delts']

  // Map actual primaryMuscles to groups
  const muscleToGroup = {
    'Chest': 'Chest', 'Back': 'Back', 'Quads': 'Quads', 'Hamstrings': 'Hamstrings', 'Glutes': 'Glutes',
    'Shoulders': 'Shoulders', 'Front Delts': 'Shoulders', 'Side Delts': 'Shoulders', 'Rear Delts': 'Shoulders',
    'Biceps': 'Biceps', 'Triceps': 'Triceps', 'Calves': 'Calves', 'Abs': 'Abs', 'Forearms': 'Forearms',
  }

  // For Full Body, only check major muscle groups (not biceps, triceps, abs, calves)
  const fbMajor = new Set(['Chest', 'Back', 'Quads', 'Hamstrings', 'Glutes', 'Shoulders'])
  // Build muscle day frequency
  const muscleDays = {}
  days.forEach((d, di) => {
    const isArmsDay = hasArms && /arms|arm|أذرع|ذراع/i.test(d.focus || d.day || '')
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      ;(e.primaryMuscles || []).forEach(m => {
        const group = muscleToGroup[m]
        if (!group) return
        // For FB, skip minor muscles
        if (isFullBody && !fbMajor.has(group)) return
        // On Arms day, only count Biceps/Triceps/Rear Delts/Forearms/Grip
        if (isArmsDay && !['Biceps', 'Triceps', 'Rear Delts', 'Forearms'].includes(group)) return
        if (!muscleDays[group]) muscleDays[group] = []
        if (!muscleDays[group].includes(di)) muscleDays[group].push(di)
      })
    })
  })

  // Determine allowed frequency per group based on split type
  function getAllowedFreq(group) {
    if (isFullBody) return 4
    if (isUpperLower) {
      if (['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Front Delts', 'Side Delts', 'Rear Delts'].includes(group)) return 3
      if (['Quads', 'Hamstrings', 'Glutes', 'Calves'].includes(group)) return 3
      if (['Abs', 'Forearms'].includes(group)) return 4
      return 3
    }
    if (isPPL) {
      if (['Chest', 'Shoulders', 'Triceps', 'Front Delts', 'Side Delts'].includes(group)) return 2
      if (['Back', 'Biceps', 'Rear Delts'].includes(group)) return 2
      if (['Quads', 'Hamstrings', 'Glutes', 'Calves'].includes(group)) return 2
      if (['Abs', 'Forearms'].includes(group)) return 3
      return 2
    }
    return 3 // Custom split
  }

  const violations = []
  let recoveryScore = 100

  for (const [group, dayIndices] of Object.entries(muscleDays)) {
    const freq = dayIndices.length
    const allowed = getAllowedFreq(group)
    const over = freq - allowed

    if (over > 0) {
      let penalty = 0
      let severity = 'minor'
      if (over === 1) { penalty = 5; severity = 'minor' }
      else if (over === 2) { penalty = 10; severity = 'moderate' }
      else { penalty = 20; severity = 'severe' }
      recoveryScore -= penalty
      violations.push({ group, frequency: freq, allowed, over, penalty, severity })
    }
  }

  recoveryScore = Math.max(0, Math.min(100, recoveryScore))

  // Recovery Report
  console.log('----- RECOVERY REPORT -----')
  console.log(`Split Type:              ${splitType}`)
  console.log(`Weekly Frequency:        ${Object.entries(muscleDays).map(([g, d]) => `${g} ${d.length}x`).join(', ')}`)
  console.log(`Recovery Score:          ${recoveryScore}/100`)
  if (violations.length > 0) {
    console.log(`Violations:`)
    violations.forEach(v => console.log(`  [${v.severity.toUpperCase()}] ${v.group}: ${v.frequency}x (allowed ${v.allowed}, over by ${v.over}, -${v.penalty} pts)`))
  } else {
    console.log('  None — all frequencies within limits')
  }
  console.log('--------------------------')

  return { score: recoveryScore, violations }
}

function checkCompoundRepLimits(days, level) {
  const isBeginner = level === 'beginner'
  for (const d of days) {
    for (const e of d.exercises) {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) continue
      const type = e.type || 'compound'
      const mov = e.movementPattern || e.mov || ''
      if (type !== 'compound' || isIsolation(mov)) continue
      const n = e.name.toLowerCase()
      const maxRep = parseMaxRep(e.reps)
      if (maxRep === 0) continue
      if (maxRep > 15) return false
      if (/deadlift|رف ميت/.test(n) && maxRep > 10) return false
      if (/(?:^|[^a-z])squat|قرفصاء|سكوات/.test(n) && !/leg press|ليج بريس/.test(n) && maxRep > 12) return false
      if (/bench press|بنش/.test(n) && maxRep > 12) return false
      if (isBeginner) {
        if (/pull.?up|chin.?up|عقلة/.test(n) && maxRep > 8) return false
      } else {
        if (/pull.?up|chin.?up|عقلة/.test(n) && maxRep > 12) return false
      }
      if (/row/.test(n) && !/dumbbell|دمبل/.test(n) && maxRep > 12) return false
    }
  }
  return true
}

function isIsolation(mov) {
  if (!mov) return false
  if (/ISOLATION|CALVES|ABS|BICEPS|TRICEPS|REAR_DELT|LATERAL_RAISE|QUAD_ISOLATION|HAMSTRING/.test(mov)) return true
  if (/leg extension|leg curl|calf raise|bicep curl|triceps|chest fly|lateral raise|face pull|rear delt/.test(mov.toLowerCase())) return true
  return false
}

function checkRestMinimums(days) {
  for (const d of days) {
    for (const e of d.exercises) {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) continue
      const type = e.type || 'compound'
      const mov = e.movementPattern || e.mov || ''
      if (type !== 'compound' || isIsolation(mov)) continue
      const n = e.name.toLowerCase()
      const minRest = parseMinRest(e.rest)
      if (minRest === null) continue
      if (/deadlift|رف ميت/.test(n) && minRest < 120) return false
      if (/(?:^|[^a-z])squat|قرفصاء|سكوات/.test(n) && !/leg press|ليج بريس/.test(n) && minRest < 90) return false
      if (minRest < 60) return false
    }
  }
  return true
}

// Coach Score: 100-point system (30/20/25/15/10)
function calculateCoachScore(days, plan) {
  // Hard block: compound rep limit check — FAIL immediately if violated
  if (!checkCompoundRepLimits(days, plan.level || '') || !checkRestMinimums(days)) {
    return { total: 0, balance: 0, recovery: 0, quality: 0, progression: 0, specificity: 0 }
  }

  // Calorie validator: never allow calories below BMR
  const dailyCalories = plan._dailyCalories || 0
  const bmr = plan._bmr || 0
  if (dailyCalories > 0 && bmr > 0 && dailyCalories < bmr) {
    return { total: 0, balance: 0, recovery: 0, quality: 0, progression: 0, specificity: 0 }
  }

  // Protein validator: hard cap 2.2 g/kg
  const protein = plan._protein || 0
  const weight = plan._weight || 0
  if (protein > 0 && weight > 0 && protein > Math.round(weight * 2.2)) {
    return { total: 0, balance: 0, recovery: 0, quality: 0, progression: 0, specificity: 0 }
  }

  const splitType = detectSplitType(days)

  // 1. Movement Balance (30 pts): check push/pull/legs balance
  const allMoves = []
  days.forEach(d => {
    d.exercises.forEach(e => {
      if (!e.name.includes('Cardio') && !e.name.includes('كارديو')) {
        allMoves.push(e.movementPattern || e.mov || '')
      }
    })
  })
  const pushCount = allMoves.filter(m => /push|CHEST_COMPOUND|SHOULDER_COMPOUND|CHEST_ISOLATION|LATERAL_RAISE|TRICEPS/.test(m)).length
  const pullCount = allMoves.filter(m => /pull|VERTICAL_PULL|HORIZONTAL_PULL|BACK_ACCESSORY|REAR_DELT|BICEPS/.test(m)).length
  const legCount = allMoves.filter(m => /SQUAT_PATTERN|HIP_HINGE|QUAD_ISOLATION|HAMSTRING|CALVES/.test(m)).length
  const total = pushCount + pullCount + legCount
  let balanceScore = 30
  if (total > 0) {
    const pushRatio = pushCount / total
    const pullRatio = pullCount / total
    const legRatio = legCount / total
    // For Full Body, ratios are naturally mixed — more lenient
    const isFB = splitType === 'fullBody'
    if (pushRatio < (isFB ? 0.15 : 0.2) || pushRatio > (isFB ? 0.55 : 0.5)) balanceScore -= 10
    if (pullRatio < (isFB ? 0.15 : 0.2) || pullRatio > (isFB ? 0.55 : 0.5)) balanceScore -= 10
    if (legRatio < (isFB ? 0.1 : 0.15) || legRatio > (isFB ? 0.45 : 0.4)) balanceScore -= 10
  }

  // 2. Recovery (20 pts): split-aware recovery check
  const recovery = calculateRecoveryScore(days, splitType)
  let recoveryScore = Math.round(recovery.score / 5) // Convert 0-100 to 0-20

  // 3. Exercise Quality (25 pts): based on tier distribution
  let sCount = 0, aCount = 0, bCount = 0
  days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      if (e.tier === 'S') sCount++
      else if (e.tier === 'A') aCount++
      else bCount++
    })
  })
  const totalEx = sCount + aCount + bCount
  let qualityScore = 25
  if (totalEx > 0) {
    const sRatio = sCount / totalEx
    if (sRatio < 0.03) qualityScore -= 5
    if (bCount > totalEx * 0.65) qualityScore -= 5
  }

  // 4. Progression (15 pts): check variety in sets/reps across days
  let progressionScore = 15
  const repRanges = new Set()
  days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      if (e.reps) repRanges.add(e.reps.toString())
    })
  })
  if (repRanges.size < 2) progressionScore -= 8

  // 5. Sport Specificity (10 pts): check goal-appropriate exercise selection
  let specificityScore = 10
  const goal = plan.goal || 'general'
  const trainingType = plan.trainingType || 'gym'
  if (goal === 'strength') {
    const sExCount = days.reduce((acc, d) => acc + d.exercises.filter(e => e.tier === 'S').length, 0)
    if (sExCount < days.length) specificityScore -= 3
  }
  if (goal === 'fat_loss') {
    const hasConditioning = days.some(d => d.exercises.some(e => /conditioning|cardio|HIIT/i.test(e.movementPattern || '') || (e.mov === 'CONDITIONING')))
    if (!hasConditioning) specificityScore -= 3
  }
  if (trainingType === 'mma' || trainingType === 'boxing' || trainingType === 'kickboxing' || trainingType === 'bjj' || trainingType === 'muay_thai') {
    const hasCombatEx = days.some(d => d.exercises.some(e => /shadow|sprawl|bear crawl|medicine ball|تمساح|ظل ملاكمة|زحف دب/i.test(e.name)))
    if (!hasCombatEx) specificityScore -= 5
  }

  const totalCoach = Math.max(0, Math.round(balanceScore + recoveryScore + qualityScore + progressionScore + specificityScore))
  return { total: totalCoach, balance: balanceScore, recovery: recoveryScore, quality: qualityScore, progression: progressionScore, specificity: specificityScore }
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
  const isFullBody = days.every(d => /full|كامل/i.test(d.focus || d.day || ''))

  days.forEach(dd => {
    const daySeen = new Set()
    dd.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      if (daySeen.has(e.name)) withinDay.push(e.name)
      daySeen.add(e.name)
      weeklyCount[e.name] = (weeklyCount[e.name] || 0) + 1
    })
  })

  // For Full Body, only flag within-day duplicates (same exercise across days is expected)
  if (!isFullBody) {
    for (const [name, count] of Object.entries(weeklyCount)) {
      if (count > 3) weeklyOver2.push(`${name} (${count}x)`)
    }
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
// Only equipment EXCLUSIVE to commercial gyms — dumbbell/kettlebell/bench/step are home-compatible
const GYM_EQUIPMENT = ['barbell', 'cable', 'gym_machine', 'pullup_bar', 'smith_machine', 'leg_press', 'lat_pulldown']

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
// Upper Day MUST have: Horizontal Push, Vertical Push, Horizontal Pull, Vertical Pull, Lateral Raise, Biceps, Triceps
const UPPER_REQUIRED = [
  { pattern: 'Horizontal Push', mov: 'CHEST_COMPOUND' },
  { pattern: 'Vertical Push', mov: 'SHOULDER_COMPOUND' },
  { pattern: 'Horizontal Pull', mov: 'HORIZONTAL_PULL' },
  { pattern: 'Vertical Pull', mov: 'VERTICAL_PULL' },
  { pattern: 'Lateral Raise', mov: 'LATERAL_RAISE' },
  { pattern: 'Biceps', mov: 'BICEPS' },
  { pattern: 'Triceps', mov: 'TRICEPS' },
]

function checkUpperDayMovements(days) {
  const violations = []

  days.forEach(d => {
    const type = detectDayType(d.focus || d.day)
    if (type !== 'upper') return

    const dayMoves = d.exercises
      .filter(e => !e.name.includes('Cardio') && !e.name.includes('كارديو'))
      .map(e => e.mov || e.movementPattern || '')

    UPPER_REQUIRED.forEach(req => {
      const found = dayMoves.some(m => m === req.mov)
      if (!found) {
        violations.push({ day: d.day || d.focus, missing: req.pattern })
      }
    })
  })

  return { passed: violations.length === 0, violations }
}
// ---------- 8b. Full Body Day Validation ----------
function checkFullBodyDayCoverage(days) {
  const violations = []
  days.forEach((d, i) => {
    const type = detectDayType(d.focus || d.day)
    if (type !== 'full' && type !== 'fullBody' && type !== 'unknown') return
    // Only check days that are labeled as full body
    const f = (d.focus || d.day || '').toLowerCase()
    if (!/full|كامل/i.test(f)) return

    const moves = d.exercises
      .filter(e => !e.name.includes('Cardio') && !e.name.includes('كارديو'))
      .map(e => e.mov || e.movementPattern || '')

    const hasPush = moves.some(m => /CHEST_COMPOUND|SHOULDER_COMPOUND|CHEST_ISOLATION|LATERAL_RAISE|TRICEPS/.test(m))
    const hasPull = moves.some(m => /VERTICAL_PULL|HORIZONTAL_PULL|BACK_ACCESSORY|REAR_DELT|BICEPS/.test(m))
    const hasLegs = moves.some(m => /SQUAT_PATTERN|HIP_HINGE|QUAD_ISOLATION|HAMSTRING|CALVES/.test(m))
    const hasCore = moves.some(m => m === 'ABS' || /core|abs/i.test(m))

    const missing = []
    if (!hasPush) missing.push('Push')
    if (!hasPull) missing.push('Pull')
    if (!hasLegs) missing.push('Legs')
    if (!hasCore) missing.push('Core')

    if (missing.length > 0) {
      violations.push({ day: i + 1, dayName: d.day || d.focus, missing })
    }
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
  const isAllFullBody = days.every(d => {
    const f = (d.focus || d.day || '').toLowerCase()
    return /full|كامل/i.test(f)
  })

  if (isAllFullBody) return 'fullBody'
  if (unique.includes('push') && unique.includes('pull') && unique.includes('legs')) {
    if (hasUpper || hasLower) return hasArms ? 'PPL + Upper/Lower + Arms' : 'PPL + Upper/Lower'
    return 'PPL'
  }
  if (hasUpper && hasLower) return 'upperLower'
  if (unique.includes('push') && unique.includes('pull') && !unique.includes('legs')) return 'upperLower'
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
const VOLUME_RANGES = VOLUME_LIMITS.perMuscleGrouped

function checkWeeklyMuscleVolume(days, level) {
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

  // Apply beginner cap to max (same cap used by VolumeBalancer)
  const capMax = level === 'beginner' ? 14 : Infinity

  const results = []
  for (const [muscle, sets] of Object.entries(grouped)) {
    const range = VOLUME_RANGES[muscle]
    if (range) {
      const effectiveMax = Math.min(range.max, capMax)
      const inRange = sets >= range.min && sets <= effectiveMax
      results.push({ muscle, sets, min: range.min, max: effectiveMax, inRange })
    }
  }
  return results
}

// ---------- 12. Arms Day Validation ----------
function checkArmsDay(days) {
  const violations = []
  days.forEach(d => {
    if (!/arms|arm|أذرع|ذراع/i.test(d.focus || '')) return
    let bicepsCount = 0
    let tricepsCount = 0
    let lateralRaiseCount = 0
    let rearDeltCount = 0
    const shoulderIsolationNames = []
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      const mov = e.movementPattern || e.mov || ''
      const n = e.name.toLowerCase()
      if (mov === 'BICEPS' || mov === 'Bicep Curl' || (/curl/i.test(n) && !/wrist/i.test(n))) bicepsCount++
      if (mov === 'TRICEPS' || mov === 'Triceps Extension' || /triceps|skull crusher|pushdown|extension/i.test(n)) tricepsCount++
      if (mov === 'LATERAL_RAISE' || /lateral raise|جانبي/i.test(n)) lateralRaiseCount++
      if (mov === 'REAR_DELT' || /rear delt/i.test(n)) rearDeltCount++
      if (mov === 'LATERAL_RAISE' || mov === 'REAR_DELT') {
        shoulderIsolationNames.push(e.name)
      }
    })
    if (bicepsCount < 2) violations.push(`Only ${bicepsCount} biceps (need ≥2)`)
    if (tricepsCount < 2) violations.push(`Only ${tricepsCount} triceps (need ≥2)`)
    if (lateralRaiseCount > 1) violations.push(`${lateralRaiseCount} lateral raises (max 1)`)
    if (rearDeltCount > 1) violations.push(`${rearDeltCount} rear delts (max 1)`)
    // Check duplicate shoulder isolation
    const seen = new Set()
    shoulderIsolationNames.forEach(name => {
      if (seen.has(name)) violations.push(`Duplicate shoulder isolation: ${name}`)
      seen.add(name)
    })
  })
  return { passed: violations.length === 0, violations }
}


