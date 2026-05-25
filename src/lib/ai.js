const API_KEY = import.meta.env.VITE_OPENROUTER_KEY
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `أنت مدرب RMA Trainer AI — خبير في الفنون القتالية المختلطة واللياقة البدنية.
مهمتك: توليد خطة تدريب مفصلة وشخصية 100% حسب بيانات المستخدم.

قواعد صارمة:
- استخدم الوزن والطول والعمر لحساب الشدة المناسبة
- اختر تمارين حسب المعدات المتاحة بالضبط
- عدد الأيام يحدد التقسيمة (3 = full body, 4 = upper/lower, 5+ = PPL)
- المستوى يحدد التعقيد والشدة
- الهدف يحدد نوع التمارين (حرق دهون = تكرارات عالية، قوة = أوزان ثقيلة)
- نوع التدريب يحدد الحركات (MMA = حركات وظيفية، ملاكمة = تركيز على الانفجار)

الأهم: وزع التمارين على الأيام حسب عدد أيام التمرين. كل يوم له تمارينه المحددة.

أعد الرد بصيغة JSON فقط بدون أي نص إضافي بالهيكل التالي بالضبط:
{
  "split": "اسم التقسيمة وشرحها",
  "days": [
    {
      "day": "اليوم 1 - اسم اليوم (مثال: دفع - Chest & Shoulders)",
      "focus": "تركيز اليوم (مثال: صدر + كتف + ترايسبس)",
      "exercises": [
        { "name": "اسم التمرين بالعربية مع شرح", "sets": 4, "reps": "8-12", "rest": "60 ثانية" },
        { "name": "🔥 كارديو: اسم تمرين الكارديو", "durationMinutes": 10, "sets": "-", "reps": "-", "rest": "-" }
      ]
    }
  ],
  "nutrition": "نظام غذائي مخصص حسب الوزن والطول والهدف",
  "bmr": "معدل الأيض الأساسي المحسوب",
  "dailyCalories": "السعرات المناسبة للهدف",
  "protein": "البروتين المناسب بالجرام",
  "tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3", "نصيحة 4", "نصيحة 5"]
}`

export async function generateWorkoutPlan(formData) {
  if (!API_KEY) return getFallbackPlan(formData)

  const { name, weight, height, age, goal, level, days, equipment, trainingType } = formData

  const goalText = { fat_loss: 'حرق دهون', muscle_gain: 'بناء عضلات', endurance: 'تحمل قتالي', strength: 'قوة', general: 'لياقة عامة' }
  const levelText = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' }
  const equipText = { none: 'بدون أجهزة (bodyweight فقط)', dumbbells: 'دمبلز', barbell: 'بار ودمبلز', kettlebell: 'كيتبل بيل', resistance_bands: 'أشرطة مقاومة', pullup_bar: 'بار عقلة ودمبلز', full_gym: 'جيم كامل (كل الأجهزة)' }
  const typeText = { mma: 'MMA', boxing: 'ملاكمة', kickboxing: 'كيك بوكس', bjj: 'جيوجيتسو', muay_thai: 'مواي تاي', taekwondo: 'تاي كون دو', karate: 'كاراتيه', wrestling: 'مصارعة', general: 'لياقة عامة' }

  const userPrompt = `اصنع خطة تدريب شخصية جدا للشخص التالي:
- الاسم: ${name || 'مستخدم'}
- الوزن: ${weight} كجم
- الطول: ${height} سم
- العمر: ${age} سنة
- الهدف: ${goalText[goal] || goal}
- المستوى: ${levelText[level] || level}
- أيام التمرين: ${days} يوم في الأسبوع
- المعدات المتاحة: ${equipText[equipment] || equipment}
- نوع التدريب: ${typeText[trainingType] || trainingType}

مهم جدا: وزع التمارين بالكامل على ${days} أيام. كل يوم له 4-6 تمارين محددة + تمرين كارديو واحد بمدة محددة بالدقائق (durationMinutes).
الخطة لازم تكون كاملة وجاهزة للتنفيذ من أول يوم.`

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flat-2',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('No content')

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error('AI failed, using personalized fallback:', err)
    return getFallbackPlan(formData)
  }
}

