const exercisePoolsAR = {
  none: [
    { name: 'تمرين الضغط (Push-ups)', cat: 'push', type: 'compound', defSets: 3, defReps: '12-20', defRest: '45 ث' },
    { name: 'تمرين الضغط بالكوع ضيق (Diamond Push-ups)', cat: 'push', type: 'compound', defSets: 3, defReps: '10-15', defRest: '45 ث' },
    { name: 'انخفاض كرسي (Chair Dips)', cat: 'push', type: 'compound', defSets: 3, defReps: '12-18', defRest: '45 ث' },
    { name: 'سوبرمان (Superman Holds)', cat: 'core', type: 'isolation', defSets: 3, defReps: '15-20 ث', defRest: '45 ث' },
    { name: 'قرفصاء هواء (Bodyweight Squats)', cat: 'legs', type: 'compound', defSets: 3, defReps: '20-30', defRest: '60 ث' },
    { name: 'اندفاع (Lunges)', cat: 'legs', type: 'compound', defSets: 3, defReps: '12-15 لكل رجل', defRest: '60 ث' },
    { name: 'رفع الحوض (Glute Bridges)', cat: 'legs', type: 'isolation', defSets: 3, defReps: '20-25', defRest: '45 ث' },
    { name: 'بلانك (Plank)', cat: 'core', type: 'isolation', defSets: 3, defReps: '30-60 ث', defRest: '30 ث' },
    { name: 'رفع رجلين (Leg Raises)', cat: 'core', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '30 ث' },
    { name: 'نط (Jumping Jacks)', cat: 'core', type: 'isolation', defSets: 4, defReps: '45 ث', defRest: '15 ث' },
    { name: 'متسلق الجبال (Mountain Climbers)', cat: 'core', type: 'isolation', defSets: 3, defReps: '30 ث', defRest: '20 ث' },
    { name: 'تمدد ظهر (Cobra Stretch)', cat: 'core', type: 'isolation', defSets: 2, defReps: '30 ث', defRest: '15 ث' },
    { name: 'رفع سمانة (Calf Raises)', cat: 'legs', type: 'isolation', defSets: 4, defReps: '15-20', defRest: '30 ث' },
    { name: 'ضغط بايك (Pike Push-ups)', cat: 'push', type: 'compound', defSets: 3, defReps: '10-15', defRest: '60 ث' },
    { name: 'رفع حوض برجل واحدة (Single Leg Glute Bridge)', cat: 'legs', type: 'isolation', defSets: 3, defReps: '12-15 لكل رجل', defRest: '45 ث' },
  ],
  dumbbell: [
    { name: 'دمبل بنش برس (Dumbbell Bench Press)', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'دمبل ضغط كتف (Shoulder Press)', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'دمبل رف (Dumbbell Rows)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'دمبل بايسبس (Bicep Curls)', cat: 'pull', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
    { name: 'دمبل ترايسبس خلفي (Overhead Tricep Ext)', cat: 'push', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
    { name: 'دمبل قرفصاء كوب (Goblet Squats)', cat: 'legs', type: 'compound', defSets: 4, defReps: '10-15', defRest: '90 ث' },
    { name: 'دمبل اندفاع (Dumbbell Lunges)', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
    { name: 'دمبل روسيان تويست (Russian Twist)', cat: 'core', type: 'isolation', defSets: 3, defReps: '16-20', defRest: '30 ث' },
    { name: 'دمبل ثراستر (Dumbbell Thrusters)', cat: 'push', type: 'compound', defSets: 3, defReps: '10-12', defRest: '60 ث' },
    { name: 'دمبل رفع جانبي (Dumbbell Lateral Raise)', cat: 'push', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '45 ث' },
    { name: 'دمبل رفع خلفي (Dumbbell Rear Delt Fly)', cat: 'pull', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '45 ث' },
    { name: 'دمبل رفع سمانة (Calf Raises)', cat: 'legs', type: 'isolation', defSets: 4, defReps: '15-20', defRest: '30 ث' },
  ],
  barbell: [
    { name: 'بار بنش برس (Bench Press)', cat: 'push', type: 'compound', defSets: 5, defReps: '8-10', defRest: '90 ث' },
    { name: 'بار قرفصاء (Back Squats)', cat: 'legs', type: 'compound', defSets: 5, defReps: '8-10', defRest: '2 د' },
    { name: 'بار رف ميت (Deadlifts)', cat: 'legs', type: 'compound', defSets: 4, defReps: '6-8', defRest: '2-3 د' },
    { name: 'بار رف (Barbell Rows)', cat: 'pull', type: 'compound', defSets: 4, defReps: '8-10', defRest: '90 ث' },
    { name: 'بار ضغط كتف (Overhead Press)', cat: 'push', type: 'compound', defSets: 4, defReps: '8-10', defRest: '90 ث' },
    { name: 'بار بايسبس (Barbell Curls)', cat: 'pull', type: 'isolation', defSets: 3, defReps: '10-12', defRest: '45 ث' },
    { name: 'بار ترايسبس (Skull Crushers)', cat: 'push', type: 'isolation', defSets: 3, defReps: '10-12', defRest: '45 ث' },
    { name: 'بار رفع سمانة واقف (Standing Calf)', cat: 'legs', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '30 ث' },
  ],
  kettlebell: [
    { name: 'كيتبل سوينغ (Swings)', cat: 'legs', type: 'compound', defSets: 4, defReps: '15-20', defRest: '60 ث' },
    { name: 'كيتبل قرفصاء (Goblet Squats)', cat: 'legs', type: 'compound', defSets: 4, defReps: '12-15', defRest: '60 ث' },
    { name: 'كيتبل كلين وبريس (Clean & Press)', cat: 'push', type: 'compound', defSets: 4, defReps: '8-10 لكل جانب', defRest: '60 ث' },
    { name: 'كيتبل رف (Rows)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'كيتبل ويندميل (Windmills)', cat: 'core', type: 'isolation', defSets: 3, defReps: '8-10', defRest: '45 ث' },
    { name: 'كيتبل تركش جيت (Turkish Get-up)', cat: 'push', type: 'compound', defSets: 3, defReps: '3-5 لكل جانب', defRest: '90 ث' },
    { name: 'كيتبل روسيان تويست (Russian Twist)', cat: 'core', type: 'isolation', defSets: 3, defReps: '16-20', defRest: '30 ث' },
  ],
  resistance_bands: [
    { name: 'باند بنش برس (Band Chest Press)', cat: 'push', type: 'compound', defSets: 4, defReps: '15-20', defRest: '45 ث' },
    { name: 'باند رف (Band Rows)', cat: 'pull', type: 'compound', defSets: 4, defReps: '15-20', defRest: '45 ث' },
    { name: 'باند ضغط كتف (Band OHP)', cat: 'push', type: 'compound', defSets: 4, defReps: '15-20', defRest: '45 ث' },
    { name: 'باند قرفصاء (Band Squats)', cat: 'legs', type: 'compound', defSets: 4, defReps: '20-25', defRest: '45 ث' },
    { name: 'باند بايسبس (Band Curls)', cat: 'pull', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '30 ث' },
    { name: 'باند مشي جانبي (Lateral Walks)', cat: 'legs', type: 'isolation', defSets: 3, defReps: '12-15 كل اتجاه', defRest: '30 ث' },
    { name: 'باند كرانش (Band Crunches)', cat: 'core', type: 'isolation', defSets: 3, defReps: '20-25', defRest: '30 ث' },
    { name: 'باند تمديد ترايسبس (Band Triceps Extension)', cat: 'push', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '45 ث' },
    { name: 'باند هامر كرل (Band Hammer Curls)', cat: 'pull', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '45 ث' },
    { name: 'باند صف انحناء (Band Bent-over Rows)', cat: 'pull', type: 'compound', defSets: 4, defReps: '15-20', defRest: '45 ث' },
    { name: 'باند صف يد واحدة (Band One-arm Rows)', cat: 'pull', type: 'compound', defSets: 4, defReps: '15-20 لكل يد', defRest: '60 ث' },
    { name: 'باند قرفصاء كوب (Band Goblet Squats)', cat: 'legs', type: 'compound', defSets: 4, defReps: '20-25', defRest: '60 ث' },
    { name: 'باند رومانيان ديد (Band Romanian Deadlifts)', cat: 'legs', type: 'compound', defSets: 4, defReps: '15-20', defRest: '60 ث' },
    { name: 'باند تركيز كرل (Band Concentration Curls)', cat: 'pull', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '30 ث' },
    { name: 'باند تمديد ترايسبس علوي (Band Overhead Triceps Extension)', cat: 'push', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '45 ث' },
    { name: 'باند ضغط كتف جلوس (Band Seated Shoulder Press)', cat: 'push', type: 'compound', defSets: 4, defReps: '15-20', defRest: '60 ث' },
  ],
  pullup_bar: [
    { name: 'عقلة واسعة (Pull-ups)', cat: 'pull', type: 'compound', defSets: 4, defReps: '6-12', defRest: '90 ث' },
    { name: 'عقلة عكسية (Chin-ups)', cat: 'pull', type: 'compound', defSets: 4, defReps: '6-12', defRest: '90 ث' },
    { name: 'عقلة أسترالية (Australian Rows)', cat: 'pull', type: 'compound', defSets: 3, defReps: '12-15', defRest: '60 ث' },
    { name: 'عقلة مثلث (V-Grip Pull-ups)', cat: 'pull', type: 'compound', defSets: 3, defReps: '8-10', defRest: '60 ث' },
    { name: 'رفع رجلين معلق (Hanging Leg Raises)', cat: 'core', type: 'isolation', defSets: 3, defReps: '10-15', defRest: '45 ث' },
  ],
  bench: [
    { name: 'انخفاض كرسي (Bench Dips)', cat: 'push', type: 'compound', defSets: 3, defReps: '12-18', defRest: '45 ث' },
    { name: 'بنش برس (Bench Press — لو النش متوفر)', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '90 ث' },
    { name: 'قرفصاء بالكرسي (Bulgarian Split Squats)', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
    { name: 'رفع رجلين على كرسي (Leg Raises on Bench)', cat: 'core', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '30 ث' },
    { name: 'اندفاع خلفي بالكرسي (Reverse Lunges)', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
  ],
  step: [
    { name: 'صعود استيب (Step-ups)', cat: 'legs', type: 'compound', defSets: 3, defReps: '12-15 لكل رجل', defRest: '60 ث' },
    { name: 'نط على استيب (Box Jumps)', cat: 'legs', type: 'compound', defSets: 3, defReps: '8-12', defRest: '60 ث' },
    { name: 'اندفاع استيب (Step-back Lunges)', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
    { name: 'صعود استيب بدمبل (Weighted Step-ups)', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 لكل رجل', defRest: '60 ث' },
    { name: 'تمارين هوائية على استيب (Step Aerobics)', cat: 'legs', type: 'isolation', defSets: 3, defReps: '30 ث', defRest: '15 ث' },
  ],
  cable: [
    { name: 'كابل ترايسبس (Cable Pushdowns)', cat: 'push', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
    { name: 'كابل كرانش (Cable Crunches)', cat: 'core', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '30 ث' },
    { name: 'كابل فلای صدر (Cable Chest Fly)', cat: 'push', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '60 ث' },
    { name: 'كابل رف (Cable Rows)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'كابل بايسبس (Cable Bicep Curls)', cat: 'pull', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
    { name: 'كابل كتف جانبي (Cable Lateral Raise)', cat: 'push', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '45 ث' },
  ],
  gym_machine: [
    { name: 'جهاز صدر (Chest Press Machine)', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'جهاز سحب علوي (Lat Pulldown)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'جهاز دفع أرجل (Leg Press Machine)', cat: 'legs', type: 'compound', defSets: 5, defReps: '10-15', defRest: '90 ث' },
    { name: 'جهاز تمديد رجل (Leg Extension)', cat: 'legs', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '60 ث' },
    { name: 'جهاز ثني رجل (Leg Curl)', cat: 'legs', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '60 ث' },
    { name: 'جهاز كتف (Shoulder Press Machine)', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'جهاز ظهر (Seated Row Machine)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'جهاز صدر فراشة (Pec Deck Fly)', cat: 'push', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '45 ث' },
  ],
  leg_press: [
    { name: 'ليج بريس (Leg Press)', cat: 'legs', type: 'compound', defSets: 5, defReps: '10-15', defRest: '90 ث' },
    { name: 'سمانة على ليج بريس (Calf Raises on Leg Press)', cat: 'legs', type: 'isolation', defSets: 5, defReps: '15-20', defRest: '45 ث' },
    { name: 'ليج بريس برجل واحدة (Single Leg Press)', cat: 'legs', type: 'compound', defSets: 4, defReps: '10-12 لكل رجل', defRest: '60 ث' },
    { name: 'ليج بريس مائل (Incline Leg Press)', cat: 'legs', type: 'compound', defSets: 4, defReps: '12-15', defRest: '90 ث' },
    { name: 'هوريزونتال ليج بريس (Horizontal Leg Press)', cat: 'legs', type: 'compound', defSets: 4, defReps: '12-15', defRest: '60 ث' },
  ],
  lat_pulldown: [
    { name: 'لات بول داون أمامي (Front Lat Pulldown)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'لات بول داون خلفي (Behind Neck Pulldown)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'قبضة عكسية لات (Reverse Grip Pulldown)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'قبضة ضيقة لات (V-Grip Pulldown)', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'سحب كابل وجه (Face Pull)', cat: 'pull', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
  ],
  smith_machine: [
    { name: 'سميث مشين سكوات (Smith Machine Squat)', cat: 'legs', type: 'compound', defSets: 5, defReps: '8-10', defRest: '90 ث' },
    { name: 'سميث مشين بنش (Smith Machine Bench Press)', cat: 'push', type: 'compound', defSets: 4, defReps: '8-10', defRest: '90 ث' },
    { name: 'سميث مشين كتف (Smith Machine Shoulder Press)', cat: 'push', type: 'compound', defSets: 4, defReps: '8-10', defRest: '60 ث' },
    { name: 'سميث مشين اندفاع (Smith Machine Lunges)', cat: 'legs', type: 'compound', defSets: 4, defReps: '10-12 لكل رجل', defRest: '60 ث' },
    { name: 'سميث مشين رومانيان (Smith Machine RDL)', cat: 'legs', type: 'compound', defSets: 4, defReps: '10-12', defRest: '90 ث' },
    { name: 'سميث مشين سمّانة (Smith Machine Calf Raises)', cat: 'legs', type: 'isolation', defSets: 4, defReps: '15-20', defRest: '30 ث' },
  ],
}

const exercisePoolsEN = {
  none: [
    { name: 'Push-ups', cat: 'push', type: 'compound', defSets: 3, defReps: '12-20', defRest: '45 ث' },
    { name: 'Diamond Push-ups', cat: 'push', type: 'compound', defSets: 3, defReps: '10-15', defRest: '45 ث' },
    { name: 'Chair Dips', cat: 'push', type: 'compound', defSets: 3, defReps: '12-18', defRest: '45 ث' },
    { name: 'Superman Holds', cat: 'core', type: 'isolation', defSets: 3, defReps: '15-20 sec', defRest: '45 ث' },
    { name: 'Bodyweight Squats', cat: 'legs', type: 'compound', defSets: 3, defReps: '20-30', defRest: '60 ث' },
    { name: 'Lunges', cat: 'legs', type: 'compound', defSets: 3, defReps: '12-15 each leg', defRest: '60 ث' },
    { name: 'Glute Bridges', cat: 'legs', type: 'isolation', defSets: 3, defReps: '20-25', defRest: '45 ث' },
    { name: 'Plank', cat: 'core', type: 'isolation', defSets: 3, defReps: '30-60 sec', defRest: '30 ث' },
    { name: 'Leg Raises', cat: 'core', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '30 ث' },
    { name: 'Jumping Jacks', cat: 'core', type: 'isolation', defSets: 4, defReps: '45 sec', defRest: '15 ث' },
    { name: 'Mountain Climbers', cat: 'core', type: 'isolation', defSets: 3, defReps: '30 sec', defRest: '20 ث' },
    { name: 'Cobra Stretch', cat: 'core', type: 'isolation', defSets: 2, defReps: '30 sec', defRest: '15 ث' },
    { name: 'Calf Raises', cat: 'legs', type: 'isolation', defSets: 4, defReps: '15-20', defRest: '30 ث' },
    { name: 'Pike Push-ups', cat: 'push', type: 'compound', defSets: 3, defReps: '10-15', defRest: '60 ث' },
    { name: 'Single Leg Glute Bridge', cat: 'legs', type: 'isolation', defSets: 3, defReps: '12-15 each leg', defRest: '45 ث' },
  ],
  dumbbell: [
    { name: 'Dumbbell Bench Press', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Shoulder Press', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Dumbbell Rows', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Bicep Curls', cat: 'pull', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
    { name: 'Overhead Tricep Extension', cat: 'push', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
    { name: 'Goblet Squats', cat: 'legs', type: 'compound', defSets: 4, defReps: '10-15', defRest: '90 ث' },
    { name: 'Dumbbell Lunges', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
    { name: 'Russian Twist', cat: 'core', type: 'isolation', defSets: 3, defReps: '16-20', defRest: '30 ث' },
    { name: 'Dumbbell Thrusters', cat: 'push', type: 'compound', defSets: 3, defReps: '10-12', defRest: '60 ث' },
    { name: 'Dumbbell Lateral Raise', cat: 'push', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '45 ث' },
    { name: 'Dumbbell Rear Delt Fly', cat: 'pull', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '45 ث' },
    { name: 'Calf Raises', cat: 'legs', type: 'isolation', defSets: 4, defReps: '15-20', defRest: '30 ث' },
  ],
  barbell: [
    { name: 'Bench Press', cat: 'push', type: 'compound', defSets: 5, defReps: '8-10', defRest: '90 ث' },
    { name: 'Back Squats', cat: 'legs', type: 'compound', defSets: 5, defReps: '8-10', defRest: '2 min' },
    { name: 'Deadlifts', cat: 'legs', type: 'compound', defSets: 4, defReps: '6-8', defRest: '2-3 min' },
    { name: 'Barbell Rows', cat: 'pull', type: 'compound', defSets: 4, defReps: '8-10', defRest: '90 ث' },
    { name: 'Overhead Press', cat: 'push', type: 'compound', defSets: 4, defReps: '8-10', defRest: '90 ث' },
    { name: 'Barbell Curls', cat: 'pull', type: 'isolation', defSets: 3, defReps: '10-12', defRest: '45 ث' },
    { name: 'Skull Crushers', cat: 'push', type: 'isolation', defSets: 3, defReps: '10-12', defRest: '45 ث' },
    { name: 'Standing Calf Raises', cat: 'legs', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '30 ث' },
  ],
  kettlebell: [
    { name: 'Kettlebell Swings', cat: 'legs', type: 'compound', defSets: 4, defReps: '15-20', defRest: '60 ث' },
    { name: 'Goblet Squats', cat: 'legs', type: 'compound', defSets: 4, defReps: '12-15', defRest: '60 ث' },
    { name: 'Clean & Press', cat: 'push', type: 'compound', defSets: 4, defReps: '8-10 each side', defRest: '60 ث' },
    { name: 'Kettlebell Rows', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Windmills', cat: 'core', type: 'isolation', defSets: 3, defReps: '8-10', defRest: '45 ث' },
    { name: 'Turkish Get-up', cat: 'push', type: 'compound', defSets: 3, defReps: '3-5 each side', defRest: '90 ث' },
    { name: 'Russian Twist', cat: 'core', type: 'isolation', defSets: 3, defReps: '16-20', defRest: '30 ث' },
  ],
  resistance_bands: [
    { name: 'Band Chest Press', cat: 'push', type: 'compound', defSets: 4, defReps: '15-20', defRest: '45 ث' },
    { name: 'Band Rows', cat: 'pull', type: 'compound', defSets: 4, defReps: '15-20', defRest: '45 ث' },
    { name: 'Band Overhead Press', cat: 'push', type: 'compound', defSets: 4, defReps: '15-20', defRest: '45 ث' },
    { name: 'Band Squats', cat: 'legs', type: 'compound', defSets: 4, defReps: '20-25', defRest: '45 ث' },
    { name: 'Band Curls', cat: 'pull', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '30 ث' },
    { name: 'Lateral Walks', cat: 'legs', type: 'isolation', defSets: 3, defReps: '12-15 each dir', defRest: '30 ث' },
    { name: 'Band Crunches', cat: 'core', type: 'isolation', defSets: 3, defReps: '20-25', defRest: '30 ث' },
    { name: 'Band Triceps Extension', cat: 'push', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '45 ث' },
    { name: 'Band Hammer Curls', cat: 'pull', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '45 ث' },
    { name: 'Band Bent-over Rows', cat: 'pull', type: 'compound', defSets: 4, defReps: '15-20', defRest: '45 ث' },
    { name: 'Band One-arm Rows', cat: 'pull', type: 'compound', defSets: 4, defReps: '15-20 each arm', defRest: '60 ث' },
    { name: 'Band Goblet Squats', cat: 'legs', type: 'compound', defSets: 4, defReps: '20-25', defRest: '60 ث' },
    { name: 'Band Romanian Deadlifts', cat: 'legs', type: 'compound', defSets: 4, defReps: '15-20', defRest: '60 ث' },
    { name: 'Band Concentration Curls', cat: 'pull', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '30 ث' },
    { name: 'Band Overhead Triceps Extension', cat: 'push', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '45 ث' },
    { name: 'Band Seated Shoulder Press', cat: 'push', type: 'compound', defSets: 4, defReps: '15-20', defRest: '60 ث' },
  ],
  pullup_bar: [
    { name: 'Pull-ups', cat: 'pull', type: 'compound', defSets: 4, defReps: '6-12', defRest: '90 ث' },
    { name: 'Chin-ups', cat: 'pull', type: 'compound', defSets: 4, defReps: '6-12', defRest: '90 ث' },
    { name: 'Australian Rows', cat: 'pull', type: 'compound', defSets: 3, defReps: '12-15', defRest: '60 ث' },
    { name: 'V-Grip Pull-ups', cat: 'pull', type: 'compound', defSets: 3, defReps: '8-10', defRest: '60 ث' },
    { name: 'Hanging Leg Raises', cat: 'core', type: 'isolation', defSets: 3, defReps: '10-15', defRest: '45 ث' },
  ],
  bench: [
    { name: 'Bench Dips', cat: 'push', type: 'compound', defSets: 3, defReps: '12-18', defRest: '45 ث' },
    { name: 'Bench Press', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '90 ث' },
    { name: 'Bulgarian Split Squats', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
    { name: 'Leg Raises on Bench', cat: 'core', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '30 ث' },
    { name: 'Reverse Lunges', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
  ],
  step: [
    { name: 'Step-ups', cat: 'legs', type: 'compound', defSets: 3, defReps: '12-15 each leg', defRest: '60 ث' },
    { name: 'Box Jumps', cat: 'legs', type: 'compound', defSets: 3, defReps: '8-12', defRest: '60 ث' },
    { name: 'Step-back Lunges', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
    { name: 'Weighted Step-ups', cat: 'legs', type: 'compound', defSets: 3, defReps: '10-12 each leg', defRest: '60 ث' },
    { name: 'Step Aerobics', cat: 'legs', type: 'isolation', defSets: 3, defReps: '30 sec', defRest: '15 ث' },
  ],
  cable: [
    { name: 'Cable Pushdowns', cat: 'push', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
    { name: 'Cable Crunches', cat: 'core', type: 'isolation', defSets: 3, defReps: '15-20', defRest: '30 ث' },
    { name: 'Cable Chest Fly', cat: 'push', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '60 ث' },
    { name: 'Cable Rows', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Cable Bicep Curls', cat: 'pull', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
    { name: 'Cable Lateral Raise', cat: 'push', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '45 ث' },
  ],
  gym_machine: [
    { name: 'Chest Press Machine', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Lat Pulldown Machine', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Leg Press Machine', cat: 'legs', type: 'compound', defSets: 5, defReps: '10-15', defRest: '90 ث' },
    { name: 'Leg Extension', cat: 'legs', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '60 ث' },
    { name: 'Leg Curl', cat: 'legs', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '60 ث' },
    { name: 'Shoulder Press Machine', cat: 'push', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Seated Row Machine', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Pec Deck Fly', cat: 'push', type: 'isolation', defSets: 4, defReps: '12-15', defRest: '45 ث' },
  ],
  leg_press: [
    { name: 'Leg Press', cat: 'legs', type: 'compound', defSets: 5, defReps: '10-15', defRest: '90 ث' },
    { name: 'Calf Raises on Leg Press', cat: 'legs', type: 'isolation', defSets: 5, defReps: '15-20', defRest: '45 ث' },
    { name: 'Single Leg Press', cat: 'legs', type: 'compound', defSets: 4, defReps: '10-12 each leg', defRest: '60 ث' },
    { name: 'Incline Leg Press', cat: 'legs', type: 'compound', defSets: 4, defReps: '12-15', defRest: '90 ث' },
    { name: 'Horizontal Leg Press', cat: 'legs', type: 'compound', defSets: 4, defReps: '12-15', defRest: '60 ث' },
  ],
  lat_pulldown: [
    { name: 'Front Lat Pulldown', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Behind Neck Pulldown', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Reverse Grip Pulldown', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'V-Grip Pulldown', cat: 'pull', type: 'compound', defSets: 4, defReps: '10-12', defRest: '60 ث' },
    { name: 'Face Pull', cat: 'pull', type: 'isolation', defSets: 3, defReps: '12-15', defRest: '45 ث' },
  ],
  smith_machine: [
    { name: 'Smith Machine Squat', cat: 'legs', type: 'compound', defSets: 5, defReps: '8-10', defRest: '90 ث' },
    { name: 'Smith Machine Bench Press', cat: 'push', type: 'compound', defSets: 4, defReps: '8-10', defRest: '90 ث' },
    { name: 'Smith Machine Shoulder Press', cat: 'push', type: 'compound', defSets: 4, defReps: '8-10', defRest: '60 ث' },
    { name: 'Smith Machine Lunges', cat: 'legs', type: 'compound', defSets: 4, defReps: '10-12 each leg', defRest: '60 ث' },
    { name: 'Smith Machine RDL', cat: 'legs', type: 'compound', defSets: 4, defReps: '10-12', defRest: '90 ث' },
    { name: 'Smith Machine Calf Raises', cat: 'legs', type: 'isolation', defSets: 4, defReps: '15-20', defRest: '30 ث' },
  ],
}

// Movement classification function
export function getMovement(ex) {
  const n = ex.name.toLowerCase()
  const cat = ex.cat
  const type = ex.type || 'compound'

  if (cat === 'core') return 'ABS'

  if (cat === 'push') {
    if (type === 'isolation') {
      if (/tricep|skull|crusher|pushdown|تراي/.test(n)) return 'TRICEPS'
      if (/fly|pec deck|فلای|فراشة/.test(n)) return 'CHEST_ISOLATION'
      if (/lateral|raise|جانبي/.test(n)) return 'LATERAL_RAISE'
      return 'TRICEPS'
    }
    if (/dip|انخفاض/.test(n)) return 'TRICEPS'
    if (/pike/.test(n)) return 'SHOULDER_COMPOUND'
    if (/bench|chest|صدر|بنش/.test(n) && !/shoulder|كتف|overhead/.test(n)) return 'CHEST_COMPOUND'
    if (/shoulder|overhead|press|كتف|ضغط كتف/.test(n)) return 'SHOULDER_COMPOUND'
    if (/thruster|ثراستر/.test(n)) return 'SHOULDER_COMPOUND'
    if (/clean|turkish/.test(n)) return 'SHOULDER_COMPOUND'
    if (/push.?up|ضغط/.test(n)) return 'CHEST_COMPOUND'
    return 'CHEST_COMPOUND'
  }

  if (cat === 'pull') {
    if (type === 'isolation') {
      if (/curl|بايسبس|باي/.test(n)) return 'BICEPS'
      if (/face pull|rear delt|وجه/.test(n)) return 'REAR_DELT'
      return 'BICEPS'
    }
    if (/pull.?up|chin.?up|pulldown|عقلة|لات/.test(n)) return 'VERTICAL_PULL'
    if (/row|رف|سحب/.test(n) && !/face|وجه/.test(n)) {
      if (/cable.*row|seated.*row|جهاز.*ظهر/i.test(n)) return 'BACK_ACCESSORY'
      return 'HORIZONTAL_PULL'
    }
    if (/face pull|وجه/.test(n)) return 'REAR_DELT'
    return 'BACK_ACCESSORY'
  }

  if (cat === 'legs') {
    if (/glute bridge|رفع الحوض/.test(n)) return 'HIP_HINGE'
    if (type === 'isolation') {
      if (/leg extension|تمديد|quad/.test(n)) return 'QUAD_ISOLATION'
      if (/leg curl|ثني|hamstring/.test(n)) return 'HAMSTRING'
      if (/calf|سمان|سمّان/.test(n)) return 'CALVES'
      if (/lateral walk/.test(n)) return 'HAMSTRING'
      return 'CALVES'
    }
    if (/squat|leg press|قرفصاء|سكوات|ليج بريس/.test(n)) return 'SQUAT_PATTERN'
    if (/deadlift|rdl|romanian|glute bridge|swing|رف ميت|رومانيان|سوينغ|رفع الحوض/.test(n)) return 'HIP_HINGE'
    if (/lunge|step.?up|box jump|اندفاع|صعود|نط/.test(n)) return 'QUAD_ISOLATION'
    return 'SQUAT_PATTERN'
  }

  return 'ABS'
}

// Enrich exercise with primaryMuscles, secondaryMuscles, movementPattern
export function enrichExercise(ex) {
  const n = ex.name.toLowerCase()
  const mov = ex.mov || getMovement(ex)

  const defaultMap = {
    'CHEST_COMPOUND': { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'], pattern: 'Horizontal Push' },
    'SHOULDER_COMPOUND': { primary: ['Front Delts'], secondary: ['Side Delts', 'Triceps'], pattern: 'Vertical Push' },
    'CHEST_ISOLATION': { primary: ['Chest'], secondary: ['Front Delts'], pattern: 'Chest Isolation' },
    'LATERAL_RAISE': { primary: ['Side Delts'], secondary: [], pattern: 'Lateral Raise' },
    'TRICEPS': { primary: ['Triceps'], secondary: [], pattern: 'Triceps Extension' },
    'VERTICAL_PULL': { primary: ['Back'], secondary: ['Biceps'], pattern: 'Vertical Pull' },
    'HORIZONTAL_PULL': { primary: ['Back'], secondary: ['Biceps', 'Rear Delts'], pattern: 'Horizontal Pull' },
    'BACK_ACCESSORY': { primary: ['Back'], secondary: ['Biceps'], pattern: 'Row Variation' },
    'REAR_DELT': { primary: ['Rear Delts'], secondary: ['Traps'], pattern: 'Rear Delt Fly' },
    'BICEPS': { primary: ['Biceps'], secondary: [], pattern: 'Bicep Curl' },
    'SQUAT_PATTERN': { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Core'], pattern: 'Squat' },
    'HIP_HINGE': { primary: ['Hamstrings', 'Glutes'], secondary: ['Back'], pattern: 'Hip Hinge' },
    'QUAD_ISOLATION': { primary: ['Quads'], secondary: [], pattern: 'Leg Extension' },
    'HAMSTRING': { primary: ['Hamstrings'], secondary: ['Glutes'], pattern: 'Leg Curl' },
    'CALVES': { primary: ['Calves'], secondary: [], pattern: 'Calf Raise' },
    'ABS': { primary: ['Abs'], secondary: [], pattern: 'Core Flexion' },
  }

  // Specific exercise overrides
  if (/diamond|تراي/.test(n) && /push.?up|ضغط/.test(n)) {
    return { primaryMuscles: ['Triceps', 'Chest'], secondaryMuscles: ['Front Delts'], movementPattern: 'Vertical Push' }
  }
  if (mov === 'TRICEPS' && (/dip|انخفاض/.test(n)) && !/bench|كرسي/.test(n)) {
    return { primaryMuscles: ['Chest', 'Triceps'], secondaryMuscles: ['Front Delts'], movementPattern: 'Vertical Push' }
  }
  if (/thruster|ثراستر/.test(n)) {
    return { primaryMuscles: ['Front Delts', 'Quads'], secondaryMuscles: ['Glutes', 'Core', 'Triceps'], movementPattern: 'Vertical Push' }
  }
  if (/turkish|تركش/.test(n)) {
    return { primaryMuscles: ['Shoulders', 'Core'], secondaryMuscles: ['Quads', 'Glutes'], movementPattern: 'Full Body' }
  }
  if (/clean.*press|كلين.*بريس/.test(n)) {
    return { primaryMuscles: ['Shoulders', 'Quads'], secondaryMuscles: ['Glutes', 'Back', 'Triceps'], movementPattern: 'Full Body' }
  }
  if (/swing|سوينغ/.test(n) && !/روسيا|russian|twist|تويست/.test(n)) {
    return { primaryMuscles: ['Glutes', 'Hamstrings'], secondaryMuscles: ['Back', 'Core'], movementPattern: 'Hip Hinge' }
  }
  if (/glute bridge|رفع الحوض/.test(n)) {
    return { primaryMuscles: ['Glutes'], secondaryMuscles: ['Hamstrings'], movementPattern: 'Hip Hinge' }
  }
  if (/mountain climber|متسلق/.test(n)) {
    return { primaryMuscles: ['Abs'], secondaryMuscles: ['Shoulders', 'Hip Flexors'], movementPattern: 'Core Flexion' }
  }
  if (/^jumping jack|^نط$/.test(n) && !/step|استيب/.test(n)) {
    return { primaryMuscles: ['Calves', 'Shoulders'], secondaryMuscles: ['Quads'], movementPattern: 'Full Body' }
  }
  if (/superman|سوبرمان/.test(n)) {
    return { primaryMuscles: ['Lower Back'], secondaryMuscles: ['Glutes'], movementPattern: 'Back Extension' }
  }
  if (/windmill|ويندميل/.test(n)) {
    return { primaryMuscles: ['Core'], secondaryMuscles: ['Shoulders'], movementPattern: 'Core Rotation' }
  }
  if (/plank|بلانك/.test(n)) {
    return { primaryMuscles: ['Abs'], secondaryMuscles: ['Shoulders'], movementPattern: 'Core Stabilization' }
  }
  if (/cobra|كوبرا/.test(n)) {
    return { primaryMuscles: ['Back'], secondaryMuscles: [], movementPattern: 'Back Extension' }
  }
  if (/bench dip|bench dips|انخفاض.*كرسي/.test(n)) {
    return { primaryMuscles: ['Triceps'], secondaryMuscles: ['Chest', 'Front Delts'], movementPattern: 'Triceps Extension' }
  }
  if (/aerobic.*step|هوائية.*استيب/.test(n)) {
    return { primaryMuscles: ['Calves', 'Quads'], secondaryMuscles: ['Glutes'], movementPattern: 'Step Aerobics' }
  }

  const info = defaultMap[mov] || { primary: [], secondary: [], pattern: mov }
  return {
    primaryMuscles: [...info.primary],
    secondaryMuscles: [...info.secondary],
    movementPattern: info.pattern,
  }
}

// Filter exercises based on injury modifiers
export function filterByInjuries(pool, injuries) {
  if (!injuries || injuries.length === 0) return pool
  return pool.filter(ex => {
    const n = ex.name.toLowerCase()
    if (injuries.includes('shoulder')) {
      // Exclude: overhead press, dips, upright row, behind neck, heavy fly
      if (/overhead press|shoulder press|dip|انخفاض|upright row|behind neck/i.test(n)) return false
    }
    if (injuries.includes('knee')) {
      // Exclude: deep squats, lunges, step-ups, leg extension
      if (/squat|lunge|قرفصاء|اندفاع|step.?up|leg extension|تمديد/i.test(n)) return false
    }
    if (injuries.includes('lower_back')) {
      // Exclude: deadlift, good morning, heavy row, hyperextension
      if (/deadlift|rdl|romanian|رف ميت|رومانيان|good morning|hyperextension|stiff.?leg/i.test(n)) return false
    }
    return true
  })
}

// Tag all exercises in a pool with movement pattern + muscle data
export function tagExercises(pool) {
  pool.forEach(ex => {
    ex.mov = getMovement(ex)
    const enriched = enrichExercise(ex)
    ex.primaryMuscles = enriched.primaryMuscles
    ex.secondaryMuscles = enriched.secondaryMuscles
    ex.movementPattern = enriched.movementPattern
  })
}

export function generateDayTitle(day, lang = 'en', forceTitle) {
  if (forceTitle) return forceTitle

  const exs = (day.exercises || []).filter(e => e.name && !e.name.includes('Cardio') && !e.name.includes('كارديو'))
  if (exs.length === 0) return day.day || day.focus || ''

  // Count exercises per category
  const catCount = { push: 0, pull: 0, legs: 0, core: 0 }
  const muscleSet = new Set()

  exs.forEach(ex => {
    if (ex.cat && catCount[ex.cat] !== undefined) catCount[ex.cat]++
    if (ex.primaryMuscles?.length) ex.primaryMuscles.forEach(m => muscleSet.add(m))
  })

  const dominant = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0][0]
  const hasSquat = exs.some(e => e.mov === 'SQUAT_PATTERN')
  const hasHinge = exs.some(e => e.mov === 'HIP_HINGE')
  const isLegDominant = dominant === 'legs' && catCount.legs > exs.length / 2

  if (lang === 'en') {
    if (isLegDominant && (hasSquat || hasHinge)) {
      const parts = []
      if (hasSquat) parts.push('Squat')
      if (hasHinge) parts.push('Hip Hinge')
      return `Legs (${parts.join(' + ')} Focus)`
    }

    const muscles = [...muscleSet].filter(m => m !== 'Abs' && m !== 'Calves' && m !== 'Hamstrings' && m !== 'Glutes' && m !== 'Quads')
    if (muscles.length >= 4) return 'Full Body'
    if (muscles.length > 0) return muscles.join(' + ')
    return day.focus || 'Training'
  }

  if (isLegDominant && (hasSquat || hasHinge)) {
    const parts = []
    if (hasSquat) parts.push('سكوات')
    if (hasHinge) parts.push('ديدليفت')
    return `أرجل (${parts.join(' + ')})`
  }
  const arMap = {
    Chest: 'صدر', Back: 'ظهر', Biceps: 'بايسبس', Triceps: 'ترايسبس',
    'Front Delts': 'كتف أمامي', 'Side Delts': 'كتف جانبي', 'Rear Delts': 'كتف خلفي',
    Legs: 'أرجل',
  }
  const muscles = [...muscleSet].filter(m => m !== 'Abs' && m !== 'Calves' && m !== 'Hamstrings' && m !== 'Glutes' && m !== 'Quads')
  if (muscles.length >= 4) return 'كامل الجسم'
  if (muscles.length > 0) return muscles.map(m => arMap[m] || m).join(' + ')
  return day.focus || 'تدريب'
}

// Get the right pools for a language and merge selected equipment
export function getExercisePools(lang) {
  return lang === 'en' ? exercisePoolsEN : exercisePoolsAR
}

// Merge pools from selected equipment keys
export function mergePools(pools, equipList) {
  const selectedEquip = equipList.length > 0 ? equipList : ['none']
  const seen = new Set()
  const merged = []
  selectedEquip.forEach(eq => {
    const pool = pools[eq] || []
    pool.forEach(ex => {
      if (!seen.has(ex.name)) {
        seen.add(ex.name)
        merged.push({ ...ex, equipSource: eq })
      }
    })
  })
  return merged.length > 0 ? merged : (pools.none ? pools.none.map(e => ({ ...e, equipSource: 'none' })) : [])
}
