import { useEffect, useRef, useState } from 'react'
import { api, setToken, viaServer } from './api'
import { moduleOfNode, skillOfNode } from '../data/program'
import { qKey, record as srsRecord } from './srs'
import { today } from './dates'

const SCHEMA_VERSION = 4
const read = (k, d) => {
  try {
    const raw = localStorage.getItem(k)
    if (raw == null) return d
    return JSON.parse(raw) ?? d
  } catch {
    return d
  }
}
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
    return true
  } catch {
    return false
  }
}
const key = (id) => `gas-state-${id}`
const tsKey = (id) => `gas-ts-${id}`

export const initial = {
  _v: SCHEMA_VERSION,
  profile: {
    name: '',
    avatar: 'letter',
    color: null,
    frame: '',
    bio: '',
    country: '',
    favorite: '',
    wish: '',
    school: '',
    grade: '',
    goal: 30,
    theme: 'auto',
    sound: true,
    hidden: false,
  },
  joined: null,
  xp: 0,
  streak: 0,
  lastDay: null,
  pro: false,
  unlocked: {},
  completed: {},
  mistakes: [],
  activity: {},
  seen: [],
  placement: null,
  acc: {},
  srs: {},
  records: { blitz: 0, games: 0 },
  hearts: { n: 5, day: null },
  stats: { answered: 0, correct: 0 },
  bestStreak: 0,
  proPlan: null,
}

/** Migrate any saved blob to current schema. Never throws. */
export const normalize = (raw = {}) => {
  try {
    const s = typeof raw === 'object' && raw ? raw : {}
    // Drop obsolete map-pin mistakes (old format)
    const mistakes = (Array.isArray(s.mistakes) ? s.mistakes : [])
      .filter((m) => m && typeof m === 'object' && (m.type !== 'map' || /^\d{3}$/.test(String(m.answer ?? ''))))
      .slice(0, 40)

    const profile = {
      ...initial.profile,
      ...(s.profile && typeof s.profile === 'object' ? s.profile : {}),
    }
    // Clamp goal
    if (![10, 20, 30, 50].includes(profile.goal)) profile.goal = 30
    if (!['auto', 'light', 'dark'].includes(profile.theme)) profile.theme = 'auto'

    const records = {
      blitz: Math.max(0, Number(s.records?.blitz) || 0),
      games: Math.max(0, Number(s.records?.games) || 0),
    }

    const hearts = {
      n: Math.min(5, Math.max(0, Number(s.hearts?.n) ?? 5)),
      day: typeof s.hearts?.day === 'string' ? s.hearts.day : null,
    }

    // Placement must be object or null
    let placement = s.placement
    if (placement != null && typeof placement !== 'object') placement = null

    return {
      ...initial,
      ...s,
      _v: SCHEMA_VERSION,
      mistakes,
      profile,
      records,
      hearts,
      placement,
      completed: s.completed && typeof s.completed === 'object' ? s.completed : {},
      activity: s.activity && typeof s.activity === 'object' ? s.activity : {},
      seen: Array.isArray(s.seen) ? s.seen : [],
      acc: s.acc && typeof s.acc === 'object' ? s.acc : {},
      srs: s.srs && typeof s.srs === 'object' && !Array.isArray(s.srs) ? s.srs : {},
      stats: {
        answered: Math.max(0, Number(s.stats?.answered) || 0),
        correct: Math.max(0, Number(s.stats?.correct) || 0),
      },
      xp: Math.max(0, Number(s.xp) || 0),
      streak: Math.max(0, Number(s.streak) || 0),
      bestStreak: Math.max(0, Number(s.bestStreak) || 0),
      pro: !!s.pro,
      proPlan: s.pro ? (s.proPlan ?? null) : null,
      unlocked: s.unlocked && typeof s.unlocked === 'object' ? s.unlocked : {},
    }
  } catch {
    return { ...initial }
  }
}

export const loadState = (id) => normalize(read(key(id), {}))
export const saveState = (id, s) => write(key(id), s)
export const dropState = (id) => {
  try {
    localStorage.removeItem(key(id))
    localStorage.removeItem(tsKey(id))
  } catch {}
}

