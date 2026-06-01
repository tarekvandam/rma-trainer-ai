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

const SYSTEM_PROMPT_ENG = `You are RMA Trainer AI — an expert in martial arts and fitness.
Your mission: Generate a detailed, 100% personalized training plan based on user data.

Strict rules:
- Use weight, height, and age to calculate appropriate intensity
- Choose exercises based on exactly the available equipment
- Number of days determines the split (3 = full body, 4 = upper/lower, 5+ = PPL)
- Level determines complexity and intensity
- Goal determines exercise type (fat loss = high reps, strength = heavy weights)
- Training type determines movements (MMA = functional movements, boxing = explosive focus)

Most important: Distribute exercises across all training days. Each day has its own specific exercises.

Return reply in JSON format only without any additional text, in the exact structure:
{
  "split": "Split name and explanation",
  "days": [
    {
      "day": "Day 1 - Day name (e.g., Push - Chest & Shoulders)",
      "focus": "Day focus (e.g., Chest + Shoulders + Triceps)",
      "exercises": [
        { "name": "Exercise name", "sets": 4, "reps": "8-12", "rest": "60 seconds" },
        { "name": "🔥 Cardio: Cardio exercise name", "durationMinutes": 10, "sets": "-", "reps": "-", "rest": "-" }
      ]
    }
  ],
  "nutrition": "Personalized nutrition plan based on weight, height and goal",
  "bmr": "Calculated BMR",
  "dailyCalories": "Calories appropriate for goal",
  "protein": "Protein in grams",
  "tips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]
}`

export async function generateWorkoutPlan(formData, lang = 'ar') {
  if (!API_KEY) return getFallbackPlan(formData, lang)

  const { name, weight, height, age, goal, level, days, equipment, trainingType } = formData

  const goalTextAR = { fat_loss: 'حرق دهون', muscle_gain: 'بناء عضلات', endurance: 'تحمل قتالي', strength: 'قوة', general: 'لياقة عامة' }
  const goalTextEN = { fat_loss: 'Fat Loss', muscle_gain: 'Muscle Gain', endurance: 'Combat Endurance', strength: 'Strength', general: 'General Fitness' }
  const levelTextAR = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' }
  const levelTextEN = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
  const equipTextAR = { none: 'بدون أجهزة (bodyweight فقط)', dumbbell: 'دمبل', barbell: 'بار', pullup_bar: 'عقلة', bench: 'كرسي/بنش', step: 'استيب', kettlebell: 'كيتبل', resistance_bands: 'باند مقاومة', cable: 'كابل' }
  const equipTextEN = { none: 'No equipment (bodyweight only)', dumbbell: 'Dumbbell', barbell: 'Barbell', pullup_bar: 'Pull-up Bar', bench: 'Bench', step: 'Step', kettlebell: 'Kettlebell', resistance_bands: 'Resistance Bands', cable: 'Cable' }
  const typeTextAR = { mma: 'MMA', boxing: 'ملاكمة', kickboxing: 'كيك بوكس', bjj: 'جيوجيتسو', muay_thai: 'مواي تاي', taekwondo: 'تاي كون دو', karate: 'كاراتيه', wrestling: 'مصارعة', general: 'لياقة عامة' }
  const typeTextEN = { mma: 'MMA', boxing: 'Boxing', kickboxing: 'Kickboxing', bjj: 'Jiu-Jitsu', muay_thai: 'Muay Thai', taekwondo: 'Taekwondo', karate: 'Karate', wrestling: 'Wrestling', general: 'General Fitness' }

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
          { role: 'system', content: lang === 'en' ? SYSTEM_PROMPT_ENG : SYSTEM_PROMPT },
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
    return getFallbackPlan(formData, lang)
  }
}

