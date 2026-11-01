import { useEffect, useState } from 'react'
import { getToken, viaServer } from '../lib/api'
import { Icon } from './Icon'

const KEY_LS = 'gas-admin-key'

async function adminFetch(path, { method = 'GET', body, adminKey } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (adminKey) headers['X-Admin-Key'] = adminKey
  const base = import.meta.env.VITE_API_URL || ''
  const r = await fetch(`${base}/api/admin${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || `Ошибка ${r.status}`)
  return data
}

export default function Admin({ onClose, notify }) {
  const [key, setKey] = useState(() => localStorage.getItem(KEY_LS) || '')
  const [ok, setOk] = useState(false)
  const [tab, setTab] = useState('stats') // stats | users | prices
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [prices, setPrices] = useState({
    month: { rub: 1490, stars: 0 },
    year: { rub: 9990, stars: 0 },
  })

  const unlock = async () => {
    setErr('')
    setBusy(true)
    try {
      if (key) localStorage.setItem(KEY_LS, key)
      const me = await adminFetch('/me', { adminKey: key })
      if (!me.admin) throw new Error('Нет доступа. Проверьте ключ или ADMIN_USERS.')
      setOk(true)
      await refresh()
    } catch (e) {
      setErr(e.message)
      setOk(false)
    }
    setBusy(false)
  }

  const refresh = async () => {
    const s = await adminFetch('/stats', { adminKey: key })
    setStats(s)
    if (s.prices) {
      setPrices({
        month: { rub: s.prices.month.rub, stars: s.prices.month.stars },
        year: { rub: s.prices.year.rub, stars: s.prices.year.stars },
      })
    }
    const u = await adminFetch(`/users?q=${encodeURIComponent(q)}&limit=50`, { adminKey: key })
    setUsers(u.users || [])
  }

  useEffect(() => {
    if (!viaServer()) {
      setErr('Админка работает при запущенном сервере (npm run dev / npm start).')
      return
    }
    if (key || getToken()) unlock().catch(() => {})
  }, [])

  const togglePro = async (u) => {
    setBusy(true)
    try {
      await adminFetch('/pro', { method: 'POST', adminKey: key, body: { id: u.id, pro: !u.pro, plan: u.proPlan || 'month' } })
      notify?.(!u.pro ? `Pro выдан: @${u.username}` : `Pro снят: @${u.username}`, 'crown')
      await refresh()
    } catch (e) {
      notify?.(e.message, 'lock')
    }
    setBusy(false)
  }

  const savePrices = async () => {
    setBusy(true)
    try {
      await adminFetch('/prices', {
        method: 'PUT',
        adminKey: key,
        body: { month: prices.month, year: prices.year },
      })
      notify?.('Цены обновлены (₸)', 'check')
      await refresh()
    } catch (e) {
      notify?.(e.message, 'lock')
    }
    setBusy(false)
  }

  if (!ok) {
    return (
      <div className="app admin-page">
        <button type="button" className="icon admin-back" onClick={onClose} aria-label="Закрыть"><Icon name="x" size={20} /></button>
        <h1>Админка</h1>
        <p className="text">Ключ из <code>ADMIN_KEY</code> или логин из <code>ADMIN_USERS</code>.</p>
        <label className="admin-label">
          Admin key
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="секретный ключ" autoComplete="off" />
        </label>
        {err && <p className="error">{err}</p>}
        <button type="button" className="btn" disabled={busy} onClick={unlock}>{busy ? '…' : 'Войти'}</button>
      </div>
    )
  }

  return (
    <div className="app admin-page">
      <header className="admin-top">
        <button type="button" className="icon" onClick={onClose} aria-label="Закрыть"><Icon name="x" size={20} /></button>
        <h1>Админка</h1>
        <button type="button" className="chip" onClick={() => refresh()} disabled={busy}><Icon name="redo" size={14} /></button>
      </header>

      <div className="admin-tabs">
        {[['stats', 'Сводка'], ['users', 'Юзеры'], ['prices', 'Цены']].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="admin-stats">
          <div><b>{stats.users}</b><small>пользователей</small></div>
          <div><b>{stats.pro}</b><small>с Pro</small></div>
          <div><b>{stats.xpSum}</b><small>сумма XP</small></div>
          <div><b>{stats.driver}</b><small>хранилище</small></div>
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-users">
          <div className="admin-search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по логину" />
            <button type="button" className="btn ghost" onClick={refresh}>Найти</button>
          </div>
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                <div>
                  <b>@{u.username}</b>
                  <small>{u.name || '—'} · {u.xp} XP · streak {u.streak}</small>
                </div>
                <button type="button" className={`admin-pro ${u.pro ? 'on' : ''}`} disabled={busy} onClick={() => togglePro(u)}>
                  {u.pro ? 'Pro ✓' : 'Выдать Pro'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'prices' && (
        <div className="admin-prices">
          <p className="text">Цены в тенге (₸). Обновляются сразу для всех клиентов.</p>
          <h3>Месяц</h3>
          <div className="admin-row">
            <label>₸ <input type="number" value={prices.month.rub} onChange={(e) => setPrices((p) => ({ ...p, month: { ...p.month, rub: +e.target.value } }))} /></label>
            <label>⭐ <input type="number" value={prices.month.stars} onChange={(e) => setPrices((p) => ({ ...p, month: { ...p.month, stars: +e.target.value } }))} /></label>
          </div>
          <h3>Год</h3>
          <div className="admin-row">
            <label>₸ <input type="number" value={prices.year.rub} onChange={(e) => setPrices((p) => ({ ...p, year: { ...p.year, rub: +e.target.value } }))} /></label>
            <label>⭐ <input type="number" value={prices.year.stars} onChange={(e) => setPrices((p) => ({ ...p, year: { ...p.year, stars: +e.target.value } }))} /></label>
          </div>
          <button type="button" className="btn" disabled={busy} onClick={savePrices}>Сохранить цены</button>
          {stats?.prices && (
            <small className="note">Сейчас: {stats.prices.month.label} · {stats.prices.year.label} · {stats.prices.month.starsLabel} · {stats.prices.year.starsLabel}</small>
          )}
        </div>
      )}
    </div>
  )
}