export const newState = (profile) => ({
  ...initial,
  joined: today(),
  profile: { ...initial.profile, ...profile },
})

export { today }

const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
export const lastDays = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return { date: today(d), label: WD[d.getDay()] }
  })

export const level = (xp) => Math.floor(Math.max(0, xp) / 100) + 1
export const levelProgress = (xp) => Math.max(0, xp) % 100
export const levelTitle = (xp) =>
  ['Новичок', 'Путешественник', 'Навигатор', 'Картограф', 'Географ'][Math.min(4, level(xp) - 1)]

export const MAX_HEARTS = 5
export const HEART_COST = 0.5
export const heartsOf = (s) =>
  s.pro ? Infinity : s.hearts?.day === today() ? s.hearts.n : MAX_HEARTS
export const formatHearts = (n) =>
  n === Infinity ? '∞' : Number.isInteger(n) ? String(n) : n.toFixed(1)

export const XP_PER_ANSWER = 10
export const xpFor = (score, total) => score * XP_PER_ANSWER + (score === total ? 20 : 0)
export const isRepeat = (s, lesson) =>
  !!s.completed?.[lesson.id] && !lesson.review && !lesson.practice
export const gainXp = (s, lesson, score) => {
  const base = xpFor(score, lesson.questions?.length ?? 0)
  return isRepeat(s, lesson) ? Math.floor(base / 2) : base
}

