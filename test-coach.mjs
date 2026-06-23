import { generateGymPlan } from './src/lib/workout-generator.js'

function assert(condition, msg) {
  if (!condition) { console.error('  FAIL:', msg); process.exitCode = 1 }
  else console.log('  PASS:', msg)
}

function config(days, level, goal, trainingType, equipment) {
  return { lang: 'en', weight: 80, height: 175, age: 25, days, goal, level, trainingType, equipment }
}

const fullGym = ['barbell', 'dumbbell', 'cable', 'gym_machine', 'pullup_bar', 'lat_pulldown']
const homeEquip = ['dumbbell', 'resistance_band']

console.log('\n===== COMPREHENSIVE TEST SUITE =====\n')

let passed = 0
let failed = 0
const scenarios = []

function runScenario(name, genFn, checks) {
  console.log(`\n--- ${name} ---`)
  try {
    const result = genFn()
    checks(result)
    passed++
  } catch (e) {
    console.error(`  FAIL: ${e.message}`)
    process.exitCode = 1
    failed++
  }
}

function checkQC(r) {
  assert(r._qc && r._qc.total >= 95, `QC Score >= 95 (got ${r._qc?.total})`)
}
function checkCoach(r) {
  assert(r._qc && r._qc.coachScore && r._qc.coachScore.total >= 90, `Coach Score >= 90 (got ${r._qc?.coachScore?.total})`)
}
function checkDays(n) {
  return (r) => assert(r.days && r.days.length === n, `Has ${n} days`)
}

// ===== SCENARIO 1: Gym Beginner =====
runScenario('Gym Beginner (3-day full body, general)', () => generateGymPlan(config(3, 'beginner', 'general', 'gym', fullGym)), (r) => {
  checkDays(3)(r)
  checkQC(r)
  checkCoach(r)
  checkNutrition(r, 80)
})

// ===== SCENARIO 2: Gym Intermediate =====
runScenario('Gym Intermediate (4-day upper/lower, general)', () => generateGymPlan(config(4, 'intermediate', 'general', 'gym', fullGym)), (r) => {
  checkDays(4)(r)
  checkQC(r)
  checkCoach(r)
})

// ===== SCENARIO 3: Gym Advanced =====
runScenario('Gym Advanced (5-day PPL+Upper/Lower, strength)', () => generateGymPlan(config(5, 'advanced', 'strength', 'gym', fullGym)), (r) => {
  checkDays(5)(r)
  checkQC(r)
  checkCoach(r)
  // Check advanced athlete limits
  r.days.forEach(d => {
    d.exercises.forEach(e => {
      if (/deadlift|رف ميت/.test(e.name) && e.reps) {
        const maxRep = e.reps.includes('-') ? parseInt(e.reps.split('-')[1]) : 0
        assert(maxRep <= 10, `Deadlift max rep ≤10: got ${e.reps} in "${e.name}"`)
      }
      if (/back squat|front squat|hack squat|سكوات/.test(e.name) && e.reps && !/leg press|ليج بريس/.test(e.name)) {
        const maxRep = e.reps.includes('-') ? parseInt(e.reps.split('-')[1]) : 0
        assert(maxRep <= 12, `Squat max rep ≤12: got ${e.reps} in "${e.name}"`)
      }
    })
  })
})

// ===== SCENARIO 4: Home Beginner =====
runScenario('Home Beginner (3-day full body, general)', () => generateGymPlan(config(3, 'beginner', 'general', 'home', homeEquip)), (r) => {
  checkDays(3)(r)
  assert(r._qc && r._qc.total >= 90, `QC Score >= 90 (got ${r._qc?.total})`)
  checkCoach(r)
})

// ===== SCENARIO 5: Home Intermediate =====
runScenario('Home Intermediate (4-day full body, general)', () => generateGymPlan(config(4, 'intermediate', 'general', 'home', homeEquip)), (r) => {
  checkDays(4)(r)
  assert(r._qc && r._qc.total >= 90, `QC Score >= 90 (got ${r._qc?.total})`)
  checkCoach(r)
})

