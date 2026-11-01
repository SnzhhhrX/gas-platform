// Безопасность и проверка данных: пароли, коды восстановления, валидация, ограничение запросов.
import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(crypto.scrypt)
const OPTS = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 } // ≈ 32 МБ и ~0.1 с на проверку: перебор дорогой

export const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')
export const newToken = () => crypto.randomBytes(32).toString('hex')

export async function hashSecret(secret) {
  const salt = crypto.randomBytes(16).toString('hex')
  return { salt, hash: (await scrypt(secret.normalize('NFKC'), salt, 64, OPTS)).toString('hex') }
}
export async function verifySecret(secret, salt, hash) {
  const h = await scrypt(String(secret ?? '').normalize('NFKC'), salt, 64, OPTS)
  return crypto.timingSafeEqual(h, Buffer.from(hash, 'hex'))
}
// фиктивная проверка для несуществующего логина — одинаковое время ответа, чтобы нельзя было угадать, кто зарегистрирован
const DUMMY = await hashSecret('dummy-password')
export const fakeVerify = () => verifySecret('x', DUMMY.salt, DUMMY.hash)

// Код восстановления: 12 символов (≈60 бит) без похожих букв, выдаётся один раз
const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const newRecoveryCode = () => {
  const b = crypto.randomBytes(12)
  return [0, 4, 8].map((i) => [...b.subarray(i, i + 4)].map((x) => ABC[x % ABC.length]).join('')).join('-')
}
export const normCode = (c) => String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')

// ---------- проверка ввода ----------
export const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/
export const USERNAME = /^[a-z0-9_]{3,20}$/
const RESERVED = new Set(['admin', 'administrator', 'root', 'support', 'gas', 'moderator', 'system', 'api', 'null', 'undefined', 'help', 'official'])
const COMMON = new Set(['12345678', '123456789', '1234567890', 'password', 'password1', 'qwertyui', 'qwerty123', '11111111', 'iloveyou', '12341234', 'abcd1234', 'qazwsxedc', 'йцукенгшщз', '987654321', 'password123', 'admin123', '00000000'])
export const checkUsername = (u) => !USERNAME.test(u) ? 'Логин: 3–20 символов, латиница, цифры и «_».' : RESERVED.has(u) ? 'Этот логин зарезервирован.' : null
export function checkPassword(p, ...avoid) {
  if (p.length < 8) return 'Пароль должен быть не короче 8 символов.'
  if (p.length > 100) return 'Пароль слишком длинный (максимум 100).'
  if (COMMON.has(p.toLowerCase()) || /^(.)\1+$/.test(p)) return 'Слишком простой пароль — придумайте другой.'
  if (avoid.some((a) => a && p.toLowerCase().includes(a.toLowerCase()) && a.length >= 4)) return 'Пароль не должен содержать логин или email.'
  return null
}

// ---------- состояние игрока ----------
const DAY = /^\d{4}-\d{2}-\d{2}$/
const num = (v, max) => (Number.isFinite(v) ? Math.min(Math.max(Math.round(v), 0), max) : 0)
const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n) : '')
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

// Приводит присланное клиентом состояние к безопасному виду: типы, диапазоны, длины. Лишних полей не режет.
export function sanitizeState(s) {
  if (!isObj(s) || JSON.stringify(s).length > 250_000) throw Object.assign(new Error('Некорректное состояние.'), { code: 400 })
  const p = isObj(s.profile) ? s.profile : {}
  const activity = {}
  if (isObj(s.activity)) for (const [k, v] of Object.entries(s.activity).sort().slice(-400)) if (DAY.test(k)) activity[k] = num(v, 20000)
  const rec = isObj(s.records) ? s.records : {}
  return {
    ...s,
    xp: num(s.xp, 5_000_000), streak: num(s.streak, 20000), bestStreak: num(s.bestStreak, 20000),
    activity, records: { ...rec, blitz: num(rec.blitz, 500), games: num(rec.games, 100000) },
    profile: {
      ...p, name: str(p.name, 30), bio: str(p.bio, 120), wish: str(p.wish, 40), avatar: /^(letter|icon:[a-z]{2,12}|av:\d{8})$/.test(p.avatar) ? p.avatar : 'letter',
      color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : null, country: /^\d{3}$/.test(p.country) ? p.country : '', favorite: /^\d{3}$/.test(p.favorite) ? p.favorite : '',
      hidden: p.hidden === true, goal: [10, 20, 30, 50].includes(p.goal) ? p.goal : 30,
    },
  }
}

// Открытая «карточка» игрока: только то, что можно показывать другим (хранится отдельно от полного состояния)
export function makeCard(s) {
  const days = Object.keys(s.activity).sort().slice(-62), activity = Object.fromEntries(days.map((d) => [d, s.activity[d]]))
  return {
    name: s.profile.name, avatar: s.profile.avatar, color: s.profile.color, bio: s.profile.bio, country: s.profile.country, favorite: s.profile.favorite, wish: s.profile.wish,
    hidden: s.profile.hidden, pro: s.pro === true, xp: s.xp, streak: s.streak, lastDay: typeof s.lastDay === 'string' ? s.lastDay : null, bestStreak: s.bestStreak,
    lessons: isObj(s.completed) ? Object.keys(s.completed).length : 0, answered: num(s.stats?.answered, 1e9), correct: num(s.stats?.correct, 1e9),
    achievements: Array.isArray(s.seen) ? s.seen.filter((x) => typeof x === 'string').slice(0, 100) : [], blitz: s.records.blitz, activity,
  }
}

// ---------- ограничение запросов ----------
export class Limiter {
  constructor() { this.m = new Map(); setInterval(() => { const now = Date.now(); for (const [k, v] of this.m) if (v.until < now && v.reset < now) this.m.delete(k) }, 60_000).unref() }
  // true — лимит превышен. max попыток за windowMs
  hit(key, max, windowMs) {
    const now = Date.now(), e = this.m.get(key)
    if (!e || e.reset < now) { this.m.set(key, { n: 1, reset: now + windowMs, until: 0 }); return false }
    e.n++; return e.n > max
  }
  fail(key, max, lockMs) { const e = this.m.get(key) ?? { n: 0, reset: Date.now() + lockMs, until: 0 }; e.n++; if (e.n >= max) { e.until = Date.now() + lockMs; e.n = 0 } e.reset = Math.max(e.reset, Date.now() + lockMs); this.m.set(key, e) }
  locked(key) { return (this.m.get(key)?.until ?? 0) > Date.now() }
  clear(key) { this.m.delete(key) }
}
