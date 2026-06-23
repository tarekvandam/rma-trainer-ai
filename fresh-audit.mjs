import { generateGymPlan } from './src/lib/workout-generator.js'

const LEVELS = ['beginner', 'intermediate', 'advanced']
const DAYS = [3, 4, 5, 6]
const GOALS = ['fat_loss', 'muscle_gain', 'strength', 'general', 'endurance']
const GYM_EQUIP = ['barbell', 'dumbbell', 'cable', 'gym_machine', 'pullup_bar', 'lat_pulldown', 'smith_machine', 'leg_press']
const HOME_EQUIP = ['none', 'resistance_bands', 'dumbbell']

function randomForm(level, days, goal) {
  const weight = 55 + Math.floor(Math.random() * 65)
  const height = 155 + Math.floor(Math.random() * 45)
  const age = 18 + Math.floor(Math.random() * 47)
  const lang = Math.random() < 0.7 ? 'en' : 'ar'
  const isGym = Math.random() < 0.7
  const trainingType = isGym ? 'gym' : 'home'
  const equipment = isGym ? GYM_EQUIP : HOME_EQUIP
  return { lang, weight, height, age, days, goal, level, trainingType, equipment }
}

const _origLog = console.log
console.log = () => {}

const profiles = []
for (let i = 0; i < 1000; i++) {
  const level = LEVELS[Math.floor(Math.random() * LEVELS.length)]
  const days = DAYS[Math.floor(Math.random() * DAYS.length)]
  const goal = GOALS[Math.floor(Math.random() * GOALS.length)]
  const form = randomForm(level, days, goal)
  let result
  try {
    result = generateGymPlan(form)
  } catch (e) {
    continue
  }
  profiles.push({
    planSource: result.planSource,
    level: form.level,
    days: form.days,
    goal: form.goal,
    trainingType: form.trainingType,
  })
}

console.log = _origLog

const total = profiles.length
const counts = {}
for (const p of profiles) {
  counts[p.planSource] = (counts[p.planSource] || 0) + 1
}

console.log('\n========== FRESH AUDIT (1000 profiles, using planSource directly) ==========')
console.log(`Total: ${total}\n`)
for (const cat of ['NORMAL', 'EMERGENCY', 'HARDCODED_EMERGENCY']) {
  const n = counts[cat] || 0
  console.log(`${cat.padEnd(25)}: ${n} (${(n/total*100).toFixed(1)}%)`)
}

const undef = counts['undefined'] || 0
if (undef > 0) console.log(`\n*** WARNING: ${undef} profiles have planSource === undefined ***`)
else console.log('\nplanSource === undefined: 0 (all clean)')

console.log('\n--- 10 random samples per category ---')
for (const cat of ['NORMAL', 'EMERGENCY', 'HARDCODED_EMERGENCY']) {
  const subset = profiles.filter(p => p.planSource === cat)
  const sample = subset.sort(() => Math.random() - 0.5).slice(0, 10)
  console.log(`\n${cat} (${subset.length} total):`)
  for (const p of sample) {
    console.log(`  ${p.level.padEnd(12)} ${p.days}d ${p.goal.padEnd(14)} ${p.trainingType.padEnd(5)}  ps=${p.planSource}`)
  }
}