function getFallbackPlan(form, lang = 'ar') {
  const w = parseFloat(form.weight) || 75
  const h = parseFloat(form.height) || 175
  const a = parseInt(form.age) || 25
  const days = parseInt(form.days) || 3
  const goal = form.goal || 'general'
  const level = form.level || 'beginner'
  const equipRaw = form.equipment || []
  const equipList = Array.isArray(equipRaw) ? equipRaw : equipRaw ? [equipRaw] : []
  const trainingType = form.trainingType || 'general'

  const bmr = Math.round(10 * w + 6.25 * h - 5 * a + 5)
  const calMap = { fat_loss: bmr * 1.2 - 500, muscle_gain: bmr * 1.55 + 300, endurance: bmr * 1.55, strength: bmr * 1.55 + 100, general: bmr * 1.4 }
  const dailyCalories = Math.round(calMap[goal] || calMap.general)
  const protein = Math.round(w * ({ fat_loss: 2.0, muscle_gain: 2.2, endurance: 1.6, strength: 2.0, general: 1.5 }[goal] || 1.5))

  const exercisePoolsAR = {
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
    dumbbell: [
      { name: 'دمبل بنش برس (Dumbbell Bench Press)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'دمبل ضغط كتف (Shoulder Press)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'دمبل رف (Dumbbell Rows)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'دمبل بايسبس (Bicep Curls)', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'دمبل ترايسبس خلف الرأس (Overhead Ext)', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'دمبل قرفصاء (Goblet Squats)', defSets: 4, defReps: '10-15', defRest: '90 ث' },
      { name: 'دمبل اندفاع (Lunges)', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
      { name: 'دمبل روسيان تويست (Russian Twist)', defSets: 3, defReps: '16-20', defRest: '30 ث' },
      { name: 'دمبل ثراستر (Thrusters)', defSets: 3, defReps: '10-12', defRest: '60 ث' },
      { name: 'دمبل رفع سمانة (Calf Raises)', defSets: 4, defReps: '15-20', defRest: '30 ث' },
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
    ],
    bench: [
      { name: 'انخفاض كرسي (Bench Dips)', defSets: 3, defReps: '12-18', defRest: '45 ث' },
      { name: 'بنش برس (Bench Press — لو النش متوفر)', defSets: 4, defReps: '10-12', defRest: '90 ث' },
      { name: 'قرفصاء بالكرسي (Bulgarian Split Squats)', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
      { name: 'رفع رجلين على كرسي (Leg Raises on Bench)', defSets: 3, defReps: '12-15', defRest: '30 ث' },
      { name: 'اندفاع خلفي بالكرسي (Reverse Lunges)', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
    ],
    step: [
      { name: 'صعود استيب (Step-ups)', defSets: 3, defReps: '12-15 لكل رجل', defRest: '60 ث' },
      { name: 'نط على استيب (Box Jumps)', defSets: 3, defReps: '8-12', defRest: '60 ث' },
      { name: 'اندفاع استيب (Step-back Lunges)', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
      { name: 'صعود استيب بدمبل (Weighted Step-ups)', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
      { name: 'تمارين هوائية على استيب (Step Aerobics)', defSets: 3, defReps: '30 ث', defRest: '15 ث' },
    ],
    cable: [
      { name: 'كابل ترايسبس (Cable Pushdowns)', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'كابل كرانش (Cable Crunches)', defSets: 3, defReps: '15-20', defRest: '30 ث' },
      { name: 'كابل فلای صدر (Cable Chest Fly)', defSets: 4, defReps: '12-15', defRest: '60 ث' },
      { name: 'كابل رف (Cable Rows)', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'كابل بايسبس (Cable Bicep Curls)', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'كابل كتف جانبي (Cable Lateral Raise)', defSets: 4, defReps: '12-15', defRest: '45 ث' },
    ],
  }

  const exercisePoolsEN = {
    none: [
      { name: 'Push-ups', defSets: 3, defReps: '12-20', defRest: '45 ث' },
      { name: 'Diamond Push-ups', defSets: 3, defReps: '10-15', defRest: '45 ث' },
      { name: 'Chair Dips', defSets: 3, defReps: '12-18', defRest: '45 ث' },
      { name: 'Superman Holds', defSets: 3, defReps: '15-20 sec', defRest: '45 ث' },
      { name: 'Bodyweight Squats', defSets: 3, defReps: '20-30', defRest: '60 ث' },
      { name: 'Lunges', defSets: 3, defReps: '12-15 each leg', defRest: '60 ث' },
      { name: 'Glute Bridges', defSets: 3, defReps: '20-25', defRest: '45 ث' },
      { name: 'Plank', defSets: 3, defReps: '30-60 sec', defRest: '30 ث' },
      { name: 'Leg Raises', defSets: 3, defReps: '15-20', defRest: '30 ث' },
      { name: 'Jumping Jacks', defSets: 4, defReps: '45 sec', defRest: '15 ث' },
      { name: 'Mountain Climbers', defSets: 3, defReps: '30 sec', defRest: '20 ث' },
      { name: 'Cobra Stretch', defSets: 2, defReps: '30 sec', defRest: '15 ث' },
    ],
    dumbbell: [
      { name: 'Dumbbell Bench Press', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'Shoulder Press', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'Dumbbell Rows', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'Bicep Curls', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'Overhead Tricep Extension', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'Goblet Squats', defSets: 4, defReps: '10-15', defRest: '90 ث' },
      { name: 'Dumbbell Lunges', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
      { name: 'Russian Twist', defSets: 3, defReps: '16-20', defRest: '30 ث' },
      { name: 'Dumbbell Thrusters', defSets: 3, defReps: '10-12', defRest: '60 ث' },
      { name: 'Calf Raises', defSets: 4, defReps: '15-20', defRest: '30 ث' },
    ],
    barbell: [
      { name: 'Bench Press', defSets: 5, defReps: '8-10', defRest: '90 ث' },
      { name: 'Back Squats', defSets: 5, defReps: '8-10', defRest: '2 min' },
      { name: 'Deadlifts', defSets: 4, defReps: '6-8', defRest: '2-3 min' },
      { name: 'Barbell Rows', defSets: 4, defReps: '8-10', defRest: '90 ث' },
      { name: 'Overhead Press', defSets: 4, defReps: '8-10', defRest: '90 ث' },
      { name: 'Barbell Curls', defSets: 3, defReps: '10-12', defRest: '45 ث' },
      { name: 'Skull Crushers', defSets: 3, defReps: '10-12', defRest: '45 ث' },
      { name: 'Standing Calf Raises', defSets: 4, defReps: '12-15', defRest: '30 ث' },
    ],
    kettlebell: [
      { name: 'Kettlebell Swings', defSets: 4, defReps: '15-20', defRest: '60 ث' },
      { name: 'Goblet Squats', defSets: 4, defReps: '12-15', defRest: '60 ث' },
      { name: 'Clean & Press', defSets: 4, defReps: '8-10 each side', defRest: '60 ث' },
      { name: 'Kettlebell Rows', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'Windmills', defSets: 3, defReps: '8-10', defRest: '45 ث' },
      { name: 'Turkish Get-up', defSets: 3, defReps: '3-5 each side', defRest: '90 ث' },
      { name: 'Russian Twist', defSets: 3, defReps: '16-20', defRest: '30 ث' },
    ],
    resistance_bands: [
      { name: 'Band Chest Press', defSets: 4, defReps: '15-20', defRest: '45 ث' },
      { name: 'Band Rows', defSets: 4, defReps: '15-20', defRest: '45 ث' },
      { name: 'Band Overhead Press', defSets: 4, defReps: '15-20', defRest: '45 ث' },
      { name: 'Band Squats', defSets: 4, defReps: '20-25', defRest: '45 ث' },
      { name: 'Band Curls', defSets: 3, defReps: '15-20', defRest: '30 ث' },
      { name: 'Lateral Walks', defSets: 3, defReps: '12-15 each dir', defRest: '30 ث' },
      { name: 'Band Crunches', defSets: 3, defReps: '20-25', defRest: '30 ث' },
    ],
    pullup_bar: [
      { name: 'Pull-ups', defSets: 4, defReps: '6-12', defRest: '90 ث' },
      { name: 'Chin-ups', defSets: 4, defReps: '6-12', defRest: '90 ث' },
      { name: 'Australian Rows', defSets: 3, defReps: '12-15', defRest: '60 ث' },
      { name: 'V-Grip Pull-ups', defSets: 3, defReps: '8-10', defRest: '60 ث' },
      { name: 'Hanging Leg Raises', defSets: 3, defReps: '10-15', defRest: '45 ث' },
    ],
    bench: [
      { name: 'Bench Dips', defSets: 3, defReps: '12-18', defRest: '45 ث' },
      { name: 'Bench Press', defSets: 4, defReps: '10-12', defRest: '90 ث' },
      { name: 'Bulgarian Split Squats', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
      { name: 'Leg Raises on Bench', defSets: 3, defReps: '12-15', defRest: '30 ث' },
      { name: 'Reverse Lunges', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
    ],
    step: [
      { name: 'Step-ups', defSets: 3, defReps: '12-15 each leg', defRest: '60 ث' },
      { name: 'Box Jumps', defSets: 3, defReps: '8-12', defRest: '60 ث' },
      { name: 'Step-back Lunges', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
      { name: 'Weighted Step-ups', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
      { name: 'Step Aerobics', defSets: 3, defReps: '30 sec', defRest: '15 ث' },
    ],
    cable: [
      { name: 'Cable Pushdowns', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'Cable Crunches', defSets: 3, defReps: '15-20', defRest: '30 ث' },
      { name: 'Cable Chest Fly', defSets: 4, defReps: '12-15', defRest: '60 ث' },
      { name: 'Cable Rows', defSets: 4, defReps: '10-12', defRest: '60 ث' },
      { name: 'Cable Bicep Curls', defSets: 3, defReps: '12-15', defRest: '45 ث' },
      { name: 'Cable Lateral Raise', defSets: 4, defReps: '12-15', defRest: '45 ث' },
    ],
  }

  const exercisePools = lang === 'en' ? exercisePoolsEN : exercisePoolsAR

  // Merge pools from selected equipment (always include none/bodyweight as base)
  const selectedEquip = equipList.length > 0 ? equipList : ['none']
  const seen = new Set()
  const mergedPool = []
  selectedEquip.forEach(eq => {
    const pool = exercisePools[eq] || []
    pool.forEach(ex => {
      if (!seen.has(ex.name)) {
        seen.add(ex.name)
        mergedPool.push(ex)
      }
    })
  })
  // Always include bodyweight as base if more pools exist
  if (selectedEquip.length > 1 && !selectedEquip.includes('none')) {
    exercisePools.none.forEach(ex => {
      if (!seen.has(ex.name)) {
        seen.add(ex.name)
        mergedPool.push(ex)
      }
    })
  }

  const pool = mergedPool.length > 0 ? mergedPool : exercisePools.none

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
  const cardioOptionsAR = {
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

  const cardioOptionsEN = {
    mma: [
      { name: 'Shadow Fighting HIIT (3 rounds)', duration: 9 },
      { name: 'Jump Rope + Burpees', duration: 10 },
      { name: 'Interval Sprawls', duration: 10 },
      { name: 'Explosive Sprints', duration: 8 },
      { name: 'HIIT Intervals (4 circuits)', duration: 10 },
      { name: 'Explosive Shadow Fighting', duration: 9 },
    ],
    boxing: [
      { name: 'Jump Rope', duration: 10 },
      { name: 'Shadow Boxing (3 rounds)', duration: 9 },
      { name: 'Fast Footwork', duration: 10 },
      { name: 'Jump Rope Intervals', duration: 10 },
      { name: 'Explosive Push-ups + Jumps', duration: 10 },
      { name: 'Speed Shadow (4 rounds)', duration: 8 },
    ],
    kickboxing: [
      { name: 'Shadow Kickboxing (3 rounds)', duration: 9 },
      { name: 'Jump Rope + Kicks', duration: 10 },
      { name: 'Multi-directional Kicks', duration: 8 },
      { name: 'Punches + Kicks Combo', duration: 10 },
      { name: 'HIIT Kickboxing', duration: 10 },
      { name: 'Fast Shadow Fighting', duration: 9 },
    ],
    bjj: [
      { name: 'Ground Crawling Drills', duration: 10 },
      { name: 'Running', duration: 15 },
      { name: 'Sprawl Drills', duration: 10 },
      { name: 'Explosive Squats', duration: 10 },
      { name: 'Ground HIIT (4 circuits)', duration: 10 },
      { name: 'Ground Endurance', duration: 15 },
    ],
    muay_thai: [
      { name: 'Shadow Muay Thai (3 rounds)', duration: 9 },
      { name: 'Multi-directional Kicks', duration: 5 },
      { name: 'Jump Rope + Kicks', duration: 10 },
      { name: 'Fast Shadow Kicks', duration: 8 },
      { name: 'Fast Leg Switching', duration: 10 },
      { name: 'Combo Kicks + Jump Rope', duration: 10 },
    ],
    taekwondo: [
      { name: 'Fast Kicking Drills', duration: 10 },
      { name: 'Shadow Taekwondo (3 rounds)', duration: 8 },
      { name: 'Jump Rope + High Kicks', duration: 10 },
      { name: 'Explosive Footwork', duration: 8 },
      { name: 'Flexibility + Kicks', duration: 10 },
      { name: 'Explosive Jumps + Kicks', duration: 8 },
    ],
    karate: [
      { name: 'Shadow Karate (3 rounds)', duration: 9 },
      { name: 'Explosive Drills', duration: 10 },
      { name: 'Repetitive Basics', duration: 10 },
      { name: 'Fast Punches + Footwork', duration: 8 },
      { name: 'Jump Rope', duration: 10 },
      { name: 'Fast Kata Drills', duration: 9 },
    ],
    wrestling: [
      { name: 'Explosive Sprints', duration: 5 },
      { name: 'Running', duration: 20 },
      { name: 'Bridge + Explosion Drills', duration: 10 },
      { name: 'Rolling Drills', duration: 10 },
      { name: 'Quick Shots', duration: 5 },
      { name: 'Interval Running', duration: 15 },
    ],
    general: goal === 'fat_loss' ? [
      { name: 'Brisk Walking', duration: 20 },
      { name: 'HIIT Circuit', duration: 15 },
      { name: 'Jump Rope', duration: 10 },
      { name: 'Running', duration: 15 },
      { name: 'Cycling', duration: 15 },
      { name: 'Cardio Circuit', duration: 15 },
    ] : goal === 'endurance' ? [
      { name: 'Running', duration: 20 },
      { name: 'Jump Rope', duration: 12 },
      { name: 'Comprehensive Aerobics', duration: 15 },
      { name: 'Interval Running', duration: 15 },
      { name: 'Light HIIT', duration: 12 },
      { name: 'Extended Cardio', duration: 20 },
    ] : [
      { name: 'Warm-up Walk', duration: 10 },
      { name: 'Light Aerobics', duration: 10 },
      { name: 'Jump Rope', duration: 8 },
      { name: 'Light Jog', duration: 10 },
      { name: 'Warm-up Moves', duration: 10 },
      { name: 'General Cardio', duration: 10 },
    ],
  }

  const dailyCardio = (dayIndex) => {
    const cardioOptions = lang === 'en' ? cardioOptionsEN : cardioOptionsAR
    const opts = cardioOptions[trainingType] || cardioOptions.general
    return opts[dayIndex % opts.length]
  }

  // Build day-by-day plans based on training type and goal
  const typeFocusAR = {
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
  const typeFocusEN = {
    mma: { d1: 'Explosive Movements + Strength', d2: 'Endurance + Cardio', d3: 'Core Strength + Abs', d4: 'Functional MMA Movements', d5: 'Strength + Cardio', d6: 'High Endurance' },
    boxing: { d1: 'Chest + Shoulders + Triceps', d2: 'Back + Biceps + Core', d3: 'Legs + Cardio', d4: 'Shoulders + Triceps + Speed', d5: 'Full Strength', d6: 'Cardio + Endurance' },
    kickboxing: { d1: 'Basic Punches + Kicks', d2: 'Legs + Endurance', d3: 'Explosive Strength', d4: 'Combo Kicks', d5: 'Speed Punches', d6: 'Kickboxing Cardio' },
    bjj: { d1: 'Pulling + Core', d2: 'Legs + Endurance', d3: 'Full Strength', d4: 'Ground Movements', d5: 'Pulling + Legs', d6: 'Cardio + Endurance' },
    muay_thai: { d1: 'Legs + Cardio', d2: 'Push + Shoulders', d3: 'Pull + Core', d4: 'Cardio + Kicks', d5: 'Full Strength', d6: 'High Endurance' },
    taekwondo: { d1: 'High Kicks + Flexibility', d2: 'Legs + Explosion', d3: 'Explosive Strength', d4: 'Fast Kicks', d5: 'Endurance + Kicks', d6: 'Taekwondo Cardio' },
    karate: { d1: 'Basic Punches + Stances', d2: 'Kata + Movements', d3: 'Explosive Strength', d4: 'Kicks + Punches', d5: 'Speed + Precision', d6: 'Karate Endurance' },
    wrestling: { d1: 'Full Strength', d2: 'Explosion + Legs', d3: 'Pull + Core', d4: 'Strength + Endurance', d5: 'Legs + Cardio', d6: 'High Cardio' },
    general: { d1: 'Push', d2: 'Pull', d3: 'Legs', d4: 'Upper Body', d5: 'Lower Body + Core', d6: 'Cardio' },
  }
  const typeFocus = lang === 'en' ? typeFocusEN : typeFocusAR
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

  const dayNamesAR = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس']
  const dayNamesEN = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six']
  const dayNames = lang === 'en' ? dayNamesEN : dayNamesAR
  const dayData = []

  for (let i = 0; i < days; i++) {
    const focusText = focus['d' + (i + 1)] || (lang === 'en' ? 'Balanced exercises' : 'تمارين متوازنة')
    const exs = buildDayExercises(i, pool)
    const cardio = dailyCardio(i)
    exs.push({ name: `🔥 ${lang === 'en' ? 'Cardio' : 'كارديو'}: ${cardio.name}`, durationMinutes: cardio.duration, sets: '-', reps: '-', rest: '-' })
    dayData.push({
      day: lang === 'en' ? `Day ${dayNames[i + 1]} — ${focusText}` : `اليوم ${dayNames[i + 1]} — ${focusText}`,
      focus: focusText,
      exercises: exs,
    })
  }

  const split = lang === 'en'
    ? (days <= 3 ? `Full Body — ${days}-Day Full Body` :
       days === 4 ? 'Upper / Lower Split — Upper Day + Lower Day' :
       'Push / Pull / Legs Rotation')
    : (days <= 3 ? `Full Body — ${days} أيام كامل للجسم` :
       days === 4 ? 'Upper / Lower Split — يوم أعلى + يوم أسفل' :
       'Push / Pull / Legs مكرر')

  const nutriMapAR = {
    fat_loss: `عجز ${Math.round(bmr * 0.25)} سعرة → ${dailyCalories} سعرة/يوم. بروتين ${protein}ج. كارب 100-150ج. دهون 40ج. خضار غير محدود. موية ${Math.round(w * 0.04)} لتر.`,
    muscle_gain: `فائض ${Math.round(bmr * 0.15)} سعرة → ${dailyCalories} سعرة/يوم. بروتين ${protein}ج. كارب 300ج. دهون 60ج. 5-6 وجبات. موية ${Math.round(w * 0.04)} لتر.`,
    endurance: `${dailyCalories} سعرة/يوم. بروتين ${protein}ج. كارب 300-400ج. دهون 50ج. موية 3.5 لتر.`,
    strength: `${dailyCalories} سعرة/يوم. بروتين ${protein}ج. كارب 250-300ج. دهون 50-60ج.`,
    general: `${dailyCalories} سعرة/يوم. بروتين ${protein}ج. توازن 40% كارب - 30% بروتين - 30% دهون. موية ${Math.round(w * 0.04)} لتر.`,
  }

  const nutriMapEN = {
    fat_loss: `Deficit ${Math.round(bmr * 0.25)} cal → ${dailyCalories} cal/day. Protein ${protein}g. Carbs 100-150g. Fat 40g. Unlimited veggies. Water ${Math.round(w * 0.04)}L.`,
    muscle_gain: `Surplus ${Math.round(bmr * 0.15)} cal → ${dailyCalories} cal/day. Protein ${protein}g. Carbs 300g. Fat 60g. 5-6 meals. Water ${Math.round(w * 0.04)}L.`,
    endurance: `${dailyCalories} cal/day. Protein ${protein}g. Carbs 300-400g. Fat 50g. Water 3.5L.`,
    strength: `${dailyCalories} cal/day. Protein ${protein}g. Carbs 250-300g. Fat 50-60g.`,
    general: `${dailyCalories} cal/day. Protein ${protein}g. Balance 40% carbs - 30% protein - 30% fat. Water ${Math.round(w * 0.04)}L.`,
  }

  const nutriMap = lang === 'en' ? nutriMapEN : nutriMapAR

  const tipsAR = [
    'الإحماء 10 د قبل كل تمرين — حركات ديناميكية مش ثابتة',
    'الفورم قبل الوزن — إصابة اليوم تدمر شهور من التقدم',
    'النوم 7-9 ساعات مش رفاهية — هو جزء أساسي من التدريب',
    `اشرب ${Math.round(w * 0.04)} لتر مية يومياً — الوزن × 0.04`,
    'سجل تقدمك كل أسبوع — بدون تسجيل مفيش تطور حقيقي',
    goal === 'fat_loss' ? 'خسارة 0.5-1 كجم أسبوعياً واقعي وصحي. مش 5 كجم في أسبوع.' :
    goal === 'muscle_gain' ? 'العضلة بتاخد وقت — 0.5-1 كجم شهرياً تقدم ممتاز.' :
    'الاستمرارية أهم من الشدة — تمرين ضعيف أحسن من عدمه',
  ]

  const tipsEN = [
    'Warm up 10 min before every session — dynamic movements, not static',
    'Form over weight — one bad rep can ruin months of progress',
    'Sleep 7-9 hours is not a luxury — it is an essential part of training',
    `Drink ${Math.round(w * 0.04)}L of water daily — weight × 0.04`,
    'Track your progress every week — no tracking, no real progress',
    goal === 'fat_loss' ? 'Losing 0.5-1 kg per week is realistic and healthy. Not 5 kg in a week.' :
    goal === 'muscle_gain' ? 'Muscle takes time — 0.5-1 kg per month is excellent progress.' :
    'Consistency beats intensity — a weak workout is better than none',
  ]

  return {
    split,
    days: dayData,
    nutrition: nutriMap[goal] || nutriMap.general,
    bmr: lang === 'en' ? `${bmr} cal/day` : `${bmr} سعرة/يوم`,
    dailyCalories: lang === 'en' ? `${dailyCalories} cal/day` : `${dailyCalories} سعرة/يوم`,
    protein: lang === 'en' ? `${protein} g/day` : `${protein} جرام/يوم`,
    trainingType: lang === 'en'
      ? ({ mma: 'MMA', boxing: 'Boxing', kickboxing: 'Kickboxing', bjj: 'Jiu-Jitsu', muay_thai: 'Muay Thai', taekwondo: 'Taekwondo', karate: 'Karate', wrestling: 'Wrestling', general: 'General Fitness' }[trainingType] || 'General Fitness')
      : ({ mma: 'MMA', boxing: 'ملاكمة', kickboxing: 'كيك بوكس', bjj: 'جيوجيتسو', muay_thai: 'مواي تاي', taekwondo: 'تاي كون دو', karate: 'كاراتيه', wrestling: 'مصارعة', general: 'لياقة عامة' }[trainingType] || 'لياقة عامة'),
    tips: lang === 'en' ? tipsEN : tipsAR,
  }
}
