// Проверка уроков с объяснением и разбором ошибок: структура, арифметика примеров и то, что разбор неверных вариантов
// действительно объясняет, как получился именно этот вариант. Входит в `npm test`.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const mem = new Map()
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
const SRC = path.resolve('src')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-les-'))
fs.mkdirSync(path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'lib'))
const fix = (code) => code.replace(/from '(\.{1,2}\/[\w\-/]+)'/g, "from '$1.mjs'")
for (const [dir, files] of [['data', fs.readdirSync(path.join(SRC, 'data'))], ['lib', ['vary.js', 'seen.js', 'srs.js', 'dates.js']]]) {
  for (const f of files) if (f.endsWith('.js')) fs.writeFileSync(path.join(tmp, dir, f.replace(/\.js$/, '.mjs')), fix(fs.readFileSync(path.join(SRC, dir, f), 'utf8')))
}
const load = (d, f) => import(pathToFileURL(path.join(tmp, d, `${f}.mjs`)).href)
const { NEW_LESSONS } = await load('data', 'learn-lessons')
const P = await load('data', 'program')

let fails = 0
const ok = (c, m) => { if (!c) { fails++; console.log('  ✗', m) } else console.log('  ✓', m) }
const lesson = (id) => NEW_LESSONS.find((l) => l.id === id)
const qOf = (l, start) => l.questions.find((q) => q.q.startsWith(start))

// независимый расчёт
const hh = (n) => String(((n % 24) + 24) % 24).padStart(2, '0') + ':00'
const at = (h, from, to) => h + (to - from) // местное время в пункте с UTC+to, если в пункте с UTC+from сейчас h
const km = (cm) => cm / 100000

console.log('структура уроков с объяснением')
const pilots = NEW_LESSONS.filter((l) => l.cards)
ok(pilots.length >= 2, `уроков с объяснением: ${pilots.length}`)
for (const l of pilots) {
  ok(typeof l.goal === 'string' && l.goal.startsWith('После урока вы сможете'), `${l.id}: есть цель урока`)
  ok(l.cards.every((c) => c.h && c.p), `${l.id}: у каждой карточки заголовок и текст`)
  const ex = l.cards.filter((c) => c.example)
  ok(ex.length >= 2 && ex.every((c) => c.example.task && c.example.steps.length >= 2 && c.example.answer), `${l.id}: не меньше двух разобранных примеров с шагами и ответом`)
  const tasks = new Set(ex.map((c) => c.example.task))
  ok(l.questions.every((q) => !tasks.has(q.q)), `${l.id}: примеры не совпадают с проверочными вопросами`)
}

console.log('примеры: арифметика')
const g4 = lesson('globe-4'), c2 = lesson('cart-2')
const exOf = (l, start) => l.cards.map((c) => c.example).find((e) => e?.task.startsWith(start))
ok(exOf(g4, 'В Лондоне (зимой, UTC+0) 18:00').answer === hh(at(18, 0, 4)), 'Лондон 18:00 → Дубай (UTC+4): ' + hh(at(18, 0, 4)))
ok(at(22, 0, 9) === 31 && exOf(g4, 'В Лондоне (зимой) 22:00').answer.startsWith(hh(at(22, 0, 9))) && /следующего дня/.test(exOf(g4, 'В Лондоне (зимой) 22:00').answer), 'Лондон 22:00 → Токио (UTC+9): 07:00 следующего дня')
ok(exOf(g4, 'Рейс вылетает').answer.startsWith(hh(at(10, 0, -5) + 8)), 'Рейс Лондон 10:00 + 8 ч → Нью-Йорк: ' + hh(at(10, 0, -5) + 8))
ok(exOf(c2, 'Масштаб 1 : 50 000').answer === `${km(4 * 50000)} км`, 'масштаб 1 : 50 000, 4 см → ' + km(4 * 50000) + ' км')
ok(exOf(c2, 'Расстояние 12 км').answer === `${(12 * 100000) / 300000} см`, '12 км при 1 : 300 000 → ' + (12 * 100000) / 300000 + ' см')

