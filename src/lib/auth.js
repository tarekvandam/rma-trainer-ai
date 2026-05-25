const USERS_KEY = 'rma_users'
const SESSION_KEY = 'rma_session'

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
