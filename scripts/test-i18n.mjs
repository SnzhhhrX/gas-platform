// Проверка переводов новых экранов: каждая строка диагностики, навыков, повторения, разбора ошибок и двух новых уроков
// должна переводиться на английский, а строки с числами — подходить под шаблоны. Входит в `npm test`.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC = path.resolve('src')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-i18n-'))
fs.mkdirSync(path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'lib'))
fs.mkdirSync(path.join(tmp, 'node_modules/react'), { recursive: true })
fs.writeFileSync(path.join(tmp, 'node_modules/react/package.json'), '{"name":"react","type":"module","main":"index.js"}')
fs.writeFileSync(path.join(tmp, 'node_modules/react/index.js'), 'export const useSyncExternalStore = () => null')
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}')
const fix = (c) => c.replace(/from '(\.{1,2}\/[\w\-/]+)'/g, "from '$1.mjs'").replace(/import\.meta\.env\.VITE_API_URL \?\? ''/, "''")
for (const d of ['data', 'lib']) for (const f of fs.readdirSync(path.join(SRC, d))) {
  const p = path.join(SRC, d, f)
  if (f.endsWith('.js')) fs.writeFileSync(path.join(tmp, d, f.replace(/\.js$/, '.mjs')), fix(fs.readFileSync(p, 'utf8')))
  else if (f.endsWith('.json')) fs.copyFileSync(p, path.join(tmp, d, f))
}
const mem = new Map()
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) })
globalThis.MutationObserver = class { observe() {} disconnect() {} }
globalThis.document = { addEventListener() {}, documentElement: {}, querySelector: () => null, body: {} }
const load = (d, f) => import(pathToFileURL(path.join(tmp, d, `${f}.mjs`)).href)
const I = await load('lib', 'i18n'); I.setLang('en')
const D = await load('lib', 'diagnosis'); const PL = await load('lib', 'plan'); const PR = await load('data', 'program'); const LL = await load('data', 'learn-lessons')

let fails = 0
const ok = (c, m) => { if (!c) { fails++; console.log('  ✗', m) } else console.log('  ✓', m) }
const cyr = /[А-Яа-яЁё]/
const untranslated = (list) => [...new Set(list)].filter((s) => typeof s === 'string' && cyr.test(s) && I.translateText(s) === s)

// 1. подписи и уровни
const labels = [...Object.values(D.STATUS_LABEL), ...Object.values(PL.LEVEL_META).flatMap((m) => [m.title, m.desc])]
ok(untranslated(labels).length === 0, `статусы навыков и уровни переведены ${untranslated(labels).join(' | ')}`)

// 2. причины и подсказки плана для всех состояний
const states = [
  { status: 'strong', n: 3, right: 3, idk: 0 }, { status: 'base', n: 3, right: 2, idk: 0, solidCore: true }, { status: 'base', n: 3, right: 2, idk: 0, solidCore: false },
  { status: 'weak', n: 3, right: 1, idk: 0 }, { status: 'weak', n: 3, right: 1, idk: 2 }, { status: 'gap', n: 3, right: 0, idk: 0 }, { status: 'gap', n: 3, right: 0, idk: 3 },
  { status: 'partial', n: 2, right: 2, idk: 0 }, { status: 'nodata', n: 0, right: 0, idk: 0 },
]
const reasons = states.map(D.reasonFor)
ok(untranslated(reasons).length === 0, `причины по теме переводятся (${reasons.length} вариантов) ${untranslated(reasons).join(' | ')}`)
ok(untranslated(reasons).length === 0 && reasons.every((r) => !cyr.test(I.translateText(r))), 'в переведённых причинах нет русских слов')
const survey = { goal: 'school', minutes: 20, interests: [], self: 2 }
const mk = (ans) => PL.makePlan(survey, ans)
const all = Object.values(mk([]).plan.why).flat().concat(Object.values(mk([{ skill: 'globe', level: 'd2', ok: false, idk: true }]).plan.why).flat(), [mk([]).plan.daily.tip, mk([{ skill: 'globe', level: 'd2', ok: false }]).plan.daily.tip])
ok(untranslated(all.filter((s) => !/Важно для цели|^Доступно/.test(s))).length === 0, `подсказки и причины маршрута ${untranslated(all.filter((s) => !/Важно для цели|^Доступно/.test(s))).slice(0, 3).join(' | ')}`)

// 3. повторение и сообщения
const rl = PR.srsLesson({ srs: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [`k${i}`, { b: 0, d: '2000-01-01', n: 1, m: 1, s: 'globe' }])) })
ok(rl === null || untranslated([rl.text, rl.title]).length === 0, 'тексты повторения переводятся')
const ui = ['Исправить ошибки (2)', 'Разбор ошибок (3)', 'Исправлено ошибок: 1 из 2', 'Исправляем ошибки · 1/2', 'Ваш ответ: 17:00', 'Верно: 12:00', '7 вопр. пора повторить', 'Нужно ещё ответов в уроках: 13', 'уроки: закреплено 3 из 7', 'Программа обновлена: изменилось тем — 4', 'Объяснение · 2/5', 'Конспект · 1/7', '182 уроков · 17 нед. по 10 мин в день', 'Серия 3 дн. засчитана. Можно продолжить или отдохнуть.']
ok(untranslated(ui).length === 0, `строки с числами подходят под шаблоны ${untranslated(ui).join(' | ')}`)

// 4. новые уроки
const lessonStrings = []
for (const l of LL.NEW_LESSONS.filter((x) => x.cards)) {
  lessonStrings.push(l.title, l.text, l.goal)
  for (const c of l.cards) { lessonStrings.push(c.h, c.p, c.key); if (c.example) lessonStrings.push(c.example.task, ...c.example.steps, c.example.answer) }
  for (const q of l.questions) lessonStrings.push(q.q, ...(q.options ?? []), q.why, ...Object.values(q.miss ?? {}), ...(q.answers ?? []))
}
const missing = untranslated(lessonStrings.filter(Boolean))
ok(missing.length === 0, `уроки с объяснением переведены на английский (${missing.length} без перевода) ${missing.slice(0, 2).join(' | ')}`)

// 5. казахский для интерфейса
I.setLang('kk')
const kkMissing = [...labels, ...reasons, 'Диагностика заново', 'Мои навыки', 'Обновить программу', 'Разберём пример', 'Цель урока'].filter((s) => cyr.test(s) && I.translateText(s) === s)
ok(kkMissing.length === 0, `интерфейс новых экранов переведён на казахский ${kkMissing.slice(0, 2).join(' | ')}`)
console.log(fails ? `\n${fails} ошибок` : '\nПереводы: все проверки пройдены'); process.exit(fails ? 1 : 0)
