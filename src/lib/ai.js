const API_KEY = import.meta.env?.VITE_OPENROUTER_KEY || process?.env?.VITE_OPENROUTER_KEY
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `أنت مدرب كمال أجسام وقوة بدنية محترف، وخبير في الفنون القتالية المختلطة.
مهمتك: إنشاء خطة تدريب جيم احترافية بناءً على بيانات العميل فقط.
يجب أن تكون الخطة مبنية على مبادئ التدريب الرياضي الحديثة وليس اختيار تمارين عشوائي.

=========================
قواعد عامة إلزامية
==========================

1- لا تكرر نفس الحركة أو نفس زاوية التمرين داخل نفس اليوم.

2- استخدم التمارين المركبة (Compound Exercises) كأساس للبرنامج دائماً.

3- استخدم التمارين المعزولة (Isolation Exercises) كتمارين مساعدة فقط.

4- يجب أن تحتوي الخطة على توازن عضلي كامل.

5- يجب تدريب جميع المجموعات العضلية الرئيسية:
* الصدر * الظهر * الأكتاف الأمامية * الأكتاف الجانبية * الأكتاف الخلفية
* البايسبس * الترايسبس * الفخذ الأمامي * الفخذ الخلفي * المؤخرة * السمانة * البطن

6- لا تنشئ أي خطة تحتوي على نقص في مجموعة عضلية أساسية.

7- لا تكتب أسماء عضلات فقط، بل اكتب تمارين حقيقية معروفة في الجيم.

8- إذا كان الجيم يحتوي على معدات كاملة فامنح الأولوية لـ:
Barbell > Machine > Cable > Dumbbells

9- لا تستخدم تمارين منزلية إذا كانت معدات الجيم متاحة.

10- لا تكرر نفس التمرين أكثر من مرة في الأسبوع إلا في برامج القوة.

=========================
اختيار التقسيمة
===============

إذا كان عدد الأيام 1-2: Full Body
3 أيام: Full Body أو Upper/Lower/Full
4 أيام: Upper/Lower
5 أيام: Push Pull Legs + Upper Lower
6 أيام: Push Pull Legs ×2
7 أيام: 6 أيام تدريب + يوم راحة

=========================
حسب الهدف
=========

بناء العضلات: 8-20 مجموعة أسبوعياً لكل عضلة • 6-15 تكرار • راحة 60-120 ث
خسارة الدهون: المحافظة على التمارين المركبة + كارديو مناسب
زيادة القوة: التركيز على Squat + Bench Press + Deadlift + Overhead Press • تكرارات أقل • أوزان أعلى • راحات أطول

=========================
بناء أيام التدريب
=================

Push Day: 2 تمارين صدر مركب • 1 كتف مركب • 1 صدر معزول • 1 كتف جانبي • 1 ترايسبس
Pull Day: 1 سحب رأسي • 1 سحب أفقي • 1 ظهر إضافي • 1 كتف خلفي • 2 بايسبس
Leg Day: 1 Squat Pattern • 1 Hip Hinge • 1 فخذ أمامي • 1 فخذ خلفي • 1 سمانة • 1 بطن

=========================
اختيار التمارين
===============

صدر: Bench Press • Incline Bench Press • Chest Press Machine • Cable Fly • Pec Deck
ظهر: Deadlift • Barbell Row • T-Bar Row • Lat Pulldown • Pull Up • Seated Cable Row
كتف: Overhead Press • Shoulder Press Machine • Lateral Raise • Cable Lateral Raise • Reverse Pec Deck • Face Pull
بايسبس: Barbell Curl • EZ Curl • Hammer Curl • Cable Curl
ترايسبس: Pushdown • Overhead Extension • Skull Crushers
أرجل: Squat • Hack Squat • Leg Press • Romanian Deadlift • Leg Extension • Leg Curl • Standing Calf Raise • Seated Calf Raise
بطن: Cable Crunch • Hanging Leg Raise • Plank • Ab Wheel

=========================
قواعد الجودة
============

قبل إخراج الخطة راجع: هل يوجد تمرين مركب رئيسي لكل يوم؟ هل تم تدريب جميع العضلات؟ هل يوجد تمرين سمانة وبطن وكتف خلفي؟ هل يوجد توازن دفع/سحب؟ هل الحجم مناسب للمستوى والهدف؟

=========================
صيغة الإخراج
=============

أعد الرد بصيغة JSON فقط بالهيكل التالي:
{
  "split": "اسم التقسيمة (مثال: Push / Pull / Legs)",
  "days": [
    {
      "day": "اليوم 1 — دفع (Push): صدر + كتف + ترايسبس",
      "focus": "صدر + كتف + ترايسبس",
      "exercises": [
        { "name": "اسم التمرين بالعربية", "sets": 4, "reps": "8-12", "rest": "60 ث" },
        { "name": "🔥 كارديو: اسم تمرين الكارديو", "durationMinutes": 10, "sets": "-", "reps": "-", "rest": "-" }
      ]
    }
  ],
  "nutrition": "نظام غذائي مخصص حسب الوزن والطول والهدف",
  "bmr": "معدل الأيض الأساسي",
  "dailyCalories": "السعرات المناسبة للهدف",
  "protein": "البروتين المناسب بالجرام",
  "tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3", "نصيحة 4", "نصيحة 5"]
}
ملاحظة: إذا كان نوع التدريب مختلفاً عن "جيم" (مثلاً MMA أو ملاكمة) استخدم التمارين الوظيفية المناسبة لتلك الرياضة مع الحفاظ على نفس هيكل JSON.`

