import { resolveDayTemplate } from './day-templates.js'

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

export function buildDayExercises(dayIndex, poolCopy, focusText, trainingType, goal, lang, globalUsedNames) {
  const count = goal === 'strength' ? 4 : 5

  if (trainingType === 'gym') {
    const template = resolveDayTemplate(focusText, lang)
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

      const pick = candidates.length > 0
        ? candidates[(dayIndex * 3 + s * 7) % candidates.length]
        : null

      if (pick) {
        selected.push(adjust(pick, goal))
        globalUsedNames.add(pick.name)
      }
    }

    if (selected.length >= 4) return selected
  }

  const available = poolCopy.filter(ex => !globalUsedNames.has(ex.name))
  const src = available.length >= count ? available : poolCopy
  const start = (dayIndex * 2) % src.length
  const selected = []
  for (let i = 0; i < count; i++) {
    const idx = (start + i) % src.length
    const ex = src[idx]
    selected.push(adjust(ex, goal))
    globalUsedNames.add(ex.name)
  }
  return selected
}
