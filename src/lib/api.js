// Robust API client. Offline-first: if server unavailable, app runs fully on localStorage.
// Base URL: same origin by default (Vite proxies /api → :8787 in dev). Override with VITE_API_URL.

const BASE = import.meta.env.VITE_API_URL ?? ''
const TOKEN = 'gas-token'
const TIMEOUT_MS = 12000
const RETRIES = 1

let online = false

export const isOnline = () => online
export const getToken = () => {
  try { return localStorage.getItem(TOKEN) } catch { return null }
}
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN, t)
    else localStorage.removeItem(TOKEN)
  } catch { /* quota / private mode */ }
}
export const viaServer = () => online && !!getToken()

export async function detectBackend() {
  try {
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 2000)
    const r = await fetch(`${BASE}/api/health`, { signal: ctrl.signal })
    clearTimeout(tid)
    online = r.ok && (await r.json().catch(() => ({}))).ok === true
  } catch {
    online = false
  }
  return online
}

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(ms)
  }
  const c = new AbortController()
  setTimeout(() => c.abort(), ms)
  return c.signal
}

/**
 * Central fetch wrapper.
 * - Never throws raw network errors that crash UI
 * - Maps 401 → clear token (caller may reload)
 * - Supports keepalive for pagehide flush
 * - One automatic retry on network failure (not on 4xx/5xx)
 */
export async function api(path, { method = 'GET', body, keepalive, timeout = TIMEOUT_MS } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  }
  const opts = {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    keepalive: !!keepalive,
  }

  let lastErr
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE}/api${path}`, {
        ...opts,
        signal: keepalive ? undefined : timeoutSignal(timeout),
      })
      let data = {}
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        data = await res.json().catch(() => ({}))
      }
      if (!res.ok) {
        const err = Object.assign(new Error(data.error || `Ошибка сервера (${res.status})`), {
          status: res.status,
          data,
        })
        if (res.status === 401) {
          setToken(null)
          try { localStorage.removeItem('gas-session') } catch {}
        }
        throw err
      }
      return data
    } catch (e) {
      lastErr = e
      // Retry only pure network / timeout failures
      const isNet =
        e.name === 'AbortError' ||
        e.name === 'TypeError' ||
        e.status === 0 ||
        (e.message && /network|fetch|timeout|abort/i.test(e.message))
      if (!isNet || attempt === RETRIES) break
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
    }
  }

  if (lastErr?.status != null) throw lastErr
  throw Object.assign(new Error(lastErr?.message || 'Нет связи с сервером.'), {
    status: 0,
    offline: true,
  })
}

/** Safe helper: never throws, returns { ok, data, error } */
export async function apiSafe(path, opts) {
  try {
    const data = await api(path, opts)
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: e, status: e.status ?? 0 }
  }
}