const SYSTEM_PROMPT_ENG = `You are a professional bodybuilding and strength coach, and an expert in martial arts.
Your mission: Create a professional gym training plan based solely on the client's data.
The plan must be built on modern sports training principles, not random exercise selection.

=========================
Mandatory General Rules
==========================

1- Do NOT repeat the same movement or angle within the same day.

2- Use compound exercises as the foundation of the program.

3- Use isolation exercises only as accessory work.

4- The plan must have complete muscular balance.

5- All major muscle groups must be trained:
* Chest * Back * Front Delts * Side Delts * Rear Delts
* Biceps * Triceps * Quadriceps * Hamstrings * Glutes * Calves * Abs

6- Never create a plan missing any basic muscle group.

7- Write real, well-known gym exercises, not just muscle names.

8- If full gym equipment is available, prioritize: Barbell > Machine > Cable > Dumbbells

9- Do NOT use home/bodyweight exercises when gym equipment is available.

10- Do NOT repeat the same exercise more than once per week unless in strength programs.

=========================
Split Selection
===============

1-2 days: Full Body
3 days: Full Body or Upper/Lower/Full
4 days: Upper / Lower
5 days: Push Pull Legs + Upper Lower
6 days: Push Pull Legs x2
7 days: 6 training + 1 rest

=========================
By Goal
=======

Muscle building: 8-20 weekly sets per muscle • 6-15 reps • 60-120 sec rest
Fat loss: Maintain compound exercises + appropriate cardio
Strength: Focus on Squat + Bench Press + Deadlift + Overhead Press • Lower reps • Heavier weight • Longer rest

=========================
Training Day Structure
=====================

Push Day: 2 compound chest • 1 compound shoulder • 1 chest isolation • 1 side delt • 1 triceps
Pull Day: 1 vertical pull • 1 horizontal pull • 1 extra back • 1 rear delt • 2 biceps
Leg Day: 1 Squat Pattern • 1 Hip Hinge • 1 quad isolation • 1 hamstring • 1 calves • 1 abs

=========================
Exercise Selection
=================

Chest: Bench Press • Incline Bench Press • Chest Press Machine • Cable Fly • Pec Deck
Back: Deadlift • Barbell Row • T-Bar Row • Lat Pulldown • Pull Up • Seated Cable Row
Shoulders: Overhead Press • Shoulder Press Machine • Lateral Raise • Cable Lateral Raise • Reverse Pec Deck • Face Pull
Biceps: Barbell Curl • EZ Curl • Hammer Curl • Cable Curl
Triceps: Pushdown • Overhead Extension • Skull Crushers
Legs: Squat • Hack Squat • Leg Press • Romanian Deadlift • Leg Extension • Leg Curl • Standing Calf Raise • Seated Calf Raise
Abs: Cable Crunch • Hanging Leg Raise • Plank • Ab Wheel

=========================
Quality Checklist
================

Before outputting: Is there a main compound exercise per day? Are all muscles trained? Are calves, abs, and rear delts included? Is there push/pull balance? Is volume appropriate for level and goal?

=========================
Output Format
=============

Return reply in JSON format only, in the exact structure:
{
  "split": "Split name (e.g., Push / Pull / Legs)",
  "days": [
    {
      "day": "Day 1 — Push: Chest + Shoulders + Triceps",
      "focus": "Chest + Shoulders + Triceps",
      "exercises": [
        { "name": "Exercise name", "sets": 4, "reps": "8-12", "rest": "60 sec" },
        { "name": "🔥 Cardio: Cardio exercise name", "durationMinutes": 10, "sets": "-", "reps": "-", "rest": "-" }
      ]
    }
  ],
  "nutrition": "Personalized nutrition plan based on weight, height and goal",
  "bmr": "Calculated BMR",
  "dailyCalories": "Calories appropriate for goal",
  "protein": "Protein in grams",
  "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]
}
Note: If training type is not "Gym" (e.g. MMA or Boxing), use functional exercises appropriate for that sport while keeping the same JSON structure.`

