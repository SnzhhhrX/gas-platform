// GAS backend. Нужен Node 18+ (SQLite-хранилище — Node 22.13+, иначе автоматически JSON). Зависимостей нет.
//   npm run dev     — API встроен в Vite (удобно при разработке)
//   npm run server  — только API на :8787
//   npm start       — после `npm run build`: один процесс отдаёт и сайт, и API
// Настройки (переменные окружения): PORT, DATA_DIR, CORS_ORIGIN, TRUST_PROXY=1 (за nginx/Caddy), GAS_DB=sqlite|json, HSTS=1
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openStore } from './db.js'
import * as L from './lib.js'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 8787
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data')
const DIST = path.join(ROOT, '..', 'dist')
const TRUST_PROXY = process.env.TRUST_PROXY === '1'
const DAY_MS = 864e5, SESSION_MS = 30 * DAY_MS

fs.mkdirSync(DATA, { recursive: true, mode: 0o700 })
const store = await openStore(DATA)
const limiter = new L.Limiter()
console.log(`GAS: хранилище ${store.driver} (${store.file}), пользователей: ${store.user.count()}`)

// ---------- резервные копии: раз в сутки, хранятся 7 последних ----------
function backup() {
  const name = `${new Date().toISOString().slice(0, 10)}.${store.driver === 'sqlite' ? 'sqlite' : 'json'}`, dir = path.join(DATA, 'backups'), file = path.join(dir, name)
  try {
    if (!fs.existsSync(file)) store.backup(file)
    fs.readdirSync(dir).sort().slice(0, -7).forEach((f) => fs.rmSync(path.join(dir, f)))
  } catch (e) { console.error('Резервная копия не создана:', e.message) }
}
backup()
setInterval(() => { backup(); store.session.purge() }, 6 * 3600_000).unref()
const shutdown = () => { try { store.close() } catch {} process.exit(0) }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown)

