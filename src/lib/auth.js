import { api, getToken, isOnline, setToken, viaServer } from './api'
import { dropState, loadState, newState, saveState } from './store'

// Два режима. С сервером (npm run server): аккаунты, прогресс и друзья на backend, токен в localStorage.
// Без сервера: ДЕМО-аккаунты в localStorage (пароль — SHA-256, это НЕ защита).
const USERS = 'gas-users', SESSION = 'gas-session', ME = 'gas-me'
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

async function hash(s) {
  if (!globalThis.crypto?.subtle) return btoa(unescape(encodeURIComponent(s)))
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// Если сервер есть, а входа через него не было (старый демо-аккаунт) — просим войти заново
export const sessionId = () => (isOnline() && !getToken() ? null : read(SESSION, null))
export const hasLocalAccounts = () => read(USERS, []).length > 0
export const listUserIds = () => read(USERS, []).map((u) => u.id)
export const emailOf = (id) => read(ME, null)?.id === id ? read(ME).email : read(USERS, []).find((u) => u.id === id)?.email ?? ''
export const usernameOf = (id) => (read(ME, null)?.id === id ? read(ME).username : '')

function startSession(r) { // ответ сервера → локальная сессия
  setToken(r.token); write(ME, r.user); write(SESSION, r.user.id)
  return r.user.id
}

export async function register({ name, username, email, password, avatar, goal, theme }) {
  const profile = { name: name.trim(), avatar, goal, theme }
  if (isOnline()) {
    const r = await api('/register', { method: 'POST', body: { email, username, password } })
    const id = startSession(r)
    // Был демо-аккаунт с этим email → переносим его прогресс на сервер
    const demo = read(USERS, []).find((u) => u.email === email.trim().toLowerCase())
    saveState(id, demo ? loadState(demo.id) : newState(profile)) // первый PUT /api/state уйдёт сам
    return { id, recoveryCode: r.recoveryCode }
  }
  email = email.trim().toLowerCase()
  const users = read(USERS, [])
  if (users.some((u) => u.email === email)) throw new Error('Этот email уже зарегистрирован. Войдите в аккаунт.')
  const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now())
  write(USERS, [...users, { id, email, pass: await hash(password) }])
  saveState(id, newState(profile))
  write(SESSION, id)
  return { id }
}

export async function login(key, password) {
  if (isOnline()) return startSession(await api('/login', { method: 'POST', body: { login: key, password } }))
  const u = read(USERS, []).find((x) => x.email === key.trim().toLowerCase())
  if (!u || u.pass !== (await hash(password))) throw new Error('Неверный email или пароль.')
  write(SESSION, u.id)
  return u.id
}

// Восстановление доступа по коду, выданному при регистрации. Возвращает { id, recoveryCode } — новый код взамен сгоревшего.
export async function recover(login, code, password) {
  const r = await api('/recover', { method: 'POST', body: { login, code, password } })
  return { id: startSession(r), recoveryCode: r.recoveryCode }
}
export const changePassword = (current, next) => api('/password', { method: 'POST', body: { current, next } })
export const newRecoveryCode = (password) => api('/recovery-code', { method: 'POST', body: { password } }).then((r) => r.recoveryCode)
export const listSessions = () => api('/sessions').then((r) => r.sessions)
export const revokeOthers = () => api('/sessions/revoke-others', { method: 'POST' })
export const checkUsername = (u) => api(`/username-available?u=${encodeURIComponent(u)}`)
export async function exportData() { // скачать свои данные файлом
  const data = await api('/export')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })), download: 'gas-data.json' })
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function logout() {
  if (viaServer()) api('/logout', { method: 'POST' }).catch(() => {})
  setToken(null); localStorage.removeItem(SESSION); localStorage.removeItem(ME)
}
export async function deleteAccount(id, password) {
  if (viaServer()) await api('/me', { method: 'DELETE', body: { password } }) // ошибка (неверный пароль) пробрасывается наверх
  write(USERS, read(USERS, []).filter((u) => u.id !== id))
  dropState(id); logout()
}
