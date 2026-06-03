import { getExercisePools, getMovement, enrichExercise, generateDayTitle } from './exercise-db.js'

function infer(name) {
  const n = name.toLowerCase().trim()
  let cat = 'push'
  let type = 'compound'

  if (/curl|fly|raise|pushdown|extension|crusher|crunch|kickback|lateral|isolation/.test(n)) {
    type = 'isolation'
  }

  if (/bench|press|chest|tricep|shoulder|pec|dip|thruster/.test(n) && !/leg/.test(n) && !/row|curl/.test(n)) {
    cat = 'push'
  } else if (/row|pull[^-]|lat|pulldown|face.?pull/.test(n) || (/(^|[ -])curl/.test(n))) {
    cat = 'pull'
  } else if (/squat|deadlift|rdl|romanian|leg.?press|lunge|step.?up|calf|hamstring|quad|glute|hack|exten/.test(n)) {
    cat = 'legs'
  } else if (/crunch|plank|raise|twist|ab|core|sit.?up/.test(n)) {
    cat = 'core'
  }

  return { name, cat, type }
}

export function normalizeAIWorkout(plan, lang = 'en') {
  const pools = getExercisePools(lang)
  const allKeys = Object.keys(pools)

  const nameMap = new Map()
  const equipMap = new Map()

  allKeys.forEach(eq => {
    ;(pools[eq] || []).forEach(ex => {
      const key = ex.name.toLowerCase().trim()
      if (!nameMap.has(key)) {
        nameMap.set(key, ex)
        equipMap.set(key, eq)
      }
    })
  })

  const unknownExercises = []
  let recognized = 0
  let inferred = 0
  let unknown = 0
  const dayData = plan.days || []

  dayData.forEach(day => {
    const dayLabel = day.day || day.focus || ''
    ;(day.exercises || []).forEach(ex => {
      if (!ex.name || ex.name.includes('Cardio') || ex.name.includes('كارديو')) return

      const key = ex.name.toLowerCase().trim()
      const match = nameMap.get(key)

      if (match) {
        ex.cat = match.cat
        ex.type = match.type
        ex.mov = match.mov || getMovement(match)
        const enriched = enrichExercise(match)
        ex.primaryMuscles = [...(match.primaryMuscles || enriched.primaryMuscles || [])]
        ex.secondaryMuscles = [...(match.secondaryMuscles || enriched.secondaryMuscles || [])]
        ex.movementPattern = match.movementPattern || enriched.movementPattern || ex.mov
        ex.equipSource = equipMap.get(key) || ''
        recognized++
      } else {
        const guessed = infer(ex.name)
        ex.cat = guessed.cat
        ex.type = guessed.type
        ex.mov = getMovement(guessed)
        const enriched = enrichExercise({ ...guessed, mov: ex.mov })
        ex.primaryMuscles = [...(enriched.primaryMuscles || [])]
        ex.secondaryMuscles = [...(enriched.secondaryMuscles || [])]
        ex.movementPattern = enriched.movementPattern || ex.mov
        ex.equipSource = 'unknown'
        inferred++
      }
    })
  })

  // Regenerate day titles from actual exercises
  dayData.forEach(day => {
    const title = generateDayTitle(day, lang)
    if (day.day) {
      const prefix = day.day.match(/^(?:Day \d+|اليوم \S+)\s*—\s*/)?.[0] || ''
      day.day = prefix + title
    }
    day.focus = title
  })

  console.log(`Exercises Recognized (DB): ${recognized}`)
  console.log(`Exercises Inferred (name): ${inferred}`)
  console.log(`Exercises Unknown: ${unknown}`)

  return { unknownExercises, recognized, inferred, unknown }
}
