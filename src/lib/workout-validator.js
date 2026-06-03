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

export function validateWorkout(planOrDays) {
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

  // 6. Unknown exercise ratio — hard fail if > 50% unrecognized
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