console.log('вопросы: верные ответы пересчитаны')
ok(qOf(g4, 'В Лондоне (UTC+0) 10:00').options[0] === hh(at(10, 0, 3)), 'Лондон 10:00 → Москва ' + hh(at(10, 0, 3)))
ok(qOf(g4, 'В Москве 20:00').options[0] === hh(at(20, 3, -5)), 'Москва 20:00 → Нью-Йорк ' + hh(at(20, 3, -5)))
ok(qOf(g4, 'Самолёт').options[0] === 'В 00:00 следующего дня' && at(9, 3, 9) + 9 === 24, 'самолёт Москва → Токио: прилёт в 00:00 следующего дня')
ok(qOf(g4, 'Разница долгот').options[0] === `${45 / 15} часа`, '45° : 15° = 3 часа')
ok(qOf(c2, 'Масштаб 1 : 200 000').options[0] === `${km(3 * 200000)} км`, '1 : 200 000, 3 см → 6 км')
ok(qOf(c2, 'Расстояние между городами').options[0] === `${(75 * 100000) / 1500000} см`, '75 км при 1 : 1 500 000 → 5 см')
ok(qOf(c2, 'Именованный').options[0] === `1 : ${5 * 100000}`.replace(/(\d)(?=(\d{3})+$)/g, '$1 '), '1 см — 5 км ↔ 1 : 500 000')

console.log('разбор ошибок: неверные варианты получаются из названной ошибки')
const wrongVal = (l, start, text) => ({ q: qOf(l, start), text })
const cases = [
  [g4, 'В Лондоне (UTC+0) 10:00', '07:00', hh(10 - 3), 'вычли вместо сложения'],
  [g4, 'В Лондоне (UTC+0) 10:00', '10:00', hh(10), 'время не меняли'],
  [g4, 'В Москве 20:00', '01:00', hh(20 + 5), 'прибавили 5 (смещение Нью-Йорка)'],
  [g4, 'В Москве 20:00', '17:00', hh(20 - 3), 'перевели только в UTC'],
  [g4, 'Самолёт', 'В 18:00', hh(9 + 9), 'прибавили полёт к московскому времени'],
  [g4, 'Самолёт', 'В 21:00', hh(15 + 6), 'к токийскому времени прибавили 6, а не 9'],
  [g4, 'Разница долгот', '45 минут', '45 минут', '1° принят за минуту'],
  [c2, 'Масштаб 1 : 200 000', '60 км', `${600000 / 10000} км`, 'отброшено четыре нуля'],
  [c2, 'Расстояние между городами', '50 см', `${(75 * 1000000) / 1500000} см`, 'лишний нуль'],
  [c2, 'Расстояние между городами', '0,5 см', `${String((75 * 10000) / 1500000).replace('.', ',')} см`, 'потерян нуль'],
  [c2, 'Именованный', '1 : 5 000', '1 : 5 000', 'метры вместо сантиметров'],
]
for (const [l, start, opt, computed, what] of cases) {
  const q = qOf(l, start)
  ok(q.options.includes(opt) && opt.replace(/^В /, '') === computed && !!q.miss?.[opt], `«${opt}» — ${what}: расчёт совпадает, разбор написан`)
}
ok(qOf(g4, 'В Москве 20:00').miss['17:00'].includes('17 − 5 = 12'), 'в разборе 17:00 показан путь к верному ответу')

console.log('формат разбора')
const withMiss = NEW_LESSONS.flatMap((l) => l.questions.filter((q) => q.miss).map((q) => ({ l, q })))
ok(withMiss.length >= 8, `вопросов с разбором ошибок: ${withMiss.length}`)
ok(withMiss.every(({ q }) => Object.keys(q.miss).every((k) => q.options.includes(k) && k !== q.options[q.answer])), 'разбор относится только к неверным вариантам этого вопроса')
ok([g4, c2].every((l) => l.questions.filter((q) => q.type !== 'tf' && q.type !== 'input').every((q) => Object.keys(q.miss ?? {}).length === q.options.length - 1)), 'у выбранных уроков разбор есть для каждого неверного варианта')
ok(withMiss.every(({ q }) => Object.values(q.miss).every((m) => m.length > 30)), 'разбор содержательный, не отписка')

console.log('в программе')
const pl = P.lessonById('globe-4')
ok(pl.goal && pl.cards.length === 5 && pl.questions.length >= 6, 'урок доходит до программы с целью и карточками')
ok(pl.questions.some((q) => q.miss), 'разбор ошибок сохраняется при сборке вопросов')
console.log(fails ? `\n${fails} ошибок` : '\nУроки: все проверки пройдены'); process.exit(fails ? 1 : 0)
