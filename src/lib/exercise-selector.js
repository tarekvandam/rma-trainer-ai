import { resolveDayTemplate } from './day-templates.js'

function sortCompoundFirst(candidates) {
  return candidates.sort((a, b) => {
    const order = { compound: 0, isolation: 2 }
    const aP = order[a.type] ?? 1
    const bP = order[b.type] ?? 1
    return aP - bP
  })
}

export function adjust(ex, goal) {
  let reps = ex.defReps
  let rest = ex.defRest
  if (goal === 'strength') { reps = '6-8'; rest = '2-3 د' }
  else if (goal === 'fat_loss') { reps = '15-20'; rest = '30-45 ث' }
  else if (goal === 'endurance') { reps = '18-25'; rest = '30-45 ث' }
  return {
    name: ex.name, sets: ex.defSets, reps, rest,
    cat: ex.cat, type: ex.type, mov: ex.mov,
    primaryMuscles: [...(ex.primaryMuscles || [])],
    secondaryMuscles: [...(ex.secondaryMuscles || [])],
    movementPattern: ex.movementPattern || ex.mov || '',
    equipSource: ex.equipSource || '',
  }
}

export function buildDayExercises(dayIndex, poolCopy, focusText, trainingType, goal, lang, globalUsedNames, retryAttempt = 0) {
  const count = goal === 'strength' ? 4 : 5

  const template = resolveDayTemplate(focusText, lang, trainingType)
  console.log("GENERATOR_VERSION", "ExerciseSelector")
  console.log("SPLIT_SELECTED", "unknown")
  console.log("DAY_TEMPLATE", dayIndex, template)
  const structure = template.structure
  const selected = []

  for (let s = 0; s < structure.length; s++) {
    const slot = structure[s]
    let candidates

    if (slot === 'CHEST_OR_SHOULDER') {
      candidates = poolCopy.filter(ex =>
        !globalUsedNames.has(ex.name) &&
        (ex.mov === 'CHEST_COMPOUND' || ex.mov === 'SHOULDER_COMPOUND')
      )
    } else {
      candidates = poolCopy.filter(ex =>
        !globalUsedNames.has(ex.name) &&
        ex.mov === slot
      )
    }

    if (candidates.length === 0) {
      const alreadyUsed = new Set(selected.map(e => e.name))
      if (slot === 'CHEST_OR_SHOULDER') {
        candidates = poolCopy.filter(ex =>
          !alreadyUsed.has(ex.name) &&
          (ex.mov === 'CHEST_COMPOUND' || ex.mov === 'SHOULDER_COMPOUND')
        )
      } else {
        candidates = poolCopy.filter(ex =>
          !alreadyUsed.has(ex.name) &&
          ex.mov === slot
        )
      }
    }

    // Sort by priority: compound before isolation
    if (candidates.length > 1) {
      sortCompoundFirst(candidates)
    }

    const pick = candidates.length > 0
      ? candidates[(dayIndex * 17 + s * 13) % candidates.length]
      : null

    if (pick) {
      selected.push(adjust(pick, goal))
      globalUsedNames.add(pick.name)
    }
  }

  if (selected.length >= 4) return selected

  const available = poolCopy.filter(ex => !globalUsedNames.has(ex.name))
  const src = available.length >= count ? available : poolCopy
  const start = (dayIndex * 2) % src.length
  const fallback = []
  for (let i = 0; i < count; i++) {
    const idx = (start + i) % src.length
    const ex = src[idx]
    fallback.push(adjust(ex, goal))
    globalUsedNames.add(ex.name)
  }
  return fallback
}
