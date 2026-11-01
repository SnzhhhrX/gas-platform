// Аудит качества контента: npm run audit. Ничего не меняет, только считает.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { pathToFileURL } from 'node:url'
const SRC = path.resolve('src')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-audit-')); fs.mkdirSync(path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'lib'))
const fix = (c) => c.replace(/from '(\.{1,2}\/[\w\-/]+)'/g, "from '$1.mjs'")
for (const [d, fl] of [['data', fs.readdirSync(path.join(SRC, 'data'))], ['lib', ['vary.js', 'seen.js']]]) for (const f of fl) if (f.endsWith('.js')) fs.writeFileSync(path.join(tmp, d, f.replace(/\.js$/, '.mjs')), fix(fs.readFileSync(path.join(SRC, d, f), 'utf8')))
const load = (f) => import(pathToFileURL(path.join(tmp, 'data', `${f}.mjs`)).href)
const { topics, olympiadLessons } = await load('courses'), { READS } = await load('learn-reads'), { NEW_LESSONS } = await load('learn-lessons')
const items = []
for (const t of topics) for (const l of t.lessons) l.questions.forEach((q) => items.push({ src: t.id, l: l.id, q }))
for (const l of olympiadLessons) l.questions.forEach((q) => items.push({ src: 'olympiad', l: l.id, q }))
for (const l of NEW_LESSONS ?? []) l.questions?.forEach((q) => items.push({ src: 'new', l: l.id, q }))
for (const [id, r] of Object.entries(READS)) r.questions?.forEach((q) => items.push({ src: 'read', l: id, q }))
const by = (f) => items.reduce((m, i) => { const k = f(i); m[k] = (m[k] || 0) + 1; return m }, {})
const top = (o, n = 12) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n)
const stem = (q) => String(q.q).toLowerCase().replace(/[«»"“”?]/g, '').split(/\s+/).slice(0, 3).join(' ')
const cat = (q) => {
  const s = String(q.q).toLowerCase()
  if (q.type === 'map' || q.type === 'mapid') return 'карта'
  if (q.type === 'input') return 'ввод'
  if (/сравн|больше|меньше|выше|ниже|самый|наибол|наимен/.test(s)) return 'сравнение'
  if (/почему|причин|из-за|благодаря|следств|приводит|как влияет/.test(s)) return 'причина-следствие'
  if (/график|диаграмм|таблиц|данн|процент|\d+\s?(мм|°|км|%|млн|тыс)/.test(s)) return 'данные/числа'
  if (/порядок|последовательн|расположите|в каком порядке/.test(s)) return 'последовательность'
  if (/столиц/.test(s)) return 'столица'
  if (/что такое|что называют|что означает|как называется|что изучает|что показывает/.test(s)) return 'определение'
  return 'прочее'
}
console.log(`Вопросов всего: ${items.length}`)
console.log('Типы:', JSON.stringify(by((i) => i.q.type || 'choice')))
console.log('Навык:', JSON.stringify(by((i) => cat(i.q))))
console.log('С картинкой:', items.filter((i) => i.q.img).length, '| картинки:', JSON.stringify(by((i) => i.q.img || '—')).slice(0, 400))
const whyLen = items.map((i) => String(i.q.why ?? '').length)
console.log('Пояснение: нет —', whyLen.filter((n) => !n).length, '| короче 50 симв. —', whyLen.filter((n) => n && n < 50).length, '| среднее —', Math.round(whyLen.reduce((a, b) => a + b, 0) / whyLen.length))
console.log('Частые начала формулировок:', JSON.stringify(top(by((i) => stem(i.q)), 10)))
const pos = by((i) => (Array.isArray(i.q.answer) || i.q.type === 'input' || i.q.type === 'map' ? 'x' : i.q.answer))
console.log('Позиция верного ответа (0,1,2,3):', JSON.stringify(pos))
const len = items.filter((i) => Array.isArray(i.q.options) && Number.isInteger(i.q.answer))
console.log('Верный ответ самый длинный (подсказка по длине):', Math.round(100 * len.filter((i) => i.q.options[i.q.answer].length === Math.max(...i.q.options.map((o) => o.length))).length / len.length) + '%')
