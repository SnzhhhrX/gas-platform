// Интервальное повторение (система Лейтнера). Чистые функции без зависимостей: их можно проверять в Node.
// Для каждого вопроса хранится короткая запись: { b: ящик 0..5, d: когда повторить, n: ответов, m: ошибок, s: навык }.
// Верный ответ двигает вопрос в следующий ящик (интервал растёт), ошибка возвращает в нулевой и назначает повтор на завтра.
// Повторять «досрочно» бессмысленно: верный ответ до срока не продвигает ящик, поэтому зубрёжкой накрутить освоение нельзя.

export const INTERVALS = [1, 2, 4, 8, 16, 35] // дни до следующего повтора для ящиков 0..5
export const SOLID_BOX = 3 // с этого ящика вопрос считаем закреплённым (повтор через 8+ дней прошёл успешно)
export const MAX_ITEMS = 700 // потолок записей: состояние синхронизируется с сервером (лимит 250 КБ)

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

// Ключ вопроса: текст + цель (на карте один текст, а целей много)
export const qKey = (q) => hash(`${q?.q ?? ''}|${q?.target ?? ''}`)

const parse = (day) => { const [y, m, d] = day.split('-').map(Number); return Date.UTC(y, m - 1, d) }
const fmt = (ms) => new Date(ms).toISOString().slice(0, 10)
export const addDays = (day, n) => fmt(parse(day) + n * 864e5)
export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5)

/** Записывает результаты урока. results: [{ key, ok, skill }]. Возвращает новый объект srs. */
export function record(srs, results, day) {
  const out = { ...(srs && typeof srs === 'object' ? srs : {}) }
  const seen = new Set()
  for (const r of results) {
    if (!r?.key || seen.has(r.key)) continue
    seen.add(r.key)
    const e = out[r.key]
    if (!e) {
      out[r.key] = r.ok
        ? { b: 1, d: addDays(day, INTERVALS[1]), n: 1, m: 0, s: r.skill ?? null }
        : { b: 0, d: addDays(day, INTERVALS[0]), n: 1, m: 1, s: r.skill ?? null }
    } else if (!r.ok) {
      out[r.key] = { ...e, b: 0, d: addDays(day, INTERVALS[0]), n: e.n + 1, m: e.m + 1, s: e.s ?? r.skill ?? null }
    } else if (e.d <= day) {
      const b = Math.min(INTERVALS.length - 1, e.b + 1)
      out[r.key] = { ...e, b, d: addDays(day, INTERVALS[b]), n: e.n + 1, s: e.s ?? r.skill ?? null }
    } else {
      out[r.key] = { ...e, n: e.n + 1 } // досрочный верный ответ: срок не меняем
    }
  }
  const keys = Object.keys(out)
  if (keys.length > MAX_ITEMS) {
    // выбрасываем самые прочные и самые далёкие по сроку
    keys.sort((a, b) => out[b].b - out[a].b || (out[b].d < out[a].d ? -1 : 1))
    for (const k of keys.slice(0, keys.length - MAX_ITEMS)) delete out[k]
  }
  return out
}

/** Вопросы, срок повторения которых наступил: сначала самые просроченные и слабые. */
export function dueKeys(srs, day, limit = Infinity) {
  return Object.entries(srs ?? {})
    .filter(([, e]) => e && e.d <= day)
    .sort((a, b) => daysBetween(b[1].d, day) - daysBetween(a[1].d, day) || a[1].b - b[1].b)
    .slice(0, limit)
    .map(([k]) => k)
}
export const dueCount = (srs, day) => Object.values(srs ?? {}).filter((e) => e && e.d <= day).length

/** Состояние навыка по накопленным ответам. Если данных мало, об этом сказано прямо, процент не выдумывается. */
export const MIN_EVIDENCE = 6
export function skillHealth(srs, day) {
  const by = {}
  for (const e of Object.values(srs ?? {})) {
    if (!e?.s) continue
    const h = (by[e.s] ??= { items: 0, solid: 0, shaky: 0, repeated: 0, due: 0, answers: 0, misses: 0 })
    h.items++; h.answers += e.n; h.misses += e.m
    if (e.b >= SOLID_BOX) h.solid++
    if (e.b <= 1 && e.m > 0) h.shaky++
    if (e.m >= 2) h.repeated++
    if (e.d <= day) h.due++
  }
  for (const h of Object.values(by)) {
    h.status = h.items < MIN_EVIDENCE ? 'nodata'
      : h.misses / Math.max(1, h.answers) >= 0.35 || h.shaky / h.items >= 0.3 ? 'weak'
      : h.solid / h.items >= 0.5 ? 'solid' : 'learning'
  }
  return by
}

// Сколько всего ответов накоплено (для сравнения «было / стало»)
export const totalAnswers = (srs) => Object.values(srs ?? {}).reduce((n, e) => n + (e?.n ?? 0), 0)
