const PLAN_KEY = 'rma_plan'
const COUNTS_KEY = 'rma_plan_counts'
const CODES_KEY = 'rma_loaded_codes'
const REQUESTS_KEY = 'rma_requests'
const DELETED_KEY = 'rma_deleted_requests'

async function supabaseGet(key) {
  try {
    const { supabase } = await import('./supabase')
    if (!supabase) return null
    const { data, error } = await supabase.from('app_data').select('value').eq('key', key).single()
    if (error && error.code !== 'PGRST116') console.warn('supabaseGet error:', error)
    return data?.value
  } catch (err) {
    console.warn('supabaseGet failed:', err)
    return null
  }
}

async function supabaseSet(key, value) {
  try {
    const { supabase } = await import('./supabase')
    if (!supabase) return false
    const { error } = await supabase.from('app_data').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    if (error) console.warn('supabaseSet error:', error)
    return !error
  } catch (err) {
    console.warn('supabaseSet failed:', err)
    return false
  }
}

export function getPlan() {
  try {
    const plan = JSON.parse(localStorage.getItem(PLAN_KEY)) || { type: 'free' }
    if (plan.type === 'pro') {
      if (!plan.expiresAt) {
        const now = new Date()
        plan.expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString()
        plan.migrated = true
        localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
      }
      const now = new Date()
      const expiry = new Date(plan.expiresAt)
      if (now > expiry) {
        plan.type = 'free'
        plan.expired = true
        delete plan.expiresAt
        localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
      }
    }
    return plan
  } catch {
    return { type: 'free' }
  }
}

export function isPro() {
  return getPlan().type === 'pro'
}

export async function activatePro(code) {
  // Re-check Supabase to ensure code still available (fresh read)
  try {
    const cloud = await supabaseGet('serial_codes')
    if (Array.isArray(cloud)) {
      const inCloud = cloud.find(c => c.code === code)
      if (!inCloud) { /* not in cloud, allow */ }
      else if (inCloud.used) return false
    }
  } catch { /* proceed */ }

  const now = new Date()
  const expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString()
  const email = getCurrentEmail()
  const plan = { type: 'pro', code, email, activatedAt: new Date().toISOString(), expiresAt }
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
  markCodeUsed(code)

  if (email) {
    const requests = getRequestsLocal()
    const existing = requests.find(r => r.email === email)
    if (!existing) {
      requests.push({ email, name: '', phone: '', status: 'approved', code, activatedAt: plan.activatedAt, expiresAt, createdAt: new Date().toISOString() })
      saveRequests(requests)
    }
  }

  await markCodeUsedCloud(code)
  return true
}

export async function clearUnusedCodes() {
  const all = getAllCodeSources()
  const used = all.filter(c => c.used)
  const adminCodes = JSON.parse(localStorage.getItem('rma_codes') || '[]')
  localStorage.setItem('rma_codes', JSON.stringify(adminCodes.filter(c => c.used)))
  const loadedCodes = JSON.parse(localStorage.getItem(CODES_KEY) || '[]')
  localStorage.setItem(CODES_KEY, JSON.stringify(loadedCodes.filter(c => c.used)))
  await syncCodesToCloud(used)
}

export function daysRemaining() {
  const plan = getPlan()
  if (plan.type !== 'pro' || !plan.expiresAt) return 0
  const now = new Date()
  const expiry = new Date(plan.expiresAt)
  const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function getCurrentEmail() {
  try {
    return JSON.parse(localStorage.getItem('rma_session'))?.email || null
  } catch {
    return null
  }
}

export function getPlanCount() {
  const email = getCurrentEmail()
  if (!email) return 3
  try {
    return JSON.parse(localStorage.getItem('rma_plan_counts_' + email)) || 0
  } catch {
    return 0
  }
}

export function incrementPlanCount() {
  const email = getCurrentEmail()
  if (!email) return 0
  const count = getPlanCount() + 1
  localStorage.setItem('rma_plan_counts_' + email, JSON.stringify(count))
  return count
}

export function canGeneratePlan() {
  if (isPro()) return true
  return getPlanCount() < 3
}

export function getRemainingFreePlans() {
  return Math.max(0, 3 - getPlanCount())
}

export async function loadPublicCodes() {
  const existing = JSON.parse(localStorage.getItem(CODES_KEY) || '[]')
  const existingCodes = new Set(existing.map(c => c.code))
  const merged = [...existing]

  // From /codes.json
  try {
    const res = await fetch('/codes.json?t=' + Date.now())
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        data.forEach(code => {
          if (!existingCodes.has(code)) {
            merged.push({ code, used: false })
            existingCodes.add(code)
          }
        })
      }
    }
  } catch { /* no public codes */ }

  // From Supabase cloud
  let cloud = null
  try {
    cloud = await supabaseGet('serial_codes')
    if (Array.isArray(cloud)) {
      cloud.forEach(c => {
        if (!existingCodes.has(c.code)) {
          merged.push({ code: c.code, used: c.used || false, usedBy: c.usedBy || null, date: c.date || null })
          existingCodes.add(c.code)
        }
      })
    }
  } catch { /* no cloud codes */ }

  localStorage.setItem(CODES_KEY, JSON.stringify(merged))

  // Sync status back to admin codes so admin sees used/status updates
  if (Array.isArray(cloud)) {
    const adminCodes = JSON.parse(localStorage.getItem('rma_codes') || '[]')
    if (adminCodes.length) {
      const cloudMap = new Map(cloud.map(c => [c.code, c]))
      let changed = false
      adminCodes.forEach(c => {
        const matched = cloudMap.get(c.code)
        if (matched && matched.used !== c.used) {
          c.used = matched.used
          c.usedBy = matched.usedBy
          c.date = matched.date
          changed = true
        }
      })
      if (changed) localStorage.setItem('rma_codes', JSON.stringify(adminCodes))
    }
  }
}

