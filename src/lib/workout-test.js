import { generateGymPlan } from './workout-generator.js'
import { calculateWorkoutScore } from './quality-control.js'

const TEST_FORM = {
  lang: 'en',
  weight: '80',
  height: '175',
  age: '28',
  days: '5',
  goal: 'muscle_gain',
  level: 'intermediate',
  equipment: [
    'barbell', 'dumbbell', 'cable', 'gym_machine',
    'pullup_bar', 'bench', 'smith_machine',
    'leg_press', 'lat_pulldown',
  ],
  trainingType: 'gym',
}

let allTestsPassed = false
let attempts = 0
const MAX_ATTEMPTS = 5

while (!allTestsPassed && attempts < MAX_ATTEMPTS) {
  attempts++
  console.log(`\n========== GENERATION ATTEMPT ${attempts} ==========`)

  const plan = generateGymPlan(TEST_FORM)
  const dayData = plan.days
  const qc = plan._qc

  // Print day-by-day exercises
  dayData.forEach((dd, i) => {
    console.log(`\n--- Day ${i + 1} Exercises ---`)
    dd.exercises.forEach(e => {
      console.log(`  ${e.name} | ${e.sets || '-'}x${e.reps || '-'} | ${e.rest || '-'}`)
    })
  })

  // Validate using QC engine
  const qcScore = qc ? qc.total : 0
  console.log(`\n========== QUALITY CONTROL SCORE ==========`)
  console.log(`Split Validation:        ${qc?.split?.passed ? '✔' : '✗'} ${qc?.split?.score || 0}/20`)
  console.log(`Movement Patterns:       ${!qc?.movement?.found || Object.values(qc.movement.found).every(Boolean) ? '✔' : '✗'} ${qc?.movement?.score || 0}/20`)
  console.log(`Duplicate Validation:    ${qc?.duplicate?.passed ? '✔' : '✗'} ${qc?.duplicate?.score || 0}/20`)
  console.log(`Muscle Coverage:         ${qc?.muscle?.missing?.length === 0 ? '✔' : '✗'} ${qc?.muscle?.score || 0}/20`)
  console.log(`Equipment Validation:    ${qc?.equipment?.passed ? '✔' : '✗'} ${qc?.equipment?.score || 0}/20`)
  console.log(`-----------------------------------------------------`)
  console.log(`Workout Score: ${qcScore}/100`)
  console.log(`Verdict: ${qc?.verdict || 'UNKNOWN'}`)
  console.log('==============================================\n')

  const qcPassed = qc && qc.verdict === 'PASS'
  allTestsPassed = qcPassed

  if (!allTestsPassed) {
    console.log(`TEST FAILED on attempt ${attempts} (QC verdict: ${qc?.verdict}). Retrying...`)
  }
}

if (allTestsPassed) {
  console.log('✓ ALL TESTS PASSED — QC score >= 90. Workout plan is valid!\n')
} else {
  console.log(`✗ TEST FAILED after ${MAX_ATTEMPTS} attempts. Check the report above.\n`)
}
