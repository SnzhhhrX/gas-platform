// Автотесты backend: `npm test`. Поднимают временный сервер (SQLite и JSON-хранилище) и проверяют регистрацию,
// пароли, восстановление, синхронизацию, рейтинг, друзей, блокировки и безопасность. Данные пользователей не затрагиваются.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let B = ''
async function suite() {
  let fails = 0
  const ok = (c, m) => { if (!c) { fails++; console.log('  ✗', m) } else console.log('  ✓', m) }
  const call = async (p, { m = 'GET', body, t } = {}) => { const r = await fetch(B + '/api' + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { s: r.status, d: await r.json().catch(() => ({})), h: r.headers } }
  const reg = (n, extra = {}) => call('/register', { m: 'POST', body: { email: n + '@x.com', username: n, password: 'Str0ng-pass', ...extra } })
  console.log('health'); ok((await call('/health')).d.ok, 'health ok')
  console.log('register validation')
  ok((await reg('ab')).s === 400, 'short username rejected')
  ok((await reg('admin')).s === 400, 'reserved username rejected')
  ok((await call('/register', { m: 'POST', body: { email: 'q@x.com', username: 'qwerty1', password: '12345678' } })).s === 400, 'common password rejected')
  ok((await call('/register', { m: 'POST', body: { email: 'q@x.com', username: 'qwerty1', password: 'short' } })).s === 400, 'short password rejected')
  ok((await call('/register', { m: 'POST', body: { email: 'bad', username: 'qwerty1', password: 'Str0ng-pass' } })).s === 400, 'bad email rejected')
  ok((await call('/register', { m: 'POST', body: { email: 'q@x.com', username: 'alicexx', password: 'alicexx-1' } })).s === 400, 'password containing login rejected')
  console.log('register + availability')
  const A = await reg('alice'), Bo = await reg('bobby'), C = await reg('carol')
  ok(A.s === 201 && /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(A.d.recoveryCode), 'alice registered, recovery code format')
  ok((await reg('alice')).s === 409, 'duplicate username → 409')
  ok((await call('/username-available?u=alice')).d.available === false, 'availability: taken')
  ok((await call('/username-available?u=zoe_1')).d.available === true, 'availability: free')
  const ta = A.d.token, tb = Bo.d.token, tc = C.d.token, ia = A.d.user.id, ib = Bo.d.user.id, ic = C.d.user.id
  console.log('login')
  ok((await call('/login', { m: 'POST', body: { login: 'ALICE', password: 'Str0ng-pass' } })).s === 200, 'login by username (case-insens.)')
  ok((await call('/login', { m: 'POST', body: { login: 'alice@x.com', password: 'Str0ng-pass' } })).s === 200, 'login by email')
  ok((await call('/login', { m: 'POST', body: { login: 'nobody', password: 'x' } })).s === 401, 'unknown user → 401')
  for (let i = 0; i < 5; i++) await call('/login', { m: 'POST', body: { login: 'carol', password: 'wrong' + i } })
  ok((await call('/login', { m: 'POST', body: { login: 'carol', password: 'Str0ng-pass' } })).s === 429, 'account locked after 5 failures')
  console.log('state sync + sanitization + conflict')
  const st = { xp: 250, streak: 3, lastDay: new Date().toISOString().slice(0, 10), activity: { [new Date().toISOString().slice(0, 10)]: 40 }, profile: { name: 'Алиса\u0000<b>', avatar: '🦊', country: '643', goal: 999, bio: 'x'.repeat(500) }, seen: ['first'], records: { blitz: 12 }, stats: { answered: 10, correct: 8 } }
  const put = await call('/state', { m: 'PUT', t: ta, body: { state: st, updatedAt: 1000 } })
  ok(put.s === 200, 'state saved')
  const me = await call('/me', { t: ta })
  ok(me.d.state.profile.bio.length === 120 && me.d.state.profile.goal === 30 && !me.d.state.profile.name.includes('\u0000'), 'state sanitized (bio cut, goal fixed, control chars gone)')
  ok((await call('/state', { m: 'PUT', t: ta, body: { state: { ...st, xp: 1 }, updatedAt: 500 } })).s === 409, 'stale write → 409')
  ok((await call('/state', { m: 'PUT', t: ta, body: { state: { ...st, xp: -5, streak: 'x' }, updatedAt: 2000 } })).s === 200, 'garbage numbers tolerated')
  ok((await call('/me', { t: ta })).d.state.xp === 0, 'negative xp clamped to 0')
  await call('/state', { m: 'PUT', t: ta, body: { state: st, updatedAt: 3000 } })
  await call('/state', { m: 'PUT', t: tb, body: { state: { ...st, xp: 900, activity: {}, profile: { name: 'Боб', avatar: '🐼', country: '643' }, records: { blitz: 30 } }, updatedAt: 1000 } })
  await call('/state', { m: 'PUT', t: tc, body: { state: { ...st, xp: 100, profile: { name: 'Кэрол', hidden: true } }, updatedAt: 1000 } })
  console.log('leaderboard')
  let lb = (await call('/leaderboard?scope=all&period=all', { t: tb })).d
  ok(lb.rows[0].username === 'bobby' && lb.rows[0].rank === 1 && lb.me.rank === 1, 'all-time: bob #1 and own rank')
  ok(!lb.rows.some((r) => r.username === 'carol'), 'hidden user not in public rating')
  lb = (await call('/leaderboard?scope=all&period=week', { t: ta })).d
  ok(lb.rows[0].username === 'alice' && lb.resetsIn >= 1 && lb.resetsIn <= 7, 'weekly: alice leads (only active), resetsIn ok')
  lb = (await call('/leaderboard?metric=blitz', { t: ta })).d
  ok(lb.rows[0].username === 'bobby' && lb.rows[0].score === 30, 'blitz metric ranking')
  lb = (await call('/leaderboard?scope=country&period=all', { t: ta })).d
  ok(lb.rows.length === 2 && lb.hasCountry, 'country scope: same-country players')
  console.log('friends')
  ok((await call('/users/search?q=bo', { t: ta })).d.users[0].username === 'bobby', 'search finds bobby')
  ok((await call('/users/search?q=a', { t: ta })).d.users.length === 0, 'search needs ≥2 chars')
  ok((await call('/friends/suggestions', { t: ta })).d.users.some((u) => u.username === 'bobby'), 'suggestions include bobby')
  ok((await call('/friends/request', { m: 'POST', t: ta, body: { id: ia } })).s === 400, 'cannot add self')
  ok((await call('/friends/request', { m: 'POST', t: ta, body: { id: ib } })).d.relation === 'outgoing', 'request sent')
  ok((await call('/friends/request', { m: 'POST', t: ta, body: { id: ib } })).s === 409, 'duplicate request → 409')
  ok((await call('/friends', { t: tb })).d.incoming[0].username === 'alice', 'bob sees incoming')
  ok((await call('/friends/accept', { m: 'POST', t: tb, body: { id: ia } })).d.relation === 'friend', 'accepted')
  ok((await call('/friends/accept', { m: 'POST', t: ta, body: { id: ib } })).s === 404, 'sender cannot accept own request')
  lb = (await call('/leaderboard?scope=friends&period=all', { t: ta })).d
  ok(lb.rows.length === 2, 'friends scope shows me + bob')
  console.log('blocking')
  ok((await call('/blocks', { m: 'POST', t: tb, body: { id: ia } })).d.ok, 'bob blocks alice (friendship removed)')
  ok((await call('/friends', { t: ta })).d.friends.length === 0, 'friendship gone')
  ok((await call('/users/search?q=bobby', { t: ta })).d.users.length === 0, 'blocked: hidden from search')
  ok((await call('/friends/request', { m: 'POST', t: ta, body: { id: ib } })).s === 404, 'blocked: cannot send request')
  ok((await call('/users/' + ib, { t: ta })).s === 404, 'blocked: profile hidden')
  ok((await call('/friends', { t: tb })).d.blocked[0].username === 'alice', 'blocked list')
  await call('/blocks/' + ia, { m: 'DELETE', t: tb })
  ok((await call('/users/bobby', { t: ta })).d.user.username === 'bobby', 'unblock → visible again, lookup by username')
  console.log('security')
  ok((await call('/me')).s === 401 && (await call('/me', { t: 'junk' })).s === 401, 'auth required')
  ok((await call('/password', { m: 'POST', t: ta, body: { current: 'wrong', next: 'N3w-strong-pass' } })).s === 403, 'password change needs current password')
  const t2 = (await call('/login', { m: 'POST', body: { login: 'alice', password: 'Str0ng-pass' } })).d.token
  ok((await call('/sessions', { t: ta })).d.sessions.length >= 2, 'sessions listed')
  ok((await call('/password', { m: 'POST', t: ta, body: { current: 'Str0ng-pass', next: 'N3w-strong-pass' } })).s === 200, 'password changed')
  ok((await call('/me', { t: t2 })).s === 401, 'other sessions revoked after password change')
  ok((await call('/login', { m: 'POST', body: { login: 'alice', password: 'N3w-strong-pass' } })).s === 200, 'new password works')
  console.log('recovery')
  ok((await call('/recover', { m: 'POST', body: { login: 'bobby', code: 'AAAA-BBBB-CCCC', password: 'Rec0ver-pass' } })).s === 401, 'wrong recovery code')
  const rc = await call('/recover', { m: 'POST', body: { login: 'bobby', code: Bo.d.recoveryCode.toLowerCase().replace(/-/g, ' '), password: 'Rec0ver-pass' } })
  ok(rc.s === 200 && rc.d.recoveryCode && rc.d.recoveryCode !== Bo.d.recoveryCode, 'recovery works (case/format tolerant), new code issued')
  ok((await call('/me', { t: tb })).s === 401, 'old sessions revoked after recovery')
  ok((await call('/recover', { m: 'POST', body: { login: 'bobby', code: Bo.d.recoveryCode, password: 'Another-pass1' } })).s === 401, 'used recovery code is dead')
  console.log('export + delete')
  const ex = await call('/export', { t: ta })
  ok(ex.d.account.username === 'alice' && ex.d.state.xp === 250 && /attachment/.test(ex.h.get('content-disposition')), 'export contains data')
  ok((await call('/me', { m: 'DELETE', t: ta, body: { password: 'wrong' } })).s === 403, 'delete needs password')
  ok((await call('/me', { m: 'DELETE', t: ta, body: { password: 'N3w-strong-pass' } })).s === 200, 'account deleted')
  ok((await call('/users/search?q=alice', { t: rc.d.token })).d.users.length === 0, 'deleted user gone from search')
  ok(((await call('/health')).h.get('x-content-type-options')) === 'nosniff', 'security headers present')
  console.log(fails ? `\nFAILED: ${fails}` : '\nALL PASSED')
  return fails
}

async function withServer(driver, port) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-test-'))
  const child = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, GAS_DB: driver, DATA_DIR: dir, PORT: String(port) }, stdio: 'ignore' })
  B = `http://localhost:${port}`
  try {
    for (let i = 0; i < 40; i++) { try { if ((await fetch(B + '/api/health')).ok) break } catch {} await new Promise((r) => setTimeout(r, 150)) }
    console.log(`\n=== Хранилище: ${driver} ===`)
    return await suite()
  } finally {
    await new Promise((done) => { child.once('exit', done); child.kill() }) // дождаться остановки: сервер сбрасывает данные на диск
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })
  }
}

let total = 0
for (const [i, d] of ['sqlite', 'json'].entries()) total += await withServer(d, 8920 + i)
console.log(total ? `\nПровалено проверок: ${total}` : '\nВсе проверки пройдены')
process.exit(total ? 1 : 0)
