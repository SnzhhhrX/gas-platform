// Проверка программы на реальных данных: повторение, адаптация режима, чтение сохранённого плана.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const store = new Map()
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }

const SRC = path.resolve('src')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-prog-'))
fs.mkdirSync(path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'lib'))
const fix = (code) => code.replace(/from '(\.{1,2}\/[\w\-/]+)'/g, "from '$1.mjs'")
for (const [dir, files] of [['data', fs.readdirSync(path.join(SRC, 'data'))], ['lib', ['vary.js', 'seen.js', 'srs.js', 'dates.js']]]) {
  for (const f of files) if (f.endsWith('.js')) fs.writeFileSync(path.join(tmp, dir, f.replace(/\.js$/, '.mjs')), fix(fs.readFileSync(path.join(SRC, dir, f), 'utf8')))
}
const load = (d, f) => import(pathToFileURL(path.join(tmp, d, `${f}.mjs`)).href)
const P = await load('data', 'program')
const S = await load('lib', 'srs')
const { today } = await load('lib', 'dates')

let fails = 0
const ok = (c, m) => { if (!c) { fails++; console.log('  ✗', m) } else console.log('  ✓', m) }
const day = today()

// 1. сохранённый план версии 4 больше не отбрасывается
const plan = { v: 4, goal: 'travel', order: ['world', 'regions', ...P.NATURAL_ORDER.filter((x) => x !== 'world' && x !== 'regions')], modes: { globe: 'fast' }, why: {}, mastery: {} }
ok(P.planOf({ placement: { plan } }) === plan, 'план v4 применяется')
ok(P.buildProgram({ placement: { plan }, completed: {} }).modules[0].id === 'world', 'порядок модулей берётся из плана')
ok(P.planOf({ placement: { plan: { v: 4 } } }) === P.DEFAULT_PLAN, 'повреждённый план → план по умолчанию')
ok(P.planOf({}) === P.DEFAULT_PLAN, 'нет плана → план по умолчанию')

// 2. повторение собирается из реальных вопросов
const lesson = P.lessonById('globe-2')
const qs = lesson.questions.filter((q) => q.type !== 'map')
let srs = S.record({}, qs.map((q) => ({ key: S.qKey(q), ok: false, skill: 'globe' })), S.addDays(day, -3))
const rl = P.srsLesson({ srs })
ok(rl && rl.questions.length === Math.min(8, qs.length) && rl.srsReview, 'урок повторения собран из просроченных вопросов')
ok(rl.questions.every((q) => qs.some((x) => x.q === q.q)), 'вопросы повторения совпадают с исходными')
ok(P.srsLesson({ srs: {} }) === null && P.reviewDue({ srs: {} }) === 0, 'нечего повторять → null')
ok(P.reviewDue({ srs: { zzz: { b: 0, d: S.addDays(day, -1), n: 1, m: 1, s: 'globe' } } }) === 0, 'запись без вопроса в базе не считается')

// 2б. вопросы конспектов тоже возвращаются на повторение, и верный ответ не всегда первый
const readQs = Object.values((await load('data', 'learn-reads')).READS ?? {}).flatMap((r) => r.questions).filter((q) => q.type !== 'map')
const rsrs = S.record({}, readQs.slice(0, 30).map((q) => ({ key: S.qKey(q), ok: false, skill: 'globe' })), S.addDays(day, -2))
const rr = P.srsLesson({ srs: rsrs }, 30)
ok(rr && rr.questions.length === Math.min(30, readQs.length), 'вопросы конспектов попадают в повторение')
ok(rr.questions.some((q) => q.answer !== 0), 'в повторении варианты перемешаны (верный не всегда первый)')

// 3. слабые данные по навыку возвращают ускоренный режим к полному
const weak = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`w${i}`, { b: 0, d: day, n: 2, m: 2, s: 'cart' }]))
const cart = P.MODULES.find((m) => m.id === 'cart')
ok(P.effectiveMode({ srs: weak }, cart, 'fast').mode === 'full', 'слабые ответы → «ускоренно» заменяется на «полный курс»')
ok(P.effectiveMode({ srs: {} }, cart, 'fast').mode === 'fast', 'без данных режим не меняется')
ok(P.effectiveMode({ srs: weak }, cart, 'full').mode === 'full', 'полный курс не затрагивается')

// 4. узлы привязаны к навыкам
ok(P.skillOfNode('globe-2') === 'globe' && P.skillOfNode('mexit-cart') === 'cart' && P.skillOfNode('srs-review') === null, 'навык определяется по узлу')
console.log(fails ? `\n${fails} ошибок` : '\nПрограмма: все проверки пройдены'); process.exit(fails ? 1 : 0)
