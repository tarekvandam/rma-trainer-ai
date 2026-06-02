const USERS_KEY = 'rma_users'
const SESSION_KEY = 'rma_session'
const RESET_CODES_KEY = 'rma_reset_codes'

export function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {}
  } catch {
    return {}
  }
}

function saveLocalUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function localSignUp(email, password) {
  const users = getLocalUsers()
  if (users[email]) return { error: { message: 'البريد موجود بالفعل' } }
  users[email] = { email, password, createdAt: new Date().toISOString() }
  saveLocalUsers(users)
  import('./plan').then(m => m.pushRegisteredUser(email)).catch(() => {})
  return { error: null }
}

export function localSignIn(email, password) {
  const users = getLocalUsers()
  const user = users[email]
  if (!user) return { error: { message: 'البريد غير مسجل' } }
  if (user.password !== password) return { error: { message: 'كلمة السر غلط' } }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }))
  return { error: null, user: { email } }
}

export function localSignOut() {
  const session = getLocalSession()
  const email = session?.email
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('rma_plan')
  localStorage.removeItem('rma_plan_counts')
  if (email) {
    localStorage.removeItem('rma_plan_counts_' + email)
  }
}

export function getLocalSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function generateResetCode(email) {
  const users = getLocalUsers()
  if (!users[email]) return null
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const resetCodes = JSON.parse(localStorage.getItem(RESET_CODES_KEY) || '{}')
  resetCodes[email] = { code, expiresAt: Date.now() + 10 * 60 * 1000 }
  localStorage.setItem(RESET_CODES_KEY, JSON.stringify(resetCodes))
  return code
}

export function verifyResetCode(email, code) {
  const resetCodes = JSON.parse(localStorage.getItem(RESET_CODES_KEY) || '{}')
  const record = resetCodes[email]
  if (!record) return false
  if (Date.now() > record.expiresAt) { delete resetCodes[email]; localStorage.setItem(RESET_CODES_KEY, JSON.stringify(resetCodes)); return false }
  if (record.code !== code) return false
  delete resetCodes[email]
  localStorage.setItem(RESET_CODES_KEY, JSON.stringify(resetCodes))
  return true
}

export function changePassword(email, newPassword) {
  const users = getLocalUsers()
  if (!users[email]) return false
  users[email].password = newPassword
  saveLocalUsers(users)
  return true
}
