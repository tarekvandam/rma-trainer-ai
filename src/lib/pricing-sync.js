import { supabase } from './supabase'

const KEY = 'pricing_plans'

async function fromSupabase() {
  if (!supabase) return null
  const { data, error } = await supabase.from('app_data').select('value').eq('key', KEY).single()
  if (error || !data) return null
  return data.value
}

async function toSupabase(value) {
  if (!supabase) return false
  const { error } = await supabase.from('app_data').upsert(
    { key: KEY, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  return !error
}

export async function fetchPricingPlans(defaults) {
  const local = localStorage.getItem('rma_pricing_plans')
  if (local) return JSON.parse(local)
  const cloud = await fromSupabase()
  if (cloud && Array.isArray(cloud) && cloud.length) {
    localStorage.setItem('rma_pricing_plans_cloud', JSON.stringify(cloud))
    return cloud
  }
  const cached = localStorage.getItem('rma_pricing_plans_cloud')
  if (cached) return JSON.parse(cached)
  localStorage.setItem('rma_pricing_plans', JSON.stringify(defaults))
  return defaults
}

export async function fetchPricingPlansPublic(defaults) {
  const cloud = await fromSupabase()
  if (cloud && Array.isArray(cloud) && cloud.length) {
    localStorage.setItem('rma_pricing_plans_cloud', JSON.stringify(cloud))
    return cloud
  }
  const cached = localStorage.getItem('rma_pricing_plans_cloud')
  if (cached) return JSON.parse(cached)
  return defaults
}

export async function publishPricingPlans(plans) {
  localStorage.setItem('rma_pricing_plans', JSON.stringify(plans))
  localStorage.setItem('rma_pricing_plans_cloud', JSON.stringify(plans))
  const ok = await toSupabase(plans)
  return ok
}
