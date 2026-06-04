import { resolveDayTemplate } from './day-templates.js'

function sortCompoundFirst(candidates) {
  return candidates.sort((a, b) => {
    const order = { compound: 0, isolation: 2 }
    const aP = order[a.type] ?? 1
    const bP = order[b.type] ?? 1
    return aP - bP
  })
}

export function sortByTier(candidates) {
  return candidates.sort((a, b) => {
    const order = { S: 0, A: 1, B: 2 }
    const aT = order[a.tier] ?? 2
    const bT = order[b.tier] ?? 2
    return aT - bT
  })
}

export function parseMaxRep(repsStr) {
  if (!repsStr || typeof repsStr !== 'string') return 0
  const parts = repsStr.split('-').map(s => parseInt(s.trim()))
  if (parts.length >= 2) return Math.max(...parts.filter(n => !isNaN(n)))
  return parseInt(parts[0]) || 0
}

export function capMaxReps(rangeStr, max) {
  const parts = rangeStr.split('-').map(s => parseInt(s.trim()))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    if (parts[1] > max) return `${Math.min(parts[0], max)}-${max}`
  }
  return rangeStr
}

export function parseMinRest(restStr) {
  if (!restStr || typeof restStr !== 'string') return null
  const parts = restStr.split('-').map(s => parseInt(s.trim()))
  if (parts.length >= 2) return Math.min(...parts.filter(n => !isNaN(n)))
  if (parts.length === 1) return parseInt(parts[0]) || null
  return null
}

export function getCategory(ex) {
  const mov = ex.mov || ''
  if (mov === 'CALVES') return 'CALVES'
  if (mov === 'ABS' || /(core|abs)/i.test(mov) || /(core|abs)/i.test(ex.name || '')) return 'ABS'
  if (ex.type === 'isolation' || /^(CHEST_ISOLATION|LATERAL_RAISE|TRICEPS|BICEPS|REAR_DELT|QUAD_ISOLATION|HAMSTRING|GLUTE_ISOLATION)$/.test(mov)) return 'ISOLATION'
  if (/^(SQUAT_PATTERN|HIP_HINGE)$/.test(mov)) return 'COMPOUND_LOWER'
  return 'COMPOUND_UPPER'
}