export async function generateWorkoutPlan(formData, lang = 'ar') {
  if (!API_KEY) { console.log('USING_FALLBACK_GENERATOR=true'); return getFallbackPlan(formData, lang) }

  const { name, weight, height, age, goal, level, days, equipment, trainingType } = formData

  const goalTextAR = { fat_loss: 'حرق دهون', muscle_gain: 'بناء عضلات', endurance: 'تحمل قتالي', strength: 'قوة', general: 'لياقة عامة' }
  const goalTextEN = { fat_loss: 'Fat Loss', muscle_gain: 'Muscle Gain', endurance: 'Combat Endurance', strength: 'Strength', general: 'General Fitness' }
  const levelTextAR = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' }
  const levelTextEN = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
  const equipTextAR = { none: 'بدون أجهزة (bodyweight فقط)', dumbbell: 'دمبل', barbell: 'بار', pullup_bar: 'عقلة', bench: 'كرسي/بنش', step: 'استيب', kettlebell: 'كيتبل', resistance_bands: 'باند مقاومة', cable: 'كابل', gym_machine: 'أجهزة جيم', leg_press: 'ليج بريس', lat_pulldown: 'لات بول داون', smith_machine: 'سميث مشين', full_gym: 'جيم متكامل' }
  const equipTextEN = { none: 'No equipment (bodyweight only)', dumbbell: 'Dumbbell', barbell: 'Barbell', pullup_bar: 'Pull-up Bar', bench: 'Bench', step: 'Step', kettlebell: 'Kettlebell', resistance_bands: 'Resistance Bands', cable: 'Cable', gym_machine: 'Gym Machines', leg_press: 'Leg Press', lat_pulldown: 'Lat Pulldown', smith_machine: 'Smith Machine', full_gym: 'Full Gym' }
  const typeTextAR = { mma: 'MMA', boxing: 'ملاكمة', kickboxing: 'كيك بوكس', bjj: 'جيوجيتسو', muay_thai: 'مواي تاي', taekwondo: 'تاي كون دو', karate: 'كاراتيه', wrestling: 'مصارعة', gym: 'جيم (معدات كاملة)', general: 'لياقة عامة' }
  const typeTextEN = { mma: 'MMA', boxing: 'Boxing', kickboxing: 'Kickboxing', bjj: 'Jiu-Jitsu', muay_thai: 'Muay Thai', taekwondo: 'Taekwondo', karate: 'Karate', wrestling: 'Wrestling', gym: 'Gym (Full Equipment)', general: 'General Fitness' }

  const goalText = lang === 'en' ? goalTextEN : goalTextAR
  const levelText = lang === 'en' ? levelTextEN : levelTextAR
  const equipText = lang === 'en' ? equipTextEN : equipTextAR
  const typeText = lang === 'en' ? typeTextEN : typeTextAR

  const equipList = Array.isArray(equipment) ? equipment : equipment ? [equipment] : ['none']
  const equipDisplay = equipList.map(e => equipText[e] || e).join(', ') || (lang === 'en' ? 'No equipment' : 'بدون أجهزة')

  const userPromptAR = `اصنع خطة تدريب شخصية جدا للشخص التالي:
- الاسم: ${name || 'مستخدم'}
- الوزن: ${weight} كجم
- الطول: ${height} سم
- العمر: ${age} سنة
- الهدف: ${goalText[goal] || goal}
- المستوى: ${levelText[level] || level}
- أيام التمرين: ${days} يوم في الأسبوع
- المعدات المتاحة: ${equipDisplay}
- نوع التدريب: ${typeText[trainingType] || trainingType}

مهم جدا: وزع التمارين بالكامل على ${days} أيام. كل يوم له 4-6 تمارين محددة + تمرين كارديو واحد بمدة محددة بالدقائق (durationMinutes).
الخطة لازم تكون كاملة وجاهزة للتنفيذ من أول يوم.`

  const userPromptEN = `Create a highly personalized training plan for:
- Name: ${name || 'User'}
- Weight: ${weight} kg
- Height: ${height} cm
- Age: ${age}
- Goal: ${goalText[goal] || goal}
- Level: ${levelText[level] || level}
- Training days: ${days} days per week
- Available equipment: ${equipDisplay}
- Training type: ${typeText[trainingType] || trainingType}

Important: Distribute all exercises across ${days} days. Each day gets 4-6 specific exercises + 1 cardio exercise with duration in minutes (durationMinutes).
The plan must be complete and ready to execute from day one.`

  const userPrompt = lang === 'en' ? userPromptEN : userPromptAR
  const systemContent = lang === 'en' ? SYSTEM_PROMPT_ENG : SYSTEM_PROMPT

  let lastError = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`AI Attempt #${attempt}`)

    try {
      const messages = [
        { role: 'system', content: systemContent },
        { role: 'user', content: userPrompt },
      ]
      if (lastError) {
        messages.push({ role: 'user', content: lastError })
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flat-2',
          messages,
          temperature: 0,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        }),
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('No content')

      const parsed = JSON.parse(content)

      // Sanitize: replace Arabic day/name patterns if English UI
      if (lang === 'en' && parsed?.days) {
        const arDayMap = {
          'اليوم الأول': 'Day One', 'اليوم الثاني': 'Day Two', 'اليوم الثالث': 'Day Three',
          'اليوم الرابع': 'Day Four', 'اليوم الخامس': 'Day Five', 'اليوم السادس': 'Day Six',
          'الأول': 'One', 'الثاني': 'Two', 'الثالث': 'Three', 'الرابع': 'Four',
          'الخامس': 'Five', 'السادس': 'Six',
        }
        parsed.days.forEach(day => {
          if (day.day) Object.entries(arDayMap).forEach(([ar, en]) => { day.day = day.day.replaceAll(ar, en) })
          if (day.focus) {
            day.focus = day.focus.replace(/صدر/g, 'Chest').replace(/كتف/g, 'Shoulders').replace(/ترايسبس/g, 'Triceps')
              .replace(/بايسبس/g, 'Biceps').replace(/ظهر/g, 'Back').replace(/قلب/g, 'Core').replace(/أرجل/g, 'Legs')
              .replace(/قوة/g, 'Strength').replace(/تحمل/g, 'Endurance').replace(/كارديو/g, 'Cardio')
              .replace(/انفجار/g, 'Explosive').replace(/سحب/g, 'Pull').replace(/دفع/g, 'Push')
              .replace(/سرعة/g, 'Speed').replace(/ركلات/g, 'Kicks').replace(/لكمات/g, 'Punches')
              .replace(/مرونة/g, 'Flexibility').replace(/حركات/g, 'Movements').replace(/كاتا/g, 'Kata')
              .replace(/أساسية/g, 'Basic').replace(/دقة/g, 'Precision').replace(/متوازنة/g, 'Balanced')
              .replace(/وظيفية/g, 'Functional').replace(/عالية/g, 'High').replace(/عالي/g, 'High')
              .replace(/أساسي/g, 'Basic').replace(/كاملة/g, 'Full').replace(/كامل/g, 'Full')
              .replace(/أرضي/g, 'Ground').replace(/أرضية/g, 'Ground')
          }
        })
      }

      // Normalize AI exercises: enrich with cat, type, movement, muscles from DB
      const { unknownExercises, recognized, unknown } = normalizeAIWorkout(parsed, lang)

      const dayData = parsed.days || []
      const validation = validateWorkout(dayData)
      const qcResult = calculateWorkoutScore(parsed)

      console.log(`Exercises Recognized: ${recognized}`)
      console.log(`Exercises Unknown: ${unknown}`)
      if (unknownExercises.length > 0) {
        console.log('Unknown Exercises List:')
        unknownExercises.forEach(u => console.log(`  - "${u.name}" (${u.day})`))
      }
      console.log(`Score: ${qcResult.total}`)

      if (validation.pass && qcResult.total >= 85) {
        console.log('AI_ACCEPTED')
        parsed._debug = {
          source: 'AI',
          score: qcResult.total,
          recognized: normalized.recognized + normalized.inferred,
          db: normalized.recognized,
          inferred: normalized.inferred,
          unknown: normalized.unknownExercises.length,
          timestamp: Date.now(),
        }
        return parsed
      }

      // Build error report for Gemini retry
      const reasons = []
      if (!validation.pass) {
        validation.errors.forEach(e => reasons.push(`- ${e}`))
      }
      if (qcResult.total < 85) {
        reasons.push(`- Quality score ${qcResult.total}/100 is below 85 threshold`)
      }

      lastError = `The previous workout plan failed.\nReasons:\n${reasons.join('\n')}\n\nGenerate a new workout plan.`

    } catch (err) {
      console.error('AI attempt failed:', err)
      lastError = `The previous request failed: ${err.message}. Generate a new workout plan.`
    }
  }

  console.log('FALLBACK_USED')
  return getFallbackPlan(formData, lang)
}

import { generateGymPlan } from './workout-generator.js'
import { validateWorkout } from './workout-validator.js'
import { calculateWorkoutScore } from './quality-control.js'
import { normalizeAIWorkout } from './normalize-ai.js'

function getFallbackPlan(form, lang = 'ar') {
  console.log('USING_FALLBACK_GENERATOR=true')
  const plan = generateGymPlan({ ...form, lang })
  plan._debug = {
    source: 'Fallback',
    score: plan._qc?.total || 0,
    recognized: '—',
    unknown: '—',
    timestamp: Date.now(),
  }
  return plan
}
