import { parseMaxRep, parseMinRest } from './exercise-selector.js'

function detectDayType(focus) {
  const f = (focus || '').toLowerCase()
  const pushKw = ['push', 'chest', 'shoulder', 'triceps', 'upper', 'دفع', 'صدر', 'كتف', 'تراي', 'أعلى']
  const pullKw = ['pull', 'back', 'biceps', 'rows', 'سحب', 'ظهر', 'باي']
  const legsKw = ['legs', 'squat', 'deadlift', 'lower', 'أرجل', 'سكوات', 'ديد', 'أسفل']

  const isPush = pushKw.some(k => f.includes(k))
  const isPull = pullKw.some(k => f.includes(k))
  const isLegs = legsKw.some(k => f.includes(k))

  if (isLegs) return 'legs'
  if (isPush) return 'push'
  if (isPull) return 'pull'
  return 'other'
}

export function validateWorkout(planOrDays, level) {
  const errors = []
  const days = Array.isArray(planOrDays) ? planOrDays : (planOrDays?.days || [])

  // 1. JSON completeness
  if (!days || days.length === 0) {
    errors.push('Plan has no days')
    return hardFailResult(errors, days)
  }

  days.forEach((day, i) => {
    const dayNum = i + 1
    const exs = day.exercises || []
    const realExs = exs.filter(e => e.name && !e.name.includes('Cardio') && !e.name.includes('كارديو'))

    // 2. Each day must have at least one real exercise
    if (realExs.length === 0) {
      errors.push(`Day ${dayNum}: has no real exercises (only cardio or empty)`)
    }

    // 3. No duplicate exercise within the same day
    const seen = new Set()
    realExs.forEach(e => {
      if (seen.has(e.name)) {
        errors.push(`Day ${dayNum}: duplicate exercise "${e.name}"`)
      }
      seen.add(e.name)
    })

    // 4. Squat Pattern required on Leg Day
    const type = detectDayType(day.focus || day.day)
    if (type === 'legs') {
      const hasSquat = realExs.some(e => e.mov === 'SQUAT_PATTERN')
      if (!hasSquat) {
        errors.push(`Day ${dayNum}: Leg day must include a Squat Pattern exercise`)
      }
    }

    // 5. Hip Hinge required on Leg Day
    if (type === 'legs') {
      const hasHinge = realExs.some(e => e.mov === 'HIP_HINGE')
      if (!hasHinge) {
        errors.push(`Day ${dayNum}: Leg day must include a Hip Hinge exercise`)
      }
    }

    // 6. Push Day: no Barbell Bench Press + Dumbbell Bench Press (unless incline)
    if (type === 'push') {
      const hasBarbellBench = realExs.some(e => {
        const n = e.name.toLowerCase()
        return /\bbench press\b/.test(n) && !/dumbbell|db/i.test(n) && !/incline|decline/i.test(n) && !/machine|smith/i.test(n)
      })
      const hasFlatDBBench = realExs.some(e => {
        const n = e.name.toLowerCase()
        return /dumbbell.*bench.*press/i.test(n) && !/incline|decline/i.test(n)
      })
      if (hasBarbellBench && hasFlatDBBench) {
        errors.push(`Day ${dayNum}: Push day cannot have both Barbell Bench Press and Dumbbell Bench Press (use Incline variant instead)`)
      }
    }
  })

  // 7. Recovery notes — log warning but don't hard-fail (Coach Score handles soft quality penalty)
  const muscleDayMap = {}
  days.forEach((day, di) => {
    (day.exercises || []).forEach(e => {
      if (e.name && !e.name.includes('Cardio') && !e.name.includes('كارديو')) {
        (e.primaryMuscles || []).forEach(m => {
          if (!muscleDayMap[m]) muscleDayMap[m] = []
          if (!muscleDayMap[m].includes(di)) muscleDayMap[m].push(di)
        })
      }
    })
  })
  for (const [muscle, dayIndices] of Object.entries(muscleDayMap)) {
    const sorted = [...dayIndices].sort((a, b) => a - b)
    for (let i = 0; i <= sorted.length - 3; i++) {
      if (sorted[i + 2] - sorted[i] <= 3) {
        console.log(`RECOVERY_NOTE: ${muscle} trained on days ${sorted.slice(i, i + 3).map(d => d + 1).join(', ')}, may be frequent — Coach Score will evaluate`)
        break
      }
    }
  }

  // 8. Upper day must include VERTICAL_PULL
  days.forEach((day, i) => {
    const dayNum = i + 1
    const f = (day.focus || day.day || '').toLowerCase()
    if (/upper|أعلى/.test(f)) {
      const hasVP = (day.exercises || []).some(e =>
        e.name && !e.name.includes('Cardio') && !e.name.includes('كارديو') && e.mov === 'VERTICAL_PULL'
      )
      if (!hasVP) {
        errors.push(`Day ${dayNum}: Upper day must include a Vertical Pull (VERTICAL_PULL) exercise`)
      }
    }
  })

  // 9. Exercise metadata — reject if any exercise has empty sets/reps/rest
  days.forEach((day, i) => {
    const dayNum = i + 1
    ;(day.exercises || []).forEach((e, ei) => {
      if (e.name && !e.name.includes('Cardio') && !e.name.includes('كارديو')) {
        const missing = []
        if (!e.sets || e.sets === '' || e.sets === '-') missing.push('sets')
        if (!e.reps || e.reps === '' || e.reps === '-') missing.push('reps')
        if (!e.rest || e.rest === '' || e.rest === '-') missing.push('rest')
        if (missing.length > 0) {
          const msg = `INVALID_EXERCISE_METADATA: Day ${dayNum}, "${e.name}" missing ${missing.join(', ')}`
          errors.push(msg)
          console.log(msg)
        }
      }
    })
  })

  // 10. Hard blocks: compound rep & rest limits (absolute, with level-aware limits)
  const isBeginner = level === 'beginner'
  days.forEach((day, i) => {
    const dayNum = i + 1
    ;(day.exercises || []).forEach(e => {
      if (e.name && (e.name.includes('Cardio') || e.name.includes('كارديو'))) return
      const n = e.name.toLowerCase()
      const type = e.type || 'compound'
      if (type !== 'compound') return

      const maxRep = parseMaxRep(e.reps)
      const minRest = parseMinRest(e.rest)

      if (/deadlift|رف ميت/.test(n) && maxRep > 10) {
        errors.push(`Day ${dayNum}: ${e.name} has ${e.reps} (max ${maxRep} reps), exceeds deadlift limit of 10`)
      }
      if (/(?:^|[^a-z])squat|قرفصاء|سكوات/.test(n) && !/leg press|ليج بريس/.test(n) && maxRep > 12) {
        errors.push(`Day ${dayNum}: ${e.name} has ${e.reps} (max ${maxRep} reps), exceeds squat limit of 12`)
      }
      if (/bench press|بنش/.test(n) && maxRep > 12) {
        errors.push(`Day ${dayNum}: ${e.name} has ${e.reps} (max ${maxRep} reps), exceeds bench press limit of 12`)
      }
      if (isBeginner) {
        if (/pull.?up|chin.?up|عقلة/.test(n) && maxRep > 10) {
          errors.push(`Day ${dayNum}: ${e.name} has ${e.reps} (max ${maxRep} reps), exceeds beginner pullup limit of 10`)
        }
        if (/row/.test(n) && !/dumbbell|دمبل/.test(n) && maxRep > 12) {
          errors.push(`Day ${dayNum}: ${e.name} has ${e.reps} (max ${maxRep} reps), exceeds beginner rows limit of 12`)
        }
      } else {
        if (/pull.?up|chin.?up|عقلة/.test(n) && maxRep > 12) {
          errors.push(`Day ${dayNum}: ${e.name} has ${e.reps} (max ${maxRep} reps), exceeds pullup limit of 12`)
        }
        if (/row/.test(n) && !/dumbbell|دمبل/.test(n) && maxRep > 15) {
          errors.push(`Day ${dayNum}: ${e.name} has ${e.reps} (max ${maxRep} reps), exceeds rows limit of 15`)
        }
      }

      if (minRest !== null && minRest < 60) {
        errors.push(`Day ${dayNum}: ${e.name} rest is ${e.rest} (min ${minRest}s), below minimum 60s for compound`)
      }
      if (/deadlift|رف ميت/.test(n) && minRest !== null && minRest < 120) {
        errors.push(`Day ${dayNum}: ${e.name} rest is ${e.rest} (min ${minRest}s), below minimum 120s for deadlift`)
      }
    })
  })

  // 11. Unknown exercise ratio — hard fail if > 50% unrecognized
  const allReal = []
  days.forEach(d => {
    ;(d.exercises || []).forEach(e => {
      if (e.name && !e.name.includes('Cardio') && !e.name.includes('كارديو')) allReal.push(e)
    })
  })
  const unknown = allReal.filter(e => !e.mov && !e.cat)
  if (allReal.length > 0 && unknown.length / allReal.length > 0.5) {
    errors.push(`Too many unrecognized exercises (${unknown.length}/${allReal.length} — exceeds 50%)`)
  }

  return buildResult(errors, days)
}