export async function syncCodesToCloud(codes) {
  const clean = codes.map(c => ({ code: c.code, used: c.used || false, usedBy: c.usedBy || null, date: c.date || null }))
  await supabaseSet('serial_codes', clean)
}

function getAllCodeSources() {
  const fromLoaded = JSON.parse(localStorage.getItem(CODES_KEY) || '[]')
  const fromAdmin = JSON.parse(localStorage.getItem('rma_codes') || '[]')
  const seen = new Set()
  return [...fromAdmin, ...fromLoaded].filter(c => {
    if (seen.has(c.code)) return false
    seen.add(c.code)
    return true
  })
}

function saveToAllSources(all) {
  const loadedCodes = JSON.parse(localStorage.getItem(CODES_KEY) || '[]')
  const adminCodes = JSON.parse(localStorage.getItem('rma_codes') || '[]')
  const loadedSet = new Set(loadedCodes.map(c => c.code))
  const adminSet = new Set(adminCodes.map(c => c.code))
  localStorage.setItem(CODES_KEY, JSON.stringify(all.filter(c => loadedSet.has(c.code))))
  localStorage.setItem('rma_codes', JSON.stringify(all.filter(c => adminSet.has(c.code))))
}

function markCodeUsed(code) {
  const all = getAllCodeSources()
  const found = all.find(c => c.code === code)
  if (found) {
    found.used = true
    found.usedBy = localStorage.getItem('rma_session')
    found.date = new Date().toISOString()
    saveToAllSources(all)
  }
}

export async function validateCode(code) {
  // 1. Check Supabase directly first
  try {
    const cloud = await supabaseGet('serial_codes')
    if (Array.isArray(cloud)) {
      // Sync to localStorage for future speed
      const existing = JSON.parse(localStorage.getItem(CODES_KEY) || '[]')
      const existingCodes = new Set(existing.map(c => c.code))
      const merged = [...existing]
      cloud.forEach(c => {
        if (!existingCodes.has(c.code)) {
          merged.push({ code: c.code, used: c.used || false, usedBy: c.usedBy || null, date: c.date || null })
          existingCodes.add(c.code)
        }
      })
      localStorage.setItem(CODES_KEY, JSON.stringify(merged))

      const found = cloud.find(c => c.code === code && !c.used)
      if (found) return found
      // If code exists in Supabase as used, it's used — don't fallback to stale localStorage
      const used = cloud.find(c => c.code === code && c.used)
      if (used) return null
    }
  } catch { /* supabase unavailable */ }

  // 2. Fallback to localStorage
  return getAllCodeSources().find(c => c.code === code && !c.used) || null
}

async function markCodeUsedCloud(code) {
  // Retry loop for reliability
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const cloud = await supabaseGet('serial_codes')
      if (!Array.isArray(cloud)) return
      const found = cloud.find(c => c.code === code)
      if (!found) return // code not in cloud, no-op
      if (found.used) return // already used in cloud
      found.used = true
      found.usedBy = getCurrentEmail() || 'unknown'
      found.date = new Date().toISOString()
      const ok = await supabaseSet('serial_codes', cloud)
      if (ok) return // success
    } catch { /* retry */ }
  }
}

// Pending payment requests
export function getRequestsLocal() {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY)) || []
  } catch {
    return []
  }
}

// getRequests is now synchronous — reads from localStorage immediately.
// Background Supabase sync happens separately via syncRequestsCloud().
export function getRequests() {
  return getRequestsLocal()
}

function getDeletedEmails() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY)) || []
  } catch { return [] }
}

function addDeletedEmail(email) {
  const list = getDeletedEmails()
  if (!list.includes(email)) {
    list.push(email)
    localStorage.setItem(DELETED_KEY, JSON.stringify(list))
  }
}

function removeDeletedEmail(email) {
  const list = getDeletedEmails().filter(e => e !== email)
  localStorage.setItem(DELETED_KEY, JSON.stringify(list))
}