// ===== SCENARIO 6: Home Advanced =====
runScenario('Home Advanced (4-day full body, strength)', () => generateGymPlan(config(4, 'advanced', 'strength', 'home', homeEquip)), (r) => {
  checkDays(4)(r)
  assert(r._qc && r._qc.total >= 90, `QC Score >= 90 (got ${r._qc?.total})`)
  checkCoach(r)
  r.days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.tier === 'S' && e.reps) {
        const maxRep = e.reps.includes('-') ? parseInt(e.reps.split('-')[1]) : 0
        assert(maxRep <= 8, `S-tier exercise max rep ≤8 (advanced): got ${e.reps} in "${e.name}"`)
      }
    })
  })
})

// ===== SCENARIO 7: MMA Beginner =====
runScenario('MMA Beginner (3-day full body, general)', () => generateGymPlan(config(3, 'beginner', 'general', 'mma', homeEquip)), (r) => {
  checkDays(3)(r)
  assert(r._qc && r._qc.total >= 90, `QC Score >= 90 (got ${r._qc?.total})`)
  checkCoach(r)
  // Check Full Body has exercises (metadata already stripped, check names)
  r.days.forEach(d => {
    const hasEx = d.exercises.some(e => !e.name.includes('Cardio') && !e.name.includes('كارديو'))
    assert(hasEx, `Day "${d.focus}" has exercises`)
  })
})

// ===== SCENARIO 8: MMA Intermediate =====
runScenario('MMA Intermediate (4-day full body, general)', () => generateGymPlan(config(4, 'intermediate', 'general', 'mma', homeEquip)), (r) => {
  checkDays(4)(r)
  assert(r._qc && r._qc.total >= 90, `QC Score >= 90 (got ${r._qc?.total})`)
  checkCoach(r)
})

// ===== SCENARIO 9: MMA Advanced =====
runScenario('MMA Advanced (5-day full body, strength)', () => generateGymPlan(config(5, 'advanced', 'strength', 'mma', homeEquip)), (r) => {
  checkDays(5)(r)
  assert(r._qc && r._qc.total >= 90, `QC Score >= 90 (got ${r._qc?.total})`)
  checkCoach(r)
})

// ===== SCENARIO 10: Upper Day VERTICAL_PULL =====
runScenario('Upper Day VERTICAL_PULL check', () => generateGymPlan(config(4, 'advanced', 'general', 'gym', fullGym)), (r) => {
  checkQC(r)
  checkCoach(r)
  const upperDays = r.days.filter(d => /upper|أعلى/i.test(d.focus))
  upperDays.forEach((d, i) => {
    const hasVP = d.exercises.some(e => !e.name.includes('Cardio') && !e.name.includes('كارديو') && /lat.?pulldown|pull.?up|chin.?up|v.?grip/i.test(e.name))
    assert(hasVP, `Upper day ${i+1} has VERTICAL_PULL (lat pulldown/pull-up/chin-up/v-grip)`)
  })
})

// ===== SCENARIO 11: Progression System =====
const rProg = generateGymPlan(config(3, 'beginner', 'general', 'gym', fullGym))
runScenario('Progression System check', () => rProg, (r) => {
  assert(r.progressiveOverload && r.progressiveOverload.week1, 'Plan has progressiveOverload')
  assert(r.progressiveOverload.week4, 'Plan has week 4 progression')
})

// ===== SCENARIO 12: Arms Day (Advanced) =====
runScenario('Arms Day check (6-day PPL+Upper/Lower+Arms, advanced)', () => generateGymPlan(config(6, 'advanced', 'general', 'gym', fullGym)), (r) => {
  checkDays(6)(r)
  assert(r._qc && r._qc.total >= 90, `QC Score >= 90 (got ${r._qc?.total})`)
  if (r._qc?.coachScore) console.log(`  Coach Score: ${r._qc.coachScore.total}/100`)
  const armsDay = r.days.find(d => /arms|arm/i.test(d.focus))
  assert(armsDay, 'Has Arms Day')
  checkArmsDayRules(armsDay)
})

