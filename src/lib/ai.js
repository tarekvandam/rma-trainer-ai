import { generateGymPlan } from './workout-generator.js'

export async function generateWorkoutPlan(formData, lang = 'ar') {
  console.log('GENERATOR_VERSION', 'RuleBased')
  const plan = generateGymPlan({ ...formData, lang })
  return plan
}
