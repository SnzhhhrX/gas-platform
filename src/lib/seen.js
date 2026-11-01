// Память о недавно пройденных вопросах: помогает не показывать одно и то же слишком часто.
const KEY = 'gas-seen'
const MAX = 400
let seen = new Set()
try { seen = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { /* пусто */ }

export const isSeen = (q) => seen.has(q.q)
// Новые вопросы вперёд, уже виденные — в конец (порядок внутри групп сохраняется)
export const freshFirst = (qs) => [...qs.filter((q) => !isSeen(q)), ...qs.filter(isSeen)]
export const rememberSeen = (qs) => {
  const arr = [...seen]
  for (const q of qs) if (!seen.has(q.q)) arr.push(q.q)
  const tail = arr.slice(-MAX)
  seen = new Set(tail)
  try { localStorage.setItem(KEY, JSON.stringify(tail)) } catch { /* приватный режим */ }
}