// ===== SCENARIO 17: Arms Day (Intermediate) =====
runScenario('Arms Day check (6-day PPL+Upper/Lower+Arms, intermediate)', () => generateGymPlan(config(6, 'intermediate', 'general', 'gym', fullGym)), (r) => {
  checkDays(6)(r)
  assert(r._qc && r._qc.total >= 90, `QC Score >= 90 (got ${r._qc?.total})`)
  const armsDay = r.days.find(d => /arms|arm/i.test(d.focus))
  assert(armsDay, 'Has Arms Day')
  checkArmsDayRules(armsDay)
})

function checkArmsDayRules(armsDay) {
  const names = armsDay.exercises.map(e => e.name)
  console.log(`  Arms Day exercises:`, names.slice(0, -1).join(', '))
  // No shoulder press machine on arms day
  assert(!names.some(n => /shoulder press machine/i.test(n)), 'Arms Day has no Shoulder Press Machine')
  // No duplicates overall
  assert(new Set(names).size === names.length, 'Arms Day has no duplicate exercises')

  // Count true biceps (exclude wrist curls/reverse wrist curls/grip)
  let biceps = 0, triceps = 0, lateralRaise = 0, rearDelt = 0
  const shoulderIsolationNames = []
  armsDay.exercises.forEach(e => {
    if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
    const n = e.name.toLowerCase()
    const mov = e.movementPattern || e.mov || ''
    // True biceps: mov === BICEPS, not wrist-related
    if ((mov === 'BICEPS' || mov === 'Bicep Curl' || (/curl/i.test(n) && !/wrist/i.test(n))) && !/wrist|grip/i.test(n)) biceps++
    // True triceps
    if (mov === 'TRICEPS' || mov === 'Triceps Extension' || /triceps|skull crusher|pushdown|extension/i.test(n)) triceps++
    // Lateral raise
    if (mov === 'LATERAL_RAISE' || /lateral raise|جانبي/i.test(n)) lateralRaise++
    // Rear delt
    if (mov === 'REAR_DELT' || /rear delt/i.test(n)) rearDelt++
    // Track shoulder isolations for duplicate check
    if (mov === 'LATERAL_RAISE' || mov === 'REAR_DELT') shoulderIsolationNames.push(e.name)
  })
  assert(biceps >= 2, `Arms Day has >=2 true biceps exercises (got ${biceps})`)
  assert(triceps >= 2, `Arms Day has >=2 true triceps exercises (got ${triceps})`)
  assert(lateralRaise <= 1, `Arms Day has ≤1 lateral raise (got ${lateralRaise})`)
  assert(rearDelt <= 1, `Arms Day has ≤1 rear delt (got ${rearDelt})`)
  // No duplicate shoulder isolation
  assert(new Set(shoulderIsolationNames).size === shoulderIsolationNames.length, 'Arms Day has no duplicate shoulder isolation exercises')
}

// ===== SCENARIO 13: Strength Plan =====
const rStrength = generateGymPlan(config(4, 'advanced', 'strength', 'gym', fullGym))
runScenario('Strength plan (4-day upper/lower, strength)', () => rStrength, (r) => {
  checkDays(4)(r)
  checkQC(r)
  checkCoach(r)
  r.days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.tier === 'S' && e.reps) {
        const maxRep = e.reps.includes('-') ? parseInt(e.reps.split('-')[1]) : 0
        assert(maxRep <= 8, `S-tier exercise max rep ≤8 (advanced): got ${e.reps} in "${e.name}"`)
      }
    })
  })
})

function checkNutrition(r, w) {
  const bmr = parseInt(r.bmr)
  const cals = parseInt(r.dailyCalories)
  const protein = parseInt(r.protein)
  assert(!isNaN(bmr) && !isNaN(cals) && !isNaN(protein), `Nutrition values valid (cals=${r.dailyCalories}, protein=${r.protein})`)
  assert(cals >= bmr, `Calories (${cals}) >= BMR (${bmr})`)
  assert(protein <= Math.round(w * 2.2), `Protein (${protein}g) <= 2.2×${w} = ${Math.round(w * 2.2)}g`)
}

