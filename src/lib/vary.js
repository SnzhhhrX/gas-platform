// Детерминированное перемешивание вариантов ответа.
// В исходных данных верный вариант часто стоит первым — здесь порядок расставляется «случайно», но одинаково при каждом запуске.
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const rng = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }

export function varyQuestion(q) {
  if (!q || q.type === 'tf' || q.type === 'multi' || q.type === 'input' || q.type === 'map') return q
  if (!Array.isArray(q.options) || q.options.length < 3 || !Number.isInteger(q.answer)) return q
  const r = rng(hash(`${q.q}|${q.options.join('|')}`))
  const idx = q.options.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
  return { ...q, options: idx.map((i) => q.options[i]), answer: idx.indexOf(q.answer) }
}
export const seeded = (key) => rng(hash(String(key)))
