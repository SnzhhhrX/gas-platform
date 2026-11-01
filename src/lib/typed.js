export const normAnswer = (s) => String(s ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
export function checkTyped(q, typed) {
  const t = normAnswer(typed)
  if (!t) return false
  return (q.answers ?? []).some((a) => {
    const n = normAnswer(a)
    if (n === t) return true
    if (n.length < 6) return false // короткие слова только точно
    // допускаем одну опечатку в длинных словах
    if (Math.abs(n.length - t.length) > 1) return false
    let i = 0, j = 0, d = 0
    while (i < n.length && j < t.length) { if (n[i] === t[j]) { i++; j++ } else { if (++d > 1) return false; if (n.length > t.length) i++; else if (n.length < t.length) j++; else { i++; j++ } } }
    return d + (n.length - i) + (t.length - j) <= 1
  })
}