function checkFatLossReps(r, level) {
  const isBeginner = level === 'beginner'
  const pullupLimit = isBeginner ? 8 : 12
  r.days.forEach(d => {
    d.exercises.forEach(e => {
      if (e.name.includes('Cardio') || e.name.includes('كارديو')) return
      const maxRep = e.reps && e.reps.includes('-') ? parseInt(e.reps.split('-')[1]) : 0
      if (maxRep === 0) return
      const n = e.name.toLowerCase()
      if (/deadlift|رف ميت/.test(n)) assert(maxRep <= 10, `Deadlift max rep ≤10: got ${e.reps} in "${e.name}"`)
      if (/(?:^|[^a-z])squat|قرفصاء|سكوات/.test(n) && !/leg press|ليج بريس/.test(n)) assert(maxRep <= 12, `Squat max rep ≤12: got ${e.reps} in "${e.name}"`)
      if (/bench press|بنش/.test(n)) assert(maxRep <= 12, `Bench max rep ≤12: got ${e.reps} in "${e.name}"`)
      if (/pull.?up|chin.?up|عقلة/.test(n)) assert(maxRep <= pullupLimit, `Pullup max rep ≤${pullupLimit}: got ${e.reps} in "${e.name}"`)
      if (/row/.test(n) && !/dumbbell|دمبل/.test(n)) assert(maxRep <= 12, `Rows max rep ≤12: got ${e.reps} in "${e.name}"`)
      const isKnownCompound = /deadlift|squat|bench|row|pull.?up|chin.?up|overhead press|shoulder press|dip/i.test(n)
      if (isKnownCompound) {
        const restMin = parseInt(e.rest) || 0
        if (restMin > 0 && restMin < 60) assert(false, `Compound rest below 60s: ${e.rest} in "${e.name}"`)
      }
    })
  })
}

// ===== SCENARIO 14: Fat Loss (Intermediate) =====
runScenario('Fat Loss (4-day upper/lower, fat_loss, intermediate)', () => generateGymPlan(config(4, 'intermediate', 'fat_loss', 'gym', fullGym)), (r) => {
  checkDays(4)(r)
  checkQC(r)
  checkCoach(r)
  checkNutrition(r, 80)
  checkFatLossReps(r, 'intermediate')
})

// ===== SCENARIO 15: Fat Loss (Beginner) =====
runScenario('Fat Loss (3-day full body, fat_loss, beginner)', () => generateGymPlan(config(3, 'beginner', 'fat_loss', 'gym', fullGym)), (r) => {
  checkDays(3)(r)
  assert(r._qc && r._qc.total >= 95, `QC Score >= 95 (got ${r._qc?.total})`)
  checkCoach(r)
  checkNutrition(r, 80)
  checkFatLossReps(r, 'beginner')
})

// ===== SCENARIO 16: Fat Loss (Advanced) =====
runScenario('Fat Loss (5-day PPL+Upper/Lower, fat_loss, advanced)', () => generateGymPlan(config(5, 'advanced', 'fat_loss', 'gym', fullGym)), (r) => {
  checkDays(5)(r)
  assert(r._qc && r._qc.total >= 95, `QC Score >= 95 (got ${r._qc?.total})`)
  checkCoach(r)
  checkNutrition(r, 80)
  checkFatLossReps(r, 'advanced')
})

// ===== SUMMARY =====
const now = new Date()
console.log(`\n========================================`)
console.log(`Total Scenarios Tested: ${passed + failed}`)
console.log(`Passed: ${passed}, Failed: ${failed}`)
if (process.exitCode) console.log('STATUS: FAILED')
else console.log('STATUS: ALL PASSED ✓')
console.log(`Time: ${now.toISOString()}`)