function hardFailResult(errors, days) {
  return buildResult(errors, days || [])
}

function buildResult(errors, days) {
  // Legacy duplicate report for backward compat
  const withinDayDupes = []
  const weeklyCount = {}
  days.forEach(d => {
    const daySeen = new Set()
    ;(d.exercises || []).forEach(e => {
      if (e.name && !e.name.includes('Cardio') && !e.name.includes('كارديو')) {
        if (daySeen.has(e.name)) withinDayDupes.push(e.name)
        daySeen.add(e.name)
        weeklyCount[e.name] = (weeklyCount[e.name] || 0) + 1
      }
    })
  })
  const weeklyOver2 = Object.entries(weeklyCount).filter(([_, c]) => c > 2).map(([n]) => n)

  return {
    pass: errors.length === 0,
    errors,
    // Backward compatibility (used by workout-generator.js retry loop + printDebugReport)
    allPassed: errors.length === 0,
    duplicates: {
      hasWithinDayDuplicates: withinDayDupes.length > 0,
      withinDayDuplicates: withinDayDupes,
      hasWeeklyOver2: weeklyOver2.length > 0,
      weeklyOver2,
    },
    squat: { found: true, count: 999 },
    hipHinge: { found: true, count: 999 },
    abs: { found: true, count: 999 },
    calves: { found: true, count: 999 },
    rearDelt: { found: true, count: 999 },
  }
}

export function printDebugReport(report, attempt, maxAttempts) {
  if (report.errors && report.errors.length > 0) {
    console.log(`=== HARD FAIL ERRORS (Attempt ${attempt}/${maxAttempts}) ===`)
    report.errors.forEach(e => console.log(`✗ ${e}`))
    console.log('=============================================')
  } else {
    console.log(`=== Attempt ${attempt}/${maxAttempts} ===`)
    console.log('✔ No hard fail errors')
    console.log('================================')
  }
}