export async function syncRequestsCloud() {
  try {
    const cloud = await supabaseGet('pro_requests')
    if (!cloud || !Array.isArray(cloud)) return
    const local = getRequestsLocal()
    const deleted = getDeletedEmails()
    const merged = {}
    local.forEach(r => { merged[r.email] = { ...r, _source: 'local' } })
    cloud.forEach(r => {
      // Skip only old revoked entries that were deleted — allow newer pending/approved
      if (deleted.includes(r.email) && r.status === 'revoked') return
      if (!merged[r.email]) {
        merged[r.email] = { ...r, _source: 'cloud' }
      } else {
        const t1 = merged[r.email].approvedAt || merged[r.email].revokedAt || merged[r.email].createdAt || ''
        const t2 = r.approvedAt || r.revokedAt || r.createdAt || ''
        if (t2 > t1) merged[r.email] = { ...r, _source: 'cloud' }
      }
    })
    const result = Object.values(merged).map(({ _source, ...rest }) => rest)
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(result))
  } catch { /* ignore */ }
}

async function saveRequests(requests) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests))
  try {
    const cloud = await supabaseGet('pro_requests')
    if (Array.isArray(cloud)) {
      const merged = cloud.filter(c => !requests.find(r => r.email === c.email))
      merged.push(...requests)
      await supabaseSet('pro_requests', merged)
    } else {
      await supabaseSet('pro_requests', requests)
    }
  } catch {
    supabaseSet('pro_requests', requests).catch(() => {})
  }
}

export async function deleteRequest(email) {
  // First mark as revoked in Supabase so user's polling can detect it
  try {
    const cloud = await supabaseGet('pro_requests')
    if (Array.isArray(cloud)) {
      const found = cloud.find(r => r.email === email)
      if (found) {
        found.status = 'revoked'
        found.revokedAt = new Date().toISOString()
      }
      await supabaseSet('pro_requests', cloud)
    }
  } catch { /* ignore */ }

  // Then remove from local storage only
  const requests = getRequestsLocal()
  const filtered = requests.filter(r => r.email !== email)
  addDeletedEmail(email)
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(filtered))
}

export async function submitProRequest(userData) {
  // If this email was previously deleted, clear it so sync doesn't hide the new request
  const deleted = getDeletedEmails().filter(e => e !== userData.email)
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted))

  const requests = await getRequests()
  const existing = requests.find(r => r.email === userData.email)
  if (existing && existing.status === 'pending') return { error: 'عندك طلب مقدم بالفعل' }
  requests.push({
    ...userData,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
  await saveRequests(requests)
  return { error: null }
}

export async function getRequestStatus(email) {
  // First check Supabase directly for latest status
  try {
    const cloud = await supabaseGet('pro_requests')
    if (Array.isArray(cloud)) {
      const found = cloud.find(r => r.email === email)
      if (found) {
        // Update local cache with fresh Supabase data
        const local = getRequestsLocal()
        const idx = local.findIndex(r => r.email === email)
        if (idx >= 0) {
          local[idx] = found
        } else {
          local.push(found)
        }
        localStorage.setItem(REQUESTS_KEY, JSON.stringify(local))
        return found.status
      }
    }
  } catch { /* fallback to local */ }

  const requests = getRequestsLocal()
  const req = requests.find(r => r.email === email)
  return req ? req.status : null
}

export async function approveRequest(email) {
  const requests = await getRequests()
  const req = requests.find(r => r.email === email)
  if (req) {
    req.status = 'approved'
    req.approvedAt = new Date().toISOString()
    const now = new Date()
    req.expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString()
    await saveRequests(requests)
  }
}

export async function rejectRequest(email) {
  const requests = await getRequests()
  const req = requests.find(r => r.email === email)
  if (req) {
    req.status = 'rejected'
    await saveRequests(requests)
  }
}

export async function revokeSubscription(email) {
  // Write revoked status directly to Supabase regardless of local state
  try {
    const cloud = await supabaseGet('pro_requests')
    if (Array.isArray(cloud)) {
      const found = cloud.find(r => r.email === email)
      if (found) {
        found.status = 'revoked'
        found.revokedAt = new Date().toISOString()
      } else {
        cloud.push({ email, status: 'revoked', revokedAt: new Date().toISOString(), createdAt: new Date().toISOString() })
      }
      await supabaseSet('pro_requests', cloud)
    }
  } catch { /* ignore */ }

  // Also update local
  const local = getRequestsLocal()
  const found = local.find(r => r.email === email)
  if (found) {
    found.status = 'revoked'
    found.revokedAt = new Date().toISOString()
  }
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(local))
}

export function getProfile(email) {
  try {
    return JSON.parse(localStorage.getItem('rma_profile_' + email)) || {}
  } catch {
    return {}
  }
}

export function getActiveProUsers() {
  return getRequestsLocal().filter(r => r.status === 'approved')
}

export function saveProfile(email, data) {
  localStorage.setItem('rma_profile_' + email, JSON.stringify(data))
}

export function checkAllExpired() {
  const plan = getPlan() // triggers expiry check
  // Also check all stored users for expiry
  const users = JSON.parse(localStorage.getItem('rma_users') || '{}')
  let changed = false
  for (const email in users) {
    if (users[email].plan === 'pro' && users[email].expiresAt) {
      if (new Date() > new Date(users[email].expiresAt)) {
        users[email].plan = 'free'
        delete users[email].expiresAt
        changed = true
      }
    }
  }
  if (changed) localStorage.setItem('rma_users', JSON.stringify(users))
  return plan
}