function getFallbackPlan(form) {
  const w = parseFloat(form.weight) || 75
  const h = parseFloat(form.height) || 175
  const a = parseInt(form.age) || 25
  const days = parseInt(form.days) || 3
  const goal = form.goal || 'general'
  const level = form.level || 'beginner'
  const equipment = form.equipment || 'none'
  const trainingType = form.trainingType || 'general'

  const bmr = Math.round(10 * w + 6.25 * h - 5 * a + 5)
  const calMap = { fat_loss: bmr * 1.2 - 500, muscle_gain: bmr * 1.55 + 300, endurance: bmr * 1.55, strength: bmr * 1.55 + 100, general: bmr * 1.4 }
  const dailyCalories = Math.round(calMap[goal] || calMap.general)
  const protein = Math.round(w * ({ fat_loss: 2.0, muscle_gain: 2.2, endurance: 1.6, strength: 2.0, general: 1.5 }[goal] || 1.5))

  const exercisePools = {
    none: [
      { name: 'تمرين الضغط (Push-ups)', defSets: 3, defReps: '12-20', defRest: '45 ث' },
      { name: 'تمرين الضغط بالكوع ضيق (Diamond Push-ups)', defSets: 3, defReps: '10-15', defRest: '45 ث' },
      { name: 'انخفاض كرسي (Chair Dips)', defSets: 3, defReps: '12-18', defRest: '45 ث' },
      { name: 'سوبرمان (Superman Holds)', defSets: 3, defReps: '15-20 ث', defRest: '45 ث' },
      { name: 'قرفصاء هواء (Bodyweight Squats)', defSets: 3, defReps: '20-30', defRest: '60 ث' },
      { name: 'اندفاع (Lunges)', defSets: 3, defReps: '12-15 لكل رجل', defRest: '60 ث' },
      { name: 'رفع الحوض (Glute Bridges)', defSets: 3, defReps: '20-25', defRest: '45 ث' },
      { name: 'بلانك (Plank)', defSets: 3, defReps: '30-60 ث', defRest: '30 ث' },
      { name: 'رفع رجلين (Leg Raises)', defSets: 3, defReps: '15-20', defRest: '30 ث' },
      { name: 'نط (Jumping Jacks)', defSets: 4, defReps: '45 ث', defRest: '15 ث' },
      { name: 'متسلق الجبال (Mountain Climbers)', defSets: 3, defReps: '30 ث', defRest: '20 ث' },
      { name: 'تمدد ظهر (Cobra Stretch)', defSets: 2, defReps: '30 ث', defRest: '15 ث' },
    ],
    dumbbells: [
      { name: 'دمبلز بنش برس (Dumbbell Bench Press)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'دمبلز ضغط كتف (Shoulder Press)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'دمبلز رف (Dumbbell Rows)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'دمبلز بايسبس (Bicep Curls)', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'دمبلز ترايسبس خلف الرأس (Overhead Ext)', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'دمبلز قرفصاء (Goblet Squats)', defSets: 4, defReps: '10-15', defRest: '90 ث' },
      { name: 'دمبلز اندفاع (Lunges)', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
      { name: 'دمبلز روسيان تويست (Russian Twist)', defSets: 3, defReps: '16-20', defRest: '30 ث' },
      { name: 'دمبلز ثراستر (Thrusters)', defSets: 3, defReps: '10-12', defRest: '60 ث' },
      { name: 'دمبلز رفع سمانة (Calf Raises)', defSets: 4, defReps: '15-20', defRest: '30 ث' },
    ],
    barbell: [
      { name: 'بار بنش برس (Bench Press)', defSets: 5, defReps: '8-10', defRest: '90 ث' },
      { name: 'بار قرفصاء (Back Squats)', defSets: 5, defReps: '8-10', defRest: '2 د' },
      { name: 'بار رف ميت (Deadlifts)', defSets: 4, defReps: '6-8', defRest: '2-3 د' },
      { name: 'بار رف (Barbell Rows)', defSets: 4, defReps: '8-10', defRest: '90 ث' },
      { name: 'بار ضغط كتف (Overhead Press)', defSets: 4, defReps: '8-10', defRest: '90 ث' },
      { name: 'بار بايسبس (Barbell Curls)', defSets: 3, defReps: '10-12', defRest: '45 ث' },
      { name: 'بار ترايسبس (Skull Crushers)', defSets: 3, defReps: '10-12', defRest: '45 ث' },
      { name: 'بار رفع سمانة واقف (Standing Calf)', defSets: 4, defReps: '12-15', defRest: '30 ث' },
    ],
    kettlebell: [
      { name: 'كيتبل سوينغ (Swings)', defSets: 4, defReps: '15-20', defRest: '60 ث' },
      { name: 'كيتبل قرفصاء (Goblet Squats)', defSets: 4, defReps: '12-15', defRest: '60 ث' },
      { name: 'كيتبل كلين وبريس (Clean & Press)', defSets: 4, defReps: '8-10 لكل جانب', defRest: '60 ث' },
      { name: 'كيتبل رف (Rows)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'كيتبل ويندميل (Windmills)', defSets: 3, defReps: '8-10', defRest: '45 ث' },
      { name: 'كيتبل تركش جيت (Turkish Get-up)', defSets: 3, defReps: '3-5 لكل جانب', defRest: '90 ث' },
      { name: 'كيتبل روسيان تويست (Russian Twist)', defSets: 3, defReps: '16-20', defRest: '30 ث' },
    ],
    resistance_bands: [
      { name: 'باند بنش برس (Band Chest Press)', defSets: 4, defReps: '15-20', defRest: '45 ث' },
      { name: 'باند رف (Band Rows)', defSets: 4, defReps: '15-20', defRest: '45 ث' },
      { name: 'باند ضغط كتف (Band OHP)', defSets: 4, defReps: '15-20', defRest: '45 ث' },
      { name: 'باند قرفصاء (Band Squats)', defSets: 4, defReps: '20-25', defRest: '45 ث' },
      { name: 'باند بايسبس (Band Curls)', defSets: 3, defReps: '15-20', defRest: '30 ث' },
      { name: 'باند مشي جانبي (Lateral Walks)', defSets: 3, defReps: '12-15 كل اتجاه', defRest: '30 ث' },
      { name: 'باند كرانش (Band Crunches)', defSets: 3, defReps: '20-25', defRest: '30 ث' },
    ],
    pullup_bar: [
      { name: 'عقلة واسعة (Pull-ups)', defSets: 4, defReps: '6-12', defRest: '90 ث' },
      { name: 'عقلة عكسية (Chin-ups)', defSets: 4, defReps: '6-12', defRest: '90 ث' },
      { name: 'عقلة أسترالية (Australian Rows)', defSets: 3, defReps: '12-15', defRest: '60 ث' },
      { name: 'عقلة مثلث (V-Grip Pull-ups)', defSets: 3, defReps: '8-10', defRest: '60 ث' },
      { name: 'رفع رجلين معلق (Hanging Leg Raises)', defSets: 3, defReps: '10-15', defRest: '45 ث' },
      { name: 'قرفصاء هواء (Bodyweight Squats)', defSets: 3, defReps: '20-25', defRest: '60 ث' },
      { name: 'تمرين الضغط (Push-ups)', defSets: 3, defReps: '15-20', defRest: '45 ث' },
    ],
    full_gym: [
      { name: 'بار بنش برس (Barbell Bench Press)', defSets: 5, defReps: '8-12', defRest: '90 ث' },
      { name: 'سحب علوي (Lat Pulldown)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'سميث مشين قرفصاء (Squats)', defSets: 5, defReps: '8-12', defRest: '2 د' },
      { name: 'دامبلز ضغط كتف (DB Shoulder Press)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'ليغ برس (Leg Press)', defSets: 4, defReps: '12-15', defRest: '60 ث' },
      { name: 'بار رف ميت (Deadlifts)', defSets: 4, defReps: '6-10', defRest: '2-3 د' },
      { name: 'بار بايسبس (Barbell Curls)', defSets: 3, defReps: '10-12', defRest: '45 ث' },
      { name: 'كابل ترايسبس (Cable Pushdowns)', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'كابل كرانش (Cable Crunches)', defSets: 3, defReps: '15-20', defRest: '30 ث' },
      { name: 'مشين صدر (Machine Chest Fly)', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'مشين كتف جانبي (Lateral Raise)', defSets: 4, defReps: '12-15', defRest: '45 ث' },
      { name: 'رفع سمانة واقف (Standing Calf Raises)', defSets: 4, defReps: '12-15', defRest: '30 ث' },
    ],
  }

  const pool = exercisePools[equipment] || exercisePools.none

  // Adjust reps/rest based on goal
  const adjust = (ex) => {
    let reps = ex.defReps
    let rest = ex.defRest
    if (goal === 'strength') { reps = '6-8'; rest = '2-3 د' }
    else if (goal === 'fat_loss') { reps = '15-20'; rest = '30-45 ث' }
    else if (goal === 'endurance') { reps = '18-25'; rest = '30-45 ث' }
    return { name: ex.name, sets: goal === 'strength' ? ex.defSets : ex.defSets, reps, rest }
  }

  // Cardio per day based on training type — structured with duration in minutes
  const dailyCardio = (dayIndex) => {
    const cardioOptions = {
      mma: [
        { name: 'ظل قتال HIIT (3 جولات)', duration: 9 },
        { name: 'نط حبل + بوربيز', duration: 10 },
        { name: 'تمارين تمساح متقطع', duration: 10 },
        { name: 'سباقات قصر انفجارية', duration: 8 },
        { name: 'HIIT متقطع (4 دوائر)', duration: 10 },
        { name: 'قتال ظل انفجاري', duration: 9 },
      ],
      boxing: [
        { name: 'نط حبل', duration: 10 },
        { name: 'ظل ملاكمة (3 جولات)', duration: 9 },
        { name: 'حركات قدم سريعة', duration: 10 },
        { name: 'نط حبل متقطع', duration: 10 },
        { name: 'ضغط انفجاري + نط', duration: 10 },
        { name: 'ظل سرعة (4 جولات)', duration: 8 },
      ],
      kickboxing: [
        { name: 'ظل كيك بوكس (3 جولات)', duration: 9 },
        { name: 'نط حبل + ركلات', duration: 10 },
        { name: 'ركلات متعددة الاتجاهات', duration: 8 },
        { name: 'لكمات + ركلات مركبة', duration: 10 },
        { name: 'HIIT كيك بوكس', duration: 10 },
        { name: 'ظل قتال سريع', duration: 9 },
      ],
      bjj: [
        { name: 'تمارين أرضية زحف', duration: 10 },
        { name: 'جري', duration: 15 },
        { name: 'تمارين تمساح', duration: 10 },
        { name: 'قرفصاء انفجاري', duration: 10 },
        { name: 'HIIT أرضية (4 دوائر)', duration: 10 },
        { name: 'تحمل أرضي', duration: 15 },
      ],
      muay_thai: [
        { name: 'ظل مواي تاي (3 جولات)', duration: 9 },
        { name: 'ركلات متعددة الاتجاهات', duration: 5 },
        { name: 'نط حبل + ركلات', duration: 10 },
        { name: 'ظل ركلات سريع', duration: 8 },
        { name: 'تبديل رجلين سريع', duration: 10 },
        { name: 'ركلات مركبة + نط', duration: 10 },
      ],
      taekwondo: [
        { name: 'تمارين ركلات سريعة', duration: 10 },
        { name: 'ظل تاي كون دو (3 جولات)', duration: 8 },
        { name: 'نط حبل + ركلات عالية', duration: 10 },
        { name: 'حركات قدم انفجارية', duration: 8 },
        { name: 'تمارين مرونة + ركلات', duration: 10 },
        { name: 'قفز انفجاري + ركلات', duration: 8 },
      ],
      karate: [
        { name: 'ظل كاراتيه (3 جولات)', duration: 9 },
        { name: 'تمارين انفجارية', duration: 10 },
        { name: 'حركات أساسية متكررة', duration: 10 },
        { name: 'لكمات سريعة + حركات قدم', duration: 8 },
        { name: 'نط حبل', duration: 10 },
        { name: 'تمارين كاتا سريعة', duration: 9 },
      ],
      wrestling: [
        { name: 'سباقات انفجارية', duration: 5 },
        { name: 'جري', duration: 20 },
        { name: 'تمارين جسر وانفجار', duration: 10 },
        { name: 'تمارين تدحرج', duration: 10 },
        { name: 'انطلاقات سريعة', duration: 5 },
        { name: 'جري متقطع', duration: 15 },
      ],
      general: goal === 'fat_loss' ? [
        { name: 'مشي سريع', duration: 20 },
        { name: 'HIIT دائري', duration: 15 },
        { name: 'نط حبل', duration: 10 },
        { name: 'جري', duration: 15 },
        { name: 'ركوب دراجة', duration: 15 },
        { name: 'كارديو دائري', duration: 15 },
      ] : goal === 'endurance' ? [
        { name: 'جري', duration: 20 },
        { name: 'نط حبل', duration: 12 },
        { name: 'تمارين هوائية شاملة', duration: 15 },
        { name: 'جري متقطع', duration: 15 },
        { name: 'HIIT خفيف', duration: 12 },
        { name: 'كارديو مطول', duration: 20 },
      ] : [
        { name: 'مشي إحماء', duration: 10 },
        { name: 'تمارين هوائية خفيفة', duration: 10 },
        { name: 'نط حبل', duration: 8 },
        { name: 'جري خفيف', duration: 10 },
        { name: 'حركات إحماء', duration: 10 },
        { name: 'كارديو عام', duration: 10 },
      ],
    }
    const opts = cardioOptions[trainingType] || cardioOptions.general
    return opts[dayIndex % opts.length]
  }

  // Build day-by-day plans based on training type and goal
  const typeFocus = {
    mma: { d1: 'حركات انفجارية + قوة', d2: 'تحمل + كارديو', d3: 'قوة أساسية + قلب', d4: 'حركات MMA وظيفية', d5: 'قوة + كارديو', d6: 'تحمل عالي' },
    boxing: { d1: 'صدر + كتف + ترايسبس', d2: 'ظهر + بايسبس + قلب', d3: 'أرجل + كارديو', d4: 'كتف + ترايسبس + سرعة', d5: 'قوة كاملة', d6: 'كارديو + تحمل' },
    kickboxing: { d1: 'لكمات + ركلات أساسية', d2: 'أرجل + تحمل', d3: 'قوة انفجارية', d4: 'ركلات مركبة', d5: 'لكمات سرعة', d6: 'كارديو كيك بوكس' },
    bjj: { d1: 'سحب + قلب', d2: 'أرجل + تحمل', d3: 'قوة كاملة', d4: 'حركات أرضية', d5: 'سحب + أرجل', d6: 'كارديو + تحمل' },
    muay_thai: { d1: 'أرجل + كارديو', d2: 'دفع + كتف', d3: 'سحب + قلب', d4: 'كارديو + ركلات', d5: 'قوة كاملة', d6: 'تحمل عالي' },
    taekwondo: { d1: 'ركلات عالية + مرونة', d2: 'أرجل + انفجار', d3: 'قوة انفجارية', d4: 'ركلات سريعة', d5: 'تحمل + ركلات', d6: 'كارديو تاي كون دو' },
    karate: { d1: 'لكمات أساسية + وقفات', d2: 'كاتا + حركات', d3: 'قوة انفجارية', d4: 'ركلات + لكمات', d5: 'سرعة + دقة', d6: 'تحمل كاراتيه' },
    wrestling: { d1: 'قوة كاملة', d2: 'انفجار + أرجل', d3: 'سحب + قلب', d4: 'قوة + تحمل', d5: 'أرجل + كارديو', d6: 'كارديو عالي' },
    general: { d1: 'دفع', d2: 'سحب', d3: 'أرجل', d4: 'أعلى جسم', d5: 'أسفل + قلب', d6: 'كارديو' },
  }
  const focus = typeFocus[trainingType] || typeFocus.general

  // Assign exercises to each day based on focus
  const buildDayExercises = (dayIndex, poolCopy) => {
    const count = goal === 'strength' ? 4 : 5
    const start = (dayIndex * 2) % poolCopy.length
    const selected = []
    for (let i = 0; i < count; i++) {
      const idx = (start + i) % poolCopy.length
      selected.push(adjust(poolCopy[idx]))
    }
    return selected
  }

  const dayNames = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس']
  const dayData = []

  for (let i = 0; i < days; i++) {
    const focusText = focus['d' + (i + 1)] || 'تمارين متوازنة'
    const exs = buildDayExercises(i, pool)
    const cardio = dailyCardio(i)
    exs.push({ name: `🔥 كارديو: ${cardio.name}`, durationMinutes: cardio.duration, sets: '-', reps: '-', rest: '-' })
    dayData.push({
      day: `اليوم ${dayNames[i + 1]} — ${focusText}`,
      focus: focusText,
      exercises: exs,
    })
  }

  const split = days <= 3 ? `Full Body — ${days} أيام كامل للجسم` :
    days === 4 ? 'Upper / Lower Split — يوم أعلى + يوم أسفل' :
    'Push / Pull / Legs مكرر'

  const nutriMap = {
    fat_loss: `عجز ${Math.round(bmr * 0.25)} سعرة → ${dailyCalories} سعرة/يوم. بروتين ${protein}ج. كارب 100-150ج. دهون 40ج. خضار غير محدود. موية ${Math.round(w * 0.04)} لتر.`,
    muscle_gain: `فائض ${Math.round(bmr * 0.15)} سعرة → ${dailyCalories} سعرة/يوم. بروتين ${protein}ج. كارب 300ج. دهون 60ج. 5-6 وجبات. موية ${Math.round(w * 0.04)} لتر.`,
    endurance: `${dailyCalories} سعرة/يوم. بروتين ${protein}ج. كارب 300-400ج. دهون 50ج. موية 3.5 لتر.`,
    strength: `${dailyCalories} سعرة/يوم. بروتين ${protein}ج. كارب 250-300ج. دهون 50-60ج.`,
    general: `${dailyCalories} سعرة/يوم. بروتين ${protein}ج. توازن 40% كارب - 30% بروتين - 30% دهون. موية ${Math.round(w * 0.04)} لتر.`,
  }

  return {
    split,
    days: dayData,
    nutrition: nutriMap[goal] || nutriMap.general,
    bmr: `${bmr} سعرة/يوم`,
    dailyCalories: `${dailyCalories} سعرة/يوم`,
    protein: `${protein} جرام/يوم`,
    trainingType: { mma: 'MMA', boxing: 'ملاكمة', kickboxing: 'كيك بوكس', bjj: 'جيوجيتسو', muay_thai: 'مواي تاي', taekwondo: 'تاي كون دو', karate: 'كاراتيه', wrestling: 'مصارعة', general: 'لياقة عامة' }[trainingType] || 'لياقة عامة',
    tips: [
      'الإحماء 10 د قبل كل تمرين — حركات ديناميكية مش ثابتة',
      'الفورم قبل الوزن — إصابة اليوم تدمر شهور من التقدم',
      'النوم 7-9 ساعات مش رفاهية — هو جزء أساسي من التدريب',
      `اشرب ${Math.round(w * 0.04)} لتر مية يومياً — الوزن × 0.04`,
      'سجل تقدمك كل أسبوع — بدون تسجيل مفيش تطور حقيقي',
      goal === 'fat_loss' ? 'خسارة 0.5-1 كجم أسبوعياً واقعي وصحي. مش 5 كجم في أسبوع.' :
      goal === 'muscle_gain' ? 'العضلة بتاخد وقت — 0.5-1 كجم شهرياً تقدم ممتاز.' :
      'الاستمرارية أهم من الشدة — تمرين ضعيف أحسن من عدمه',
    ],
  }
}