export function useStore(id) {
  const [state, setState] = useState(() => loadState(id))
  const [ready, setReady] = useState(!viaServer())
  const stamp = useRef(Number(localStorage.getItem(tsKey(id))) || 0)
  const skip = useRef(true)
  const timer = useRef(0)
  const pending = useRef(false)
  const latest = useRef(state)
  latest.current = state
  const [sync, setSync] = useState({ at: null, error: false })

  const adopt = (server, at) => {
    skip.current = true
    stamp.current = at
    try { localStorage.setItem(tsKey(id), String(at)) } catch {}
    setState(
      normalize({
        ...server,
        joined: server.joined ?? latest.current.joined,
      })
    )
  }

  const push = (keepalive) => {
    clearTimeout(timer.current)
    pending.current = false
    return api('/state', {
      method: 'PUT',
      body: { state: latest.current, updatedAt: stamp.current },
      keepalive,
    })
      .then(() => setSync({ at: Date.now(), error: false }))
      .catch((e) => {
        if (e.status === 409 && e.data?.state) {
          adopt(e.data.state, e.data.updatedAt)
        } else {
          setSync((x) => ({ ...x, error: true }))
        }
      })
  }

  // Local persist immediately; server debounce
  useEffect(() => {
    saveState(id, state)
    if (skip.current) {
      skip.current = false
      return
    }
    stamp.current = Date.now()
    try { localStorage.setItem(tsKey(id), String(stamp.current)) } catch {}
    if (viaServer()) {
      pending.current = true
      clearTimeout(timer.current)
      timer.current = setTimeout(() => push(), 700)
    }
  }, [id, state])

  useEffect(() => {
    const flush = () => {
      if (pending.current) push(true)
    }
    addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
    return () => {
      removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [])

  // Initial server sync
  useEffect(() => {
    if (!viaServer()) return
    let alive = true
    api('/me')
      .then((r) => {
        if (!alive) return
        const at = r.updatedAt ?? 0
        if (r.state && at > stamp.current) {
          adopt(
            {
              ...r.state,
              joined: r.state.joined ?? new Date(r.createdAt).toISOString().slice(0, 10),
            },
            at
          )
          setSync({ at: Date.now(), error: false })
        } else {
          stamp.current ||= Date.now()
          push()
        }
      })
      .catch((e) => {
        if (e.status === 401) {
          setToken(null)
          try { localStorage.removeItem('gas-session') } catch {}
          location.reload()
        }
        // Offline / 5xx → stay on local, mark ready
      })
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [id])

  const finishLesson = (lesson, score, wrong) =>
    setState((s) => {
      const t = today()
      const y = today(new Date(Date.now() - 864e5))
      const streak = s.lastDay === t ? s.streak : s.lastDay === y ? s.streak + 1 : 1
      const gained = gainXp(s, lesson, score)
      const prev = s.completed[lesson.id]
      const asked = (lesson.questions || []).map((q) => q.q)
      const mid = moduleOfNode(lesson.id)
      // Интервальное повторение: каждый заданный вопрос (кроме заданий на карте) получает отметку верно/неверно
      const wrongKeys = new Set((Array.isArray(wrong) ? wrong : []).map(qKey))
      const sk = skillOfNode(lesson.id)
      const srs = srsRecord(
        s.srs,
        (lesson.questions || []).filter((q) => q.type !== 'map' && q.type !== 'mapid')
          .map((q) => ({ key: qKey(q), ok: !wrongKeys.has(qKey(q)), skill: sk ?? s.srs?.[qKey(q)]?.s ?? null })),
        t,
      )
      const acc = mid
        ? {
            ...s.acc,
            [mid]: {
              a: (s.acc?.[mid]?.a ?? 0) + (lesson.questions?.length ?? 0),
              c: (s.acc?.[mid]?.c ?? 0) + score,
            },
          }
        : s.acc
      return {
        ...s,
        acc,
        srs,
        streak,
        lastDay: t,
        xp: s.xp + gained,
        bestStreak: Math.max(s.bestStreak, streak),
        stats: {
          answered: s.stats.answered + (lesson.questions?.length ?? 0),
          correct: s.stats.correct + score,
        },
        activity: { ...s.activity, [t]: (s.activity[t] ?? 0) + gained },
        completed: lesson.srsReview ? s.completed : {
          ...s.completed,
          [lesson.id]: {
            score: Math.max(score, prev?.score ?? 0),
            total: lesson.questions?.length ?? 0,
            attempts: (prev?.attempts ?? 0) + 1,
            date: t,
          },
        },
        mistakes: [
          ...(Array.isArray(wrong) ? wrong : []).map((w) => ({ ...w, lesson: lesson.title })),
          ...s.mistakes.filter((m) => !asked.includes(m.q)),
        ].slice(0, 30),
      }
    })

  const finishBlitz = (score) =>
    setState((s) => {
      const t = today()
      const y = today(new Date(Date.now() - 864e5))
      const gained = score * 5
      const streak = s.lastDay === t ? s.streak : s.lastDay === y ? s.streak + 1 : 1
      return {
        ...s,
        streak,
        lastDay: t,
        xp: s.xp + gained,
        bestStreak: Math.max(s.bestStreak, streak),
        activity: { ...s.activity, [t]: (s.activity[t] ?? 0) + gained },
        records: {
          ...s.records,
          blitz: Math.max(s.records.blitz, score),
          games: s.records.games + 1,
        },
      }
    })

  const updateProfile = (patch) =>
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }))
  const markSeen = (ids) => setState((s) => ({ ...s, seen: [...s.seen, ...ids] }))
  const setPlacement = (placement) => setState((s) => ({ ...s, placement }))
  const loseHeart = () =>
    setState((s) =>
      s.pro
        ? s
        : {
            ...s,
            hearts: {
              n: Math.max(0, +(heartsOf(s) - HEART_COST).toFixed(1)),
              day: today(),
            },
          }
    )
  const unlockModule = (id) => setState((s) => ({ ...s, unlocked: { ...s.unlocked, [id]: true } }))
  const setPro = (pro, plan = null) =>
    setState((s) => ({ ...s, pro: !!pro, proPlan: pro ? plan : null }))
  const reset = () =>
    setState((s) => ({
      ...initial,
      profile: s.profile,
      pro: s.pro,
      proPlan: s.proPlan,
    }))

  return {
    unlockModule,
    state,
    ready,
    sync,
    finishLesson,
    finishBlitz,
    updateProfile,
    markSeen,
    setPlacement,
    loseHeart,
    setPro,
    reset,
  }
}


// Серия «жива», только если занимались сегодня или вчера; иначе она уже прервалась (в состоянии число обновится при следующем занятии)
export function liveStreak(s) {
  const [y, t] = lastDays(2).map((d) => d.date)
  return s.lastDay === t || s.lastDay === y ? s.streak : 0
}