export function PrescriptionEngine(ex, level, goal) {
  const cat = getCategory(ex)
  const n = ex.name.toLowerCase()
  const isBeginner = level === 'beginner'
  const isIntermediate = level === 'intermediate'
  const isAdvanced = level === 'advanced'
  const isStrength = goal === 'strength'

  let reps, sets, rest

  if (isBeginner) {
    switch (cat) {
      case 'COMPOUND_UPPER':
        reps = '8-12'; sets = '3'; rest = '60-90 ث'
        break
      case 'COMPOUND_LOWER':
        reps = '8-10'; sets = '3'; rest = '90-120 ث'
        break
      case 'ISOLATION':
        reps = '10-15'; sets = '2'; rest = '30-60 ث'
        break
      case 'ABS':
        reps = '12-20'; sets = '3'; rest = '30 ث'
        break
      case 'CALVES':
        reps = '12-20'; sets = '3'; rest = '30-45 ث'
        break
    }
  } else if (isIntermediate) {
    switch (cat) {
      case 'COMPOUND_UPPER':
        reps = '6-10'; sets = '4'; rest = '90-180 ث'
        break
      case 'COMPOUND_LOWER':
        reps = '6-10'; sets = '4'; rest = '90-180 ث'
        break
      case 'ISOLATION':
        reps = '10-15'; sets = '3-4'; rest = '30-60 ث'
        break
      case 'ABS':
        reps = '12-20'; sets = '3-4'; rest = '30-45 ث'
        break
      case 'CALVES':
        reps = '12-20'; sets = '3-4'; rest = '30-45 ث'
        break
    }
  } else if (isAdvanced) {
    if (isStrength) {
      switch (cat) {
        case 'COMPOUND_UPPER':
          reps = '3-6'; sets = '4-5'; rest = '120-180 ث'
          break
        case 'COMPOUND_LOWER':
          reps = '3-6'; sets = '4-5'; rest = '120-180 ث'
          break
        case 'ISOLATION':
          reps = '8-15'; sets = '3-4'; rest = '30-60 ث'
          break
        case 'ABS':
          reps = '8-15'; sets = '3-4'; rest = '30-45 ث'
          break
        case 'CALVES':
          reps = '8-15'; sets = '3-4'; rest = '30-45 ث'
          break
      }
    } else {
      switch (cat) {
        case 'COMPOUND_UPPER':
          reps = '6-12'; sets = '3-4'; rest = '90-180 ث'
          break
        case 'COMPOUND_LOWER':
          reps = '6-12'; sets = '3-4'; rest = '90-180 ث'
          break
        case 'ISOLATION':
          reps = '8-15'; sets = '3-4'; rest = '30-60 ث'
          break
        case 'ABS':
          reps = '8-15'; sets = '3-4'; rest = '30-45 ث'
          break
        case 'CALVES':
          reps = '8-15'; sets = '3-4'; rest = '30-45 ث'
          break
      }
    }
  }

  if (cat === 'COMPOUND_UPPER' || cat === 'COMPOUND_LOWER') {
    const maxRep = parseMaxRep(reps)
    if (/deadlift|رف ميت/.test(n) && maxRep > 10) reps = capMaxReps(reps, 10)
    if (/(?:^|[^a-z])squat|قرفصاء|سكوات/.test(n) && !/leg press|ليج بريس/.test(n) && maxRep > 12) reps = capMaxReps(reps, 12)
    if (/bench press|بنش/.test(n) && maxRep > 12) reps = capMaxReps(reps, 12)
    if (maxRep > 15) reps = capMaxReps(reps, 15)
    if (isBeginner) {
      if (/pull.?up|chin.?up|عقلة/.test(n) && maxRep > 8) reps = capMaxReps(reps, 8)
    } else {
      if (/pull.?up|chin.?up|عقلة/.test(n) && maxRep > 12) reps = capMaxReps(reps, 12)
    }
    if (/row/.test(n) && !/dumbbell|دمبل/.test(n) && maxRep > 12) reps = capMaxReps(reps, 12)
    // Deadlift minimum rest 120s
    if (/deadlift|رف ميت/.test(n)) {
      const parsed = rest.match(/^(\d+)-(\d+)\s*(.*)$/)
      if (parsed) {
        const min = parseInt(parsed[1])
        const max = parseInt(parsed[2])
        const suffix = parsed[3]
        if (min < 120) {
          const newMax = Math.max(max, 120)
          rest = newMax === 120 ? `120${suffix ? ' ' + suffix : ''}` : `120-${newMax}${suffix ? ' ' + suffix : ''}`
        }
      }
    }
  }

  if (reps === undefined || reps === null || reps === '') throw new Error('QC_HARD_FAIL: reps is undefined for ' + (ex.name || 'unknown'))
  if (sets === undefined || sets === null || sets === '') throw new Error('QC_HARD_FAIL: sets is undefined for ' + (ex.name || 'unknown'))
  if (rest === undefined || rest === null || rest === '') throw new Error('QC_HARD_FAIL: rest is undefined for ' + (ex.name || 'unknown'))
  if (/^\d+-\d+$/.test(reps) && parseMaxRep(reps) > 20) throw new Error('QC_HARD_FAIL: reps exceed 20 max for ' + (ex.name || 'unknown'))
  if (!rest.includes('ث')) throw new Error('QC_HARD_FAIL: rest missing Arabic unit for ' + (ex.name || 'unknown'))

  // Resolve set ranges before return
  if (sets && typeof sets === 'string' && sets.includes('-')) {
    const parts = sets.split('-').map(s => parseInt(s.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      sets = String(parts[0])
    }
  }

  return { reps, sets, rest }
}

export function adjust(ex, goal, level) {
  const { reps, sets, rest } = PrescriptionEngine(ex, level, goal)
  const cat = getCategory(ex)
  const type = ex.type || 'compound'
  const repSource = type === 'compound' ? 'compound_engine' : 'isolation_engine'

  return {
    name: ex.name, sets, reps, rest,
    repSource,
    cat: ex.cat, type: ex.type, mov: ex.mov,
    category: cat,
    primaryMuscles: [...(ex.primaryMuscles || [])],
    secondaryMuscles: [...(ex.secondaryMuscles || [])],
    movementPattern: ex.movementPattern || ex.mov || '',
    equipSource: ex.equipSource || '',
    tier: ex.tier || 'B',
  }
}

export function buildDayExercises(dayIndex, poolCopy, focusText, trainingType, goal, lang, globalUsedNames, retryAttempt = 0, level = 'beginner') {
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

    if (candidates.length > 1) {
      sortCompoundFirst(candidates)
      sortByTier(candidates)
    }

    const pick = candidates.length > 0
      ? candidates[(dayIndex * 17 + s * 13) % candidates.length]
      : null

    if (pick) {
      selected.push(adjust(pick, goal, level))
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
    fallback.push(adjust(ex, goal, level))
    globalUsedNames.add(ex.name)
  }
  return fallback
}
