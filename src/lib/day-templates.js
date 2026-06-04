export const PUSH_DAY = ['CHEST_COMPOUND', 'CHEST_COMPOUND', 'SHOULDER_COMPOUND', 'CHEST_ISOLATION', 'LATERAL_RAISE', 'TRICEPS']
export const PULL_DAY = ['VERTICAL_PULL', 'HORIZONTAL_PULL', 'BACK_ACCESSORY', 'REAR_DELT', 'BICEPS', 'BICEPS']
export const LEG_DAY = ['SQUAT_PATTERN', 'HIP_HINGE', 'QUAD_ISOLATION', 'HAMSTRING', 'CALVES', 'ABS']
export const UPPER_DAY = ['CHEST_COMPOUND', 'SHOULDER_COMPOUND', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'LATERAL_RAISE', 'BICEPS', 'TRICEPS']
export const LOWER_DAY = ['SQUAT_PATTERN', 'HIP_HINGE', 'QUAD_ISOLATION', 'HAMSTRING', 'CALVES', 'ABS']
export const ARMS_DAY = ['BICEPS', 'TRICEPS', 'REAR_DELT', 'LATERAL_RAISE', 'FOREARMS', 'GRIP', 'ABS']

export const DAY_TEMPLATES = {
  push: { structure: PUSH_DAY },
  pull: { structure: PULL_DAY },
  legs: { structure: LEG_DAY },
  upper: { structure: UPPER_DAY },
  lower: { structure: LOWER_DAY },
  arms: { structure: ARMS_DAY },
}

export function resolveDayTemplate(focusText, lang, trainingType = 'gym') {
  const ft = focusText.toLowerCase()
  const pushKw = lang === 'en' ? ['push', 'chest', 'shoulder', 'triceps'] : ['دفع', 'صدر', 'كتف', 'تراي']
  const pullKw = lang === 'en' ? ['pull', 'back', 'biceps', 'rows'] : ['سحب', 'ظهر', 'باي']
  const legsKw = lang === 'en' ? ['legs', 'squat', 'deadlift', 'lower'] : ['أرجل', 'سكوات', 'أسفل']
  const upperKw = lang === 'en' ? ['upper'] : ['أعلى']
  const lowerKw = lang === 'en' ? ['lower'] : ['أسفل']
  const armsKw = lang === 'en' ? ['arms', 'arm'] : ['أذرع', 'ذراع']

  const isPush = pushKw.some(k => ft.includes(k))
  const isPull = pullKw.some(k => ft.includes(k))
  const isLegs = legsKw.some(k => ft.includes(k))
  const isUpper = upperKw.some(k => ft.includes(k))
  const isLower = lowerKw.some(k => ft.includes(k))

  // Combined days get structured hybrid templates
  if (isPush && isPull && isLegs) {
    return {
      structure: ['CHEST_COMPOUND', 'VERTICAL_PULL', 'SQUAT_PATTERN', 'SHOULDER_COMPOUND', 'HORIZONTAL_PULL', 'HIP_HINGE', 'TRICEPS', 'BICEPS', 'ABS', 'CALVES'],
    }
  }
  if (isPull && isLegs) {
    return {
      structure: ['VERTICAL_PULL', 'SQUAT_PATTERN', 'HORIZONTAL_PULL', 'HIP_HINGE', 'REAR_DELT', 'BICEPS', 'ABS', 'CALVES'],
    }
  }
  if (isPush && isLegs) {
    return {
      structure: ['CHEST_COMPOUND', 'SQUAT_PATTERN', 'SHOULDER_COMPOUND', 'HIP_HINGE', 'CHEST_ISOLATION', 'LATERAL_RAISE', 'ABS', 'CALVES'],
    }
  }
  if (isPush && isPull) {
    return {
      structure: ['CHEST_COMPOUND', 'VERTICAL_PULL', 'SHOULDER_COMPOUND', 'HORIZONTAL_PULL', 'CHEST_ISOLATION', 'BICEPS', 'TRICEPS', 'ABS'],
    }
  }

  // Upper/Lower days (for 5-day PPL + Upper/Lower split)
  if (isUpper) return DAY_TEMPLATES.upper
  if (isLower) return DAY_TEMPLATES.lower

  if (isPush) return DAY_TEMPLATES.push
  if (isPull) return DAY_TEMPLATES.pull
  if (isLegs) return DAY_TEMPLATES.legs
  if (armsKw.some(k => ft.includes(k))) return DAY_TEMPLATES.arms

  if (ft.includes('full') || ft.includes('كامل')) {
    if (trainingType === 'home') {
      return {
        structure: ['CHEST_COMPOUND', 'SHOULDER_COMPOUND', 'HORIZONTAL_PULL', 'SQUAT_PATTERN', 'HIP_HINGE', 'BICEPS', 'TRICEPS'],
      }
    }
    return {
      structure: ['CHEST_COMPOUND', 'SHOULDER_COMPOUND', 'VERTICAL_PULL', 'HORIZONTAL_PULL', 'SQUAT_PATTERN', 'HIP_HINGE', 'CHEST_ISOLATION', 'BICEPS', 'TRICEPS', 'ABS'],
    }
  }
  return DAY_TEMPLATES.push
}

// For 5-day splits, guarantee minimum weekly coverage by appending ABS if total < 2
export function ensureWeeklyCoverage(dayData, pool, adjust, globalUsedNames) {
  let absCount = 0
  let calvesCount = 0
  dayData.forEach(dd => {
    dd.exercises.forEach(e => {
      if (e.mov === 'ABS') absCount++
      if (e.mov === 'CALVES') calvesCount++
    })
  })

  // Inject missing ABS into non-cardio slot
  while (absCount < 2) {
    const absPool = pool.filter(ex => ex.mov === 'ABS' && !globalUsedNames.has(ex.name))
    if (absPool.length === 0) break
    const target = dayData.find(dd => !dd.exercises.some(e => e.mov === 'ABS'))
    if (!target) break
    const absEx = adjust(absPool[0])
    absEx.mov = 'ABS'
    const insertAt = target.exercises.length - 1
    target.exercises.splice(insertAt, 0, absEx)
    globalUsedNames.add(absPool[0].name)
    absCount++
  }

  // Inject missing CALVES (allow reuse since pool may have only one CALVES exercise)
  while (calvesCount < 2) {
    const calfPool = pool.filter(ex => ex.mov === 'CALVES')
    if (calfPool.length === 0) break
    const target = dayData.find(dd => !dd.exercises.some(e => e.mov === 'CALVES'))
    if (!target) break
    const calfEx = adjust(calfPool[0])
    calfEx.mov = 'CALVES'
    const insertAt = target.exercises.length - 1
    target.exercises.splice(insertAt, 0, calfEx)
    globalUsedNames.add(calfPool[0].name)
    calvesCount++
  }
}
