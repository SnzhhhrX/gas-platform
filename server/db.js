// Хранилище. Основной драйвер — SQLite (node:sqlite, Node 22.13+): транзакции, WAL, ограничения целостности.
// Если SQLite недоступен (старый Node) — запасной драйвер: JSON-файл с атомарной записью и проверкой при чтении.
// Оба драйвера дают один и тот же интерфейс, остальной код про них не знает.
import fs from 'node:fs'
import path from 'node:path'

const j = (v) => JSON.stringify(v)
const unj = (s) => { try { return JSON.parse(s) } catch { return null } }

export async function openStore(dir, want = process.env.GAS_DB) {
  fs.mkdirSync(path.join(dir, 'backups'), { recursive: true, mode: 0o700 })
  if (want !== 'json') {
    try {
      const { DatabaseSync } = await import('node:sqlite')
      return sqliteStore(DatabaseSync, dir)
    } catch (e) {
      if (want === 'sqlite') throw e
      console.warn('! SQLite недоступен (нужен Node 22.13+), используется JSON-хранилище.')
    }
  }
  return jsonStore(dir)
}

// ---------------- SQLite ----------------
function sqliteStore(DatabaseSync, dir) {
  const file = path.join(dir, 'gas.sqlite')
  const db = new DatabaseSync(file)
  db.exec(`
    PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, username TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL, hash TEXT NOT NULL, rsalt TEXT, rhash TEXT,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL DEFAULT 0, state TEXT, card TEXT);
    CREATE TABLE IF NOT EXISTS sessions (
      hash TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, exp INTEGER NOT NULL, created_at INTEGER NOT NULL, ua TEXT);
    CREATE INDEX IF NOT EXISTS sessions_uid ON sessions(uid);
    CREATE TABLE IF NOT EXISTS links (
      a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (a, b));
    CREATE INDEX IF NOT EXISTS links_b ON links(b);
    CREATE TABLE IF NOT EXISTS blocks (
      by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, target TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      at INTEGER NOT NULL, PRIMARY KEY (by, target));
  `)
  const q = (sql) => db.prepare(sql)
  const S = {
    byId: q('SELECT * FROM users WHERE id = ?'), byEmail: q('SELECT * FROM users WHERE email = ?'), byName: q('SELECT * FROM users WHERE username = ?'),
    create: q('INSERT INTO users (id, email, username, salt, hash, rsalt, rhash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
    setPass: q('UPDATE users SET salt = ?, hash = ? WHERE id = ?'), setRec: q('UPDATE users SET rsalt = ?, rhash = ? WHERE id = ?'),
    setState: q('UPDATE users SET state = ?, updated_at = ?, card = ? WHERE id = ?'), del: q('DELETE FROM users WHERE id = ?'),
    all: q('SELECT id, username, created_at, card FROM users'), count: q('SELECT COUNT(*) AS n FROM users'),
    sNew: q('INSERT INTO sessions (hash, uid, exp, created_at, ua) VALUES (?, ?, ?, ?, ?)'), sGet: q('SELECT * FROM sessions WHERE hash = ?'),
    sTouch: q('UPDATE sessions SET exp = ? WHERE hash = ?'), sDel: q('DELETE FROM sessions WHERE hash = ?'),
    sOthers: q('DELETE FROM sessions WHERE uid = ? AND hash != ?'), sAll: q('DELETE FROM sessions WHERE uid = ?'),
    sList: q('SELECT hash, created_at, exp, ua FROM sessions WHERE uid = ? AND exp > ? ORDER BY created_at DESC'), sPurge: q('DELETE FROM sessions WHERE exp < ?'),
    lGet: q('SELECT * FROM links WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)'), lNew: q('INSERT OR IGNORE INTO links (a, b, status, at) VALUES (?, ?, ?, ?)'),
    lAcc: q("UPDATE links SET status = 'accepted' WHERE a = ? AND b = ?"), lDel: q('DELETE FROM links WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)'),
    lOf: q('SELECT * FROM links WHERE a = ? OR b = ?'),
    bHas: q('SELECT 1 AS x FROM blocks WHERE (by = ? AND target = ?) OR (by = ? AND target = ?)'), bNew: q('INSERT OR IGNORE INTO blocks (by, target, at) VALUES (?, ?, ?)'),
    bDel: q('DELETE FROM blocks WHERE by = ? AND target = ?'), bList: q('SELECT target FROM blocks WHERE by = ?'), bOf: q('SELECT by, target FROM blocks WHERE by = ? OR target = ?'),
  }
  const user = (r) => r && { id: r.id, email: r.email, username: r.username, salt: r.salt, hash: r.hash, rsalt: r.rsalt, rhash: r.rhash, createdAt: r.created_at, updatedAt: r.updated_at, card: unj(r.card) }
  const tx = (fn) => { db.exec('BEGIN IMMEDIATE'); try { const r = fn(); db.exec('COMMIT'); return r } catch (e) { db.exec('ROLLBACK'); throw e } }
  return {
    driver: 'sqlite', file, tx,
    user: {
      byId: (id) => user(S.byId.get(id)), byEmail: (e) => user(S.byEmail.get(e)), byName: (n) => user(S.byName.get(n)),
      create: (u) => S.create.run(u.id, u.email, u.username, u.salt, u.hash, u.rsalt, u.rhash, u.createdAt),
      setPassword: (id, salt, hash) => S.setPass.run(salt, hash, id), setRecovery: (id, salt, hash) => S.setRec.run(salt, hash, id),
      setState: (id, state, at, card) => S.setState.run(j(state), at, j(card), id),
      getState: (id) => { const r = S.byId.get(id); return r && { state: unj(r.state), updatedAt: r.updated_at } },
      remove: (id) => S.del.run(id),
      all: () => S.all.all().map((r) => ({ id: r.id, username: r.username, createdAt: r.created_at, card: unj(r.card) ?? {} })),
      count: () => S.count.get().n,
    },
    session: {
      create: (hash, uid, exp, ua) => S.sNew.run(hash, uid, exp, Date.now(), ua ?? ''), get: (h) => S.sGet.get(h) ?? null,
      touch: (h, exp) => S.sTouch.run(exp, h), remove: (h) => S.sDel.run(h), removeOthers: (uid, keep) => S.sOthers.run(uid, keep), removeAll: (uid) => S.sAll.run(uid),
      list: (uid) => S.sList.all(uid, Date.now()).map((r) => ({ hash: r.hash, createdAt: r.created_at, exp: r.exp, ua: r.ua })), purge: () => S.sPurge.run(Date.now()),
    },
    link: {
      get: (a, b) => S.lGet.get(a, b, b, a) ?? null, create: (from, to) => S.lNew.run(from, to, 'pending', Date.now()),
      accept: (from, to) => S.lAcc.run(from, to), remove: (a, b) => S.lDel.run(a, b, b, a), of: (uid) => S.lOf.all(uid, uid),
    },
    block: {
      has: (a, b) => !!S.bHas.get(a, b, b, a), add: (by, target) => S.bNew.run(by, target, Date.now()), remove: (by, target) => S.bDel.run(by, target),
      list: (by) => S.bList.all(by).map((r) => r.target), of: (uid) => new Set(S.bOf.all(uid, uid).map((r) => (r.by === uid ? r.target : r.by))),
    },
    backup(to) { db.exec(`VACUUM INTO '${to.replace(/'/g, "''")}'`) },
    close() { try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)') } catch {} db.close() },
  }
}

// ---------------- JSON (запасной) ----------------
function jsonStore(dir) {
  const file = path.join(dir, 'db.json'), bak = file + '.bak'
  const empty = () => ({ users: {}, sessions: {}, links: [], blocks: [] })
  const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
  let d = empty()
  if (fs.existsSync(file)) {
    try { d = { ...empty(), ...read(file) } } catch (e) {
      console.warn('! db.json повреждён, пробуем резервную копию:', e.message)
      d = { ...empty(), ...read(bak) } // если и она битая — падаем, но ничего не затираем
    }
  }
  let timer = null
  const flush = () => {
    clearTimeout(timer); timer = null
    const tmp = file + '.tmp', fd = fs.openSync(tmp, 'w', 0o600)
    try { fs.writeSync(fd, JSON.stringify(d)); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
    if (fs.existsSync(file)) fs.copyFileSync(file, bak)
    fs.renameSync(tmp, file)
  }
  const save = () => { timer ??= setTimeout(flush, 200) }
  const byField = (f, v) => Object.values(d.users).find((u) => u[f] === v) ?? null
  const rm = (id) => { delete d.users[id]; d.links = d.links.filter((l) => l.a !== id && l.b !== id); d.blocks = d.blocks.filter((b) => b.by !== id && b.target !== id); for (const [h, s] of Object.entries(d.sessions)) if (s.uid === id) delete d.sessions[h] }
  const pair = (l, a, b) => (l.a === a && l.b === b) || (l.a === b && l.b === a)
  return {
    driver: 'json', file, tx: (fn) => fn(),
    user: {
      byId: (id) => d.users[id] ?? null, byEmail: (e) => byField('email', e), byName: (n) => byField('username', n),
      create: (u) => { if (byField('email', u.email) || byField('username', u.username)) throw new Error('UNIQUE'); d.users[u.id] = { ...u, updatedAt: 0, state: null, card: null }; save() },
      setPassword: (id, salt, hash) => { Object.assign(d.users[id], { salt, hash }); save() }, setRecovery: (id, rsalt, rhash) => { Object.assign(d.users[id], { rsalt, rhash }); save() },
      setState: (id, state, at, card) => { Object.assign(d.users[id], { state, updatedAt: at, card }); save() },
      getState: (id) => d.users[id] && { state: d.users[id].state, updatedAt: d.users[id].updatedAt },
      remove: (id) => { rm(id); save() },
      all: () => Object.values(d.users).map((u) => ({ id: u.id, username: u.username, createdAt: u.createdAt, card: u.card ?? {} })),
      count: () => Object.keys(d.users).length,
    },
    session: {
      create: (hash, uid, exp, ua) => { d.sessions[hash] = { hash, uid, exp, createdAt: Date.now(), ua: ua ?? '' }; save() }, get: (h) => d.sessions[h] ?? null,
      touch: (h, exp) => { d.sessions[h].exp = exp; save() }, remove: (h) => { delete d.sessions[h]; save() },
      removeOthers: (uid, keep) => { for (const [h, s] of Object.entries(d.sessions)) if (s.uid === uid && h !== keep) delete d.sessions[h]; save() },
      removeAll: (uid) => { for (const [h, s] of Object.entries(d.sessions)) if (s.uid === uid) delete d.sessions[h]; save() },
      list: (uid) => Object.values(d.sessions).filter((s) => s.uid === uid && s.exp > Date.now()).sort((a, b) => b.createdAt - a.createdAt),
      purge: () => { for (const [h, s] of Object.entries(d.sessions)) if (s.exp < Date.now()) delete d.sessions[h]; save() },
    },
    link: {
      get: (a, b) => d.links.find((l) => pair(l, a, b)) ?? null,
      create: (from, to) => { d.links.push({ a: from, b: to, status: 'pending', at: Date.now() }); save() },
      accept: (from, to) => { const l = d.links.find((x) => x.a === from && x.b === to); if (l) l.status = 'accepted'; save() },
      remove: (a, b) => { d.links = d.links.filter((l) => !pair(l, a, b)); save() }, of: (uid) => d.links.filter((l) => l.a === uid || l.b === uid),
    },
    block: {
      has: (a, b) => d.blocks.some((x) => (x.by === a && x.target === b) || (x.by === b && x.target === a)),
      add: (by, target) => { if (!d.blocks.some((x) => x.by === by && x.target === target)) d.blocks.push({ by, target, at: Date.now() }); save() },
      remove: (by, target) => { d.blocks = d.blocks.filter((x) => !(x.by === by && x.target === target)); save() },
      list: (by) => d.blocks.filter((x) => x.by === by).map((x) => x.target),
      of: (uid) => new Set(d.blocks.filter((x) => x.by === uid || x.target === uid).map((x) => (x.by === uid ? x.target : x.by))),
    },
    backup(to) { flush(); fs.copyFileSync(file, to) },
    close() { flush() },
  }
}