// ---------- утилиты ----------
class HttpError extends Error { constructor(code, msg, extra) { super(msg); this.code = code; this.extra = extra } }
const fail = (code, msg, extra) => { throw new HttpError(code, msg, extra) }
const pad = (n) => String(n).padStart(2, '0')
const dayStr = (off = 0) => { const d = new Date(Date.now() + off * DAY_MS); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` } // понедельник
const sumFrom = (act, from) => Object.entries(act ?? {}).reduce((a, [k, v]) => a + (k >= from ? v : 0), 0)
const daysTo = (period) => { const d = new Date(); return period === 'week' ? 7 - ((d.getDay() + 6) % 7) : new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1 }

function secure(res, html) {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (html) res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
}
const send = (res, code, data, headers = {}) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }); res.end(JSON.stringify(data)) }
const readBody = (req) => new Promise((ok, no) => {
  let b = ''
  req.on('data', (c) => { b += c; if (b.length > 400_000) { no(new HttpError(413, 'Слишком большой запрос.')); req.destroy() } })
  req.on('end', () => { try { const v = b ? JSON.parse(b) : {}; ok(v && typeof v === 'object' ? v : {}) } catch { no(new HttpError(400, 'Некорректный JSON.')) } })
})
const clientIp = (req) => (TRUST_PROXY ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '') || req.socket.remoteAddress || ''
const device = (ua = '') => `${/Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Браузер'} · ${/Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'устройство'}`

// ---------- сессии ----------
async function issue(uid, req) {
  const token = L.newToken()
  store.session.create(L.sha(token), uid, Date.now() + SESSION_MS, String(req.headers['user-agent'] ?? '').slice(0, 200))
  return token
}
function authUser(req) {
  const t = (req.headers.authorization ?? '').replace(/^Bearer /, '')
  if (!t) return null
  const hash = L.sha(t), s = store.session.get(hash)
  if (!s || s.exp < Date.now()) return null
  const user = store.user.byId(s.uid)
  if (!user) return null
  if (s.exp - Date.now() < SESSION_MS / 2) store.session.touch(hash, Date.now() + SESSION_MS) // скользящий срок
  return { user, hash }
}
const accountOut = (u) => ({ id: u.id, email: u.email, username: u.username })

// ---------- публичные профили, друзья, рейтинг ----------
function relMap(me) {
  const m = new Map()
  for (const l of store.link.of(me)) m.set(l.a === me ? l.b : l.a, l.status === 'accepted' ? 'friend' : l.a === me ? 'outgoing' : 'incoming')
  return m
}
function pub(u, me, rels) {
  const c = u.card ?? {}, t = dayStr(), xp = c.xp ?? 0, id = u.id
  return {
    id, username: u.username, name: c.name || u.username, avatar: c.avatar || 'letter', color: c.color ?? null, bio: c.bio ?? '', country: c.country ?? '', favorite: c.favorite ?? '', wish: c.wish ?? '',
    pro: !!c.pro, xp, level: Math.floor(xp / 100) + 1, week: sumFrom(c.activity, weekStart()), month: sumFrom(c.activity, t.slice(0, 8) + '01'),
    streak: c.lastDay === t || c.lastDay === dayStr(-1) ? c.streak ?? 0 : 0, bestStreak: c.bestStreak ?? 0, lessons: c.lessons ?? 0, answered: c.answered ?? 0, correct: c.correct ?? 0,
    achievements: c.achievements ?? [], blitz: c.blitz ?? 0, joined: u.createdAt, today: (c.activity?.[t] ?? 0) > 0, relation: id === me ? 'self' : rels?.get(id) ?? 'none',
  }
}
const scoreOf = (p, metric, period) => (metric === 'blitz' ? p.blitz : period === 'week' ? p.week : period === 'month' ? p.month : p.xp)
const byId = (id) => store.user.byId(id)

// ---------- маршруты ----------
const routes = []
const on = (method, pattern, handler, open = false) => routes.push({ method, re: new RegExp(`^${pattern}$`), handler, open })
const authLimit = (ip) => limiter.hit(`auth:${ip}`, 30, 600_000) && fail(429, 'Слишком много попыток. Подождите несколько минут.')

on('GET', '/api/health', () => [200, { ok: true, driver: store.driver }], true)

// ── Автоперевод на лету. Ключ: GOOGLE_TRANSLATE_KEY (en+kk) или DEEPL_KEY (только en). Кэш — data/translations.json ──
const trFile = path.join(DATA, 'translations.json')
let trCache = {}, trTimer, trChars = 0, trDay = 0
try { trCache = JSON.parse(fs.readFileSync(trFile, 'utf8')) } catch { /* пусто */ }
const trSave = () => { clearTimeout(trTimer); trTimer = setTimeout(() => fs.writeFile(trFile, JSON.stringify(trCache), () => {}), 3000) }
async function machineTranslate(texts, lang) {
  if (process.env.GOOGLE_TRANSLATE_KEY) {
    const r = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, source: 'ru', target: lang, format: 'text' }),
    })
    return (await r.json()).data.translations.map((x) => x.translatedText)
  }
  if (process.env.DEEPL_KEY && lang === 'en') {
    const host = process.env.DEEPL_KEY.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com'
    const r = await fetch(`https://${host}/v2/translate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `DeepL-Auth-Key ${process.env.DEEPL_KEY}` },
      body: JSON.stringify({ text: texts, source_lang: 'RU', target_lang: 'EN-US' }),
    })
    return (await r.json()).translations.map((x) => x.text)
  }
  return []
}
on('POST', '/api/translate', async ({ body, ip }) => {
  if (limiter.hit(`tr:${ip}`, 60, 60_000)) fail(429, 'Слишком много запросов')
  const lang = body.lang === 'kk' ? 'kk' : 'en'
  const texts = (Array.isArray(body.texts) ? body.texts : []).slice(0, 50).map(String).filter((t) => t.length < 1200 && /[А-Яа-яЁё]/.test(t))
  const map = {}, need = []
  for (const t of texts) (trCache[`${lang}|${t}`] ? (map[t] = trCache[`${lang}|${t}`]) : need.push(t))
  const today = Math.floor(Date.now() / 864e5)
  if (today !== trDay) { trDay = today; trChars = 0 }
  const size = need.reduce((a, t) => a + t.length, 0)
  if (need.length && trChars + size <= Number(process.env.TRANSLATE_DAILY_CHARS || 300000)) {
    try {
      const out = await machineTranslate(need, lang)
      trChars += size
      need.forEach((t, i) => { if (out[i]) { map[t] = trCache[`${lang}|${t}`] = out[i] } })
      if (out.length) trSave()
    } catch { /* вернём то, что есть */ }
  }
  return [200, { map }]
}, true)

on('GET', '/api/username-available', ({ ip, query }) => {
  if (limiter.hit(`avail:${ip}`, 60, 600_000)) fail(429, 'Слишком много запросов.')
  const u = String(query.get('u') ?? '').trim().toLowerCase(), bad = L.checkUsername(u)
  return [200, bad ? { available: false, reason: bad } : store.user.byName(u) ? { available: false, reason: 'Этот логин уже занят.' } : { available: true }]
}, true)

on('POST', '/api/register', async ({ body, ip, req }) => {
  authLimit(ip)
  const email = String(body.email ?? '').trim().toLowerCase(), username = String(body.username ?? '').trim().toLowerCase(), pass = String(body.password ?? '')
  if (!L.EMAIL.test(email)) fail(400, 'Введите корректный email.')
  const badName = L.checkUsername(username); if (badName) fail(400, badName)
  const badPass = L.checkPassword(pass, username, email.split('@')[0]); if (badPass) fail(400, badPass)
  if (store.user.byEmail(email)) fail(409, 'Этот email уже зарегистрирован. Войдите в аккаунт.')
  if (store.user.byName(username)) fail(409, 'Этот логин уже занят.')
  const id = crypto.randomUUID(), pw = await L.hashSecret(pass), code = L.newRecoveryCode(), rec = await L.hashSecret(L.normCode(code))
  try { store.user.create({ id, email, username, salt: pw.salt, hash: pw.hash, rsalt: rec.salt, rhash: rec.hash, createdAt: Date.now() }) } catch { fail(409, 'Такой email или логин уже заняты.') }
  return [201, { token: await issue(id, req), user: { id, email, username }, createdAt: Date.now(), recoveryCode: code }]
}, true)

on('POST', '/api/login', async ({ body, ip, req }) => {
  authLimit(ip)
  const key = String(body.login ?? '').trim().toLowerCase().slice(0, 255), lock = `login:${key}`
  if (limiter.locked(lock)) fail(429, 'Слишком много неудачных попыток. Попробуйте через 15 минут или восстановите пароль.')
  const u = store.user.byEmail(key) ?? store.user.byName(key)
  const ok = u ? await L.verifySecret(body.password, u.salt, u.hash) : (await L.fakeVerify(), false)
  if (!ok) { limiter.fail(lock, 5, 15 * 60_000); fail(401, 'Неверный логин или пароль.') }
  limiter.clear(lock)
  return [200, { token: await issue(u.id, req), user: accountOut(u), createdAt: u.createdAt }]
}, true)

// Восстановление доступа по коду, который выдаётся при регистрации (почты в проекте нет)
on('POST', '/api/recover', async ({ body, ip, req }) => {
  authLimit(ip)
  const key = String(body.login ?? '').trim().toLowerCase().slice(0, 255), lock = `rec:${key}`
  if (limiter.locked(lock)) fail(429, 'Слишком много попыток. Попробуйте позже.')
  const u = store.user.byEmail(key) ?? store.user.byName(key)
  const ok = u?.rhash ? await L.verifySecret(L.normCode(body.code), u.rsalt, u.rhash) : (await L.fakeVerify(), false)
  if (!ok) { limiter.fail(lock, 5, 30 * 60_000); fail(401, 'Логин или код восстановления неверны.') }
  const pass = String(body.password ?? ''), bad = L.checkPassword(pass, u.username, u.email.split('@')[0]); if (bad) fail(400, bad)
  const pw = await L.hashSecret(pass), code = L.newRecoveryCode(), rec = await L.hashSecret(L.normCode(code))
  store.tx(() => { store.user.setPassword(u.id, pw.salt, pw.hash); store.user.setRecovery(u.id, rec.salt, rec.hash); store.session.removeAll(u.id) })
  limiter.clear(lock); limiter.clear(`login:${key}`)
  return [200, { token: await issue(u.id, req), user: accountOut(u), createdAt: u.createdAt, recoveryCode: code }] // старый код сгорел — выдан новый
}, true)

on('POST', '/api/logout', ({ auth }) => { store.session.remove(auth.hash); return [200, { ok: true }] })

on('GET', '/api/me', ({ auth: { user } }) => {
  const s = store.user.getState(user.id)
  return [200, { user: accountOut(user), createdAt: user.createdAt, state: s?.state ?? null, updatedAt: s?.updatedAt ?? 0 }]
})

on('PUT', '/api/state', ({ auth: { user }, body }) => {
  let clean
  try { clean = L.sanitizeState(body.state) } catch (e) { fail(400, e.message) }
  const at = Math.min(Number(body.updatedAt) || Date.now(), Date.now() + 60_000), cur = store.user.getState(user.id)
  // устройство с устаревшими данными не должно затирать более новый прогресс
  if (cur?.state && at < cur.updatedAt) return [409, { error: 'На сервере более свежие данные.', state: cur.state, updatedAt: cur.updatedAt }]
  store.user.setState(user.id, clean, at, L.makeCard(clean))
  return [200, { ok: true, at }]
})

// --- безопасность аккаунта ---
on('GET', '/api/sessions', ({ auth }) => [200, { sessions: store.session.list(auth.user.id).map((s) => ({ id: s.hash.slice(0, 10), current: s.hash === auth.hash, device: device(s.ua), createdAt: s.createdAt })) }])
on('POST', '/api/sessions/revoke-others', ({ auth }) => { store.session.removeOthers(auth.user.id, auth.hash); return [200, { ok: true }] })

async function confirmPassword(user, pass) {
  const lock = `pw:${user.id}`
  if (limiter.locked(lock)) fail(429, 'Слишком много неверных паролей. Попробуйте позже.')
  if (!(await L.verifySecret(pass, user.salt, user.hash))) { limiter.fail(lock, 5, 15 * 60_000); fail(403, 'Неверный пароль.') }
  limiter.clear(lock)
}
on('POST', '/api/password', async ({ auth, body }) => {
  await confirmPassword(auth.user, body.current)
  const next = String(body.next ?? ''), bad = L.checkPassword(next, auth.user.username, auth.user.email.split('@')[0]); if (bad) fail(400, bad)
  const pw = await L.hashSecret(next)
  store.tx(() => { store.user.setPassword(auth.user.id, pw.salt, pw.hash); store.session.removeOthers(auth.user.id, auth.hash) })
  return [200, { ok: true }]
})
on('POST', '/api/recovery-code', async ({ auth, body }) => {
  await confirmPassword(auth.user, body.password)
  const code = L.newRecoveryCode(), rec = await L.hashSecret(L.normCode(code))
  store.user.setRecovery(auth.user.id, rec.salt, rec.hash)
  return [200, { recoveryCode: code }]
})
on('GET', '/api/export', ({ auth: { user } }) => {
  const s = store.user.getState(user.id), rels = relMap(user.id)
  const friends = [...rels].filter(([, r]) => r === 'friend').map(([id]) => byId(id)?.username).filter(Boolean)
  return [200, { exportedAt: new Date().toISOString(), account: { ...accountOut(user), createdAt: new Date(user.createdAt).toISOString() }, friends, state: s?.state ?? null },
    { 'Content-Disposition': 'attachment; filename="gas-data.json"' }]
})
on('DELETE', '/api/me', async ({ auth: { user }, body }) => {
  await confirmPassword(user, body.password)
  store.user.remove(user.id) // сессии, заявки и блокировки удаляются каскадно
  return [200, { ok: true }]
})

// --- рейтинг ---
on('GET', '/api/leaderboard', ({ auth: { user: me }, query }) => {
  const pick = (k, list, d) => (list.includes(query.get(k)) ? query.get(k) : d)
  const scope = pick('scope', ['all', 'friends', 'country'], 'all'), period = pick('period', ['week', 'month', 'all'], 'week'), metric = pick('metric', ['xp', 'blitz'], 'xp')
  const rels = relMap(me.id), blocked = store.block.of(me.id), myCountry = me.card?.country || byId(me.id)?.card?.country || ''
  let rows = store.user.all().filter((u) => {
    if (u.id === me.id) return true
    if (blocked.has(u.id)) return false
    const r = rels.get(u.id)
    if (scope === 'friends') return r === 'friend'
    if (scope === 'country') return !!myCountry && u.card.country === myCountry && !u.card.hidden
    return r === 'friend' || !u.card.hidden
  })
  rows = rows.map((u) => { const p = pub(u, me.id, rels); return { ...p, score: scoreOf(p, metric, period) } })
  if (metric === 'blitz') rows = rows.filter((r) => r.score > 0 || r.id === me.id || r.relation === 'friend')
  rows.sort((a, b) => b.score - a.score || a.joined - b.joined)
  let rank = 0, prev = null
  rows.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score } r.rank = rank })
  const mine = rows.find((r) => r.id === me.id)
  const slim = ({ id, username, name, avatar, color, pro, level, streak, score, rank, country, relation, today }) => ({ id, username, name, avatar, color, pro, level, streak, score, rank, country, relation, today })
  return [200, { rows: rows.slice(0, 50).map(slim), me: mine ? { rank: mine.rank, score: mine.score, total: rows.length } : null, resetsIn: metric === 'xp' && period !== 'all' ? daysTo(period) : null, scope, period, metric, hasCountry: !!myCountry }]
})

// --- друзья ---
const LIMITS = { friends: 300, outgoing: 30 }
on('GET', '/api/friends', ({ auth: { user } }) => {
  const rels = relMap(user.id), blocked = store.block.of(user.id), out = { friends: [], incoming: [], outgoing: [], blocked: [] }
  for (const [id, r] of rels) { const u = byId(id); if (u && !blocked.has(id)) out[r === 'friend' ? 'friends' : r === 'incoming' ? 'incoming' : 'outgoing'].push(pub(u, user.id, rels)) }
  out.friends.sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name))
  out.blocked = store.block.list(user.id).map(byId).filter(Boolean).map((u) => pub(u, user.id, rels))
  return [200, out]
})

on('GET', '/api/users/search', ({ auth: { user }, query }) => {
  const q = String(query.get('q') ?? '').trim().toLowerCase().replace(/^@/, '').slice(0, 30)
  if (q.length < 2) return [200, { users: [] }]
  const rels = relMap(user.id), blocked = store.block.of(user.id)
  const rank = (u) => { const n = (u.card?.name ?? '').toLowerCase(), vis = u.card && !u.card.hidden; return u.username === q ? 0 : u.username.startsWith(q) ? 1 : vis && n.startsWith(q) ? 2 : u.username.includes(q) || (vis && n.includes(q)) ? 3 : 9 }
  const hit = store.user.all().filter((u) => u.id !== user.id && !blocked.has(u.id) && rank(u) < 9).sort((a, b) => rank(a) - rank(b) || a.username.localeCompare(b.username)).slice(0, 15)
  return [200, { users: hit.map((u) => pub(u, user.id, rels)) }]
})

// «Возможные друзья»: та же страна, близкий уровень, недавняя активность
on('GET', '/api/friends/suggestions', ({ auth: { user } }) => {
  const rels = relMap(user.id), blocked = store.block.of(user.id), mine = byId(user.id)?.card ?? {}, recent = dayStr(-3)
  const list = store.user.all().filter((u) => u.id !== user.id && !rels.has(u.id) && !blocked.has(u.id) && !u.card.hidden)
    .map((u) => ({ u, s: (mine.country && u.card.country === mine.country ? 3 : 0) + (Math.abs((u.card.xp ?? 0) - (mine.xp ?? 0)) < 400 ? 2 : 0) + (u.card.lastDay >= recent ? 1 : 0) + Math.random() * 0.5 }))
    .sort((a, b) => b.s - a.s).slice(0, 6)
  return [200, { users: list.map(({ u }) => pub(u, user.id, rels)) }]
})

on('GET', '/api/users/([\\w-]+)', ({ auth: { user }, params }) => {
  const u = byId(params[0]) ?? store.user.byName(params[0].toLowerCase())
  if (!u || (u.id !== user.id && store.block.has(user.id, u.id))) fail(404, 'Пользователь не найден.')
  return [200, { user: pub(u, user.id, relMap(user.id)) }]
})

on('POST', '/api/friends/request', ({ auth: { user }, body }) => {
  const key = String(body.id ?? body.username ?? '').toLowerCase().replace(/^@/, ''), t = byId(body.id) ?? store.user.byName(key)
  if (!t || store.block.has(user.id, t.id)) fail(404, 'Пользователь не найден.')
  if (t.id === user.id) fail(400, 'Нельзя добавить самого себя.')
  const rels = relMap(user.id), r = rels.get(t.id), mine = [...rels.values()]
  if (r === 'friend') fail(409, 'Вы уже друзья.')
  if (r === 'outgoing') fail(409, 'Заявка уже отправлена.')
  if (mine.filter((x) => x === 'friend').length >= LIMITS.friends) fail(409, `Максимум друзей — ${LIMITS.friends}.`)
  if (r === 'incoming') { store.link.accept(t.id, user.id); return [200, { relation: 'friend' }] } // встречная заявка — сразу дружим
  if (mine.filter((x) => x === 'outgoing').length >= LIMITS.outgoing) fail(429, 'Слишком много неотвеченных заявок. Дождитесь ответов или отмените часть.')
  store.link.create(user.id, t.id)
  return [200, { relation: 'outgoing' }]
})
on('POST', '/api/friends/accept', ({ auth: { user }, body }) => {
  const l = store.link.get(String(body.id), user.id)
  if (!l || l.status !== 'pending' || l.b !== user.id) fail(404, 'Заявка не найдена.')
  store.link.accept(l.a, user.id)
  return [200, { relation: 'friend' }]
})
on('POST', '/api/friends/decline', ({ auth: { user }, body }) => { // отклонить входящую или отменить исходящую
  const l = store.link.get(String(body.id), user.id)
  if (l?.status === 'pending') store.link.remove(l.a, l.b)
  return [200, { relation: 'none' }]
})
on('DELETE', '/api/friends/([\\w-]+)', ({ auth: { user }, params }) => {
  const l = store.link.get(params[0], user.id)
  if (l?.status === 'accepted') store.link.remove(l.a, l.b)
  return [200, { relation: 'none' }]
})

// --- блокировки ---
on('POST', '/api/blocks', ({ auth: { user }, body }) => {
  const t = byId(String(body.id))
  if (!t || t.id === user.id) fail(404, 'Пользователь не найден.')
  store.tx(() => { store.link.remove(user.id, t.id); store.block.add(user.id, t.id) })
  return [200, { ok: true }]
})
on('DELETE', '/api/blocks/([\\w-]+)', ({ auth: { user }, params }) => { store.block.remove(user.id, params[0]); return [200, { ok: true }] })


// --- админка + цены ---
const SETTINGS_FILE = path.join(DATA, 'settings.json')
const DEFAULT_PRICES = {
  month: { rub: 1490, label: '1 490 ₸ / мес', stars: 0, starsLabel: '' },
  year: { rub: 9990, label: '9 990 ₸ / год', stars: 0, starsLabel: '' },
}
function loadSettings() {
  try {
    const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
    return {
      prices: {
        month: { ...DEFAULT_PRICES.month, ...(s.prices?.month || {}) },
        year: { ...DEFAULT_PRICES.year, ...(s.prices?.year || {}) },
      },
      admins: Array.isArray(s.admins) ? s.admins : [],
      note: s.note || '',
    }
  } catch {
    return { prices: structuredClone(DEFAULT_PRICES), admins: [], note: '' }
  }
}
function saveSettings(s) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2), { mode: 0o600 })
}
let settings = loadSettings()

function requireAdmin(req, auth) {
  const key = process.env.ADMIN_KEY || ''
  const hdr = String(req.headers['x-admin-key'] || '')
  if (key && hdr && hdr === key) return { via: 'key' }
  const list = (process.env.ADMIN_USERS || '').split(/[,\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean)
  const uname = auth?.user?.username?.toLowerCase()
  if (uname && (list.includes(uname) || settings.admins.map((a) => a.toLowerCase()).includes(uname))) return { via: 'user' }
  fail(403, 'Нет доступа к админке.')
}

on('GET', '/api/pricing', () => {
  const p = settings.prices
  return [200, {
    month: p.month.label,
    year: p.year.label,
    monthStars: p.month.starsLabel,
    yearStars: p.year.starsLabel,
    raw: p,
  }]
}, true)

on('GET', '/api/admin/stats', ({ req, auth }) => {
  requireAdmin(req, auth)
  const users = store.user.all()
  let pro = 0, xpSum = 0
  for (const u of users) {
    const st = store.user.getState(u.id)?.state
    if (st?.pro) pro++
    xpSum += st?.xp || 0
  }
  return [200, {
    users: users.length,
    pro,
    xpSum,
    prices: settings.prices,
    note: settings.note,
    driver: store.driver,
  }]
}, true)

on('GET', '/api/admin/users', ({ req, auth, query }) => {
  requireAdmin(req, auth)
  const q = (query.get('q') || '').toLowerCase().trim()
  const limit = Math.min(100, Math.max(1, Number(query.get('limit')) || 50))
  let rows = store.user.all()
  if (q) rows = rows.filter((u) => (u.username || '').toLowerCase().includes(q))
  rows.sort((a, b) => b.createdAt - a.createdAt)
  const out = rows.slice(0, limit).map((u) => {
    const st = store.user.getState(u.id)?.state
    const full = store.user.byId(u.id)
    return {
      id: u.id,
      username: u.username,
      email: full?.email ? full.email.replace(/(.{2}).+(@.+)/, '$1***$2') : '',
      createdAt: u.createdAt,
      pro: !!st?.pro,
      proPlan: st?.proPlan || null,
      xp: st?.xp || 0,
      streak: st?.streak || 0,
      name: st?.profile?.name || '',
    }
  })
  return [200, { users: out, total: store.user.count() }]
}, true)

on('POST', '/api/admin/pro', ({ req, auth, body }) => {
  requireAdmin(req, auth)
  const id = String(body.id || '')
  const pro = !!body.pro
  const plan = body.plan === 'year' ? 'year' : body.plan === 'month' ? 'month' : null
  const st = store.user.getState(id)
  if (!st?.state) fail(404, 'Пользователь или прогресс не найден.')
  const next = { ...st.state, pro, proPlan: pro ? (plan || st.state.proPlan || 'month') : null }
  let clean
  try { clean = L.sanitizeState(next) } catch (e) { fail(400, e.message) }
  store.user.setState(id, clean, Date.now(), L.makeCard(clean))
  return [200, { ok: true, pro, proPlan: clean.proPlan }]
}, true)

on('PUT', '/api/admin/prices', ({ req, auth, body }) => {
  requireAdmin(req, auth)
  const m = body.month || {}, y = body.year || {}
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const month = {
    rub: Number(m.rub) || settings.prices.month.rub,
    stars: Number(m.stars) || settings.prices.month.stars,
  }
  month.label = m.label || `${fmt(month.rub)} ₸ / мес`
  month.starsLabel = m.starsLabel || `${fmt(month.stars)} ⭐ / мес`
  const year = {
    rub: Number(y.rub) || settings.prices.year.rub,
    stars: Number(y.stars) || settings.prices.year.stars,
  }
  year.label = y.label || `${fmt(year.rub)} ₸ / год`
  year.starsLabel = y.starsLabel || `${fmt(year.stars)} ⭐ / год`
  settings = { ...settings, prices: { month, year }, note: String(body.note ?? settings.note).slice(0, 200) }
  saveSettings(settings)
  return [200, { ok: true, prices: settings.prices }]
}, true)

on('GET', '/api/admin/me', ({ req, auth }) => {
  const key = process.env.ADMIN_KEY || ''
  const hdr = String(req.headers['x-admin-key'] || '')
  if (key && hdr && hdr === key) return [200, { admin: true }]
  const list = (process.env.ADMIN_USERS || '').split(/[,\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean)
  const uname = auth?.user?.username?.toLowerCase()
  const ok = uname && (list.includes(uname) || settings.admins.map((a) => a.toLowerCase()).includes(uname))
  return [200, { admin: !!ok }]
}, true)

// ---------- статика (продакшен) ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }
function serveStatic(url, res) {
  let file = path.join(DIST, path.normalize(decodeURIComponent(url.pathname)))
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'Forbidden' })
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html') // SPA
  if (!fs.existsSync(file)) return send(res, 404, { error: 'Сайт не собран: выполните npm run build' })
  const html = file.endsWith('.html')
  secure(res, html)
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' })
  fs.createReadStream(file).pipe(res)
}

// Обработчик запросов. next — когда сервер встроен в Vite: не-API запросы отдаём Vite.
export async function handler(req, res, next) {
  const url = new URL(req.url, 'http://x'), ip = clientIp(req)
  if (!url.pathname.startsWith('/api/')) return next ? next() : serveStatic(url, res)
  secure(res)
  if (process.env.HSTS === '1' || req.headers['x-forwarded-proto'] === 'https') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  const origin = process.env.CORS_ORIGIN
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS') }
  if (req.method === 'OPTIONS') return send(res, 204, {})
  try {
    if (limiter.hit(`ip:${ip}`, 600, 60_000)) fail(429, 'Слишком много запросов. Подождите минуту.')
    for (const r of routes) {
      const m = r.method === req.method && url.pathname.match(r.re)
      if (!m) continue
      const auth = authUser(req)
      if (!r.open && !auth) fail(401, 'Требуется вход.')
      const body = ['POST', 'PUT', 'DELETE'].includes(req.method) ? await readBody(req) : {}
      const [code, data, headers] = await r.handler({ req, ip, auth, body, params: m.slice(1), query: url.searchParams })
      return send(res, code, data, headers)
    }
    fail(404, 'Не найдено.')
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e)
    send(res, e.code ?? 500, { error: e instanceof HttpError ? e.message : 'Ошибка сервера.', ...(e.extra ?? {}) })
  }
}

// Отдельный запуск. При импорте из Vite порт не занимается.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  http.createServer(handler).listen(PORT, () => console.log(`GAS API: http://localhost:${PORT}`))
}
