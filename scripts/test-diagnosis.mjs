// Проверка диагностики: честность выводов, выбор вопросов, план и пересмотр. Входит в `npm test`.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const mem = new Map()
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) }
const SRC = path.resolve('src')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-diag-'))
fs.mkdirSync(path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'lib'))
const fix = (code) => code.replace(/from '(\.{1,2}\/[\w\-/]+)'/g, "from '$1.mjs'")
for (const [dir, files] of [['data', fs.readdirSync(path.join(SRC, 'data'))], ['lib', ['vary.js', 'seen.js', 'srs.js', 'dates.js', 'diagnosis.js', 'plan.js']]]) {
  for (const f of files) if (f.endsWith('.js')) fs.writeFileSync(path.join(tmp, dir, f.replace(/\.js$/, '.mjs')), fix(fs.readFileSync(path.join(SRC, dir, f), 'utf8')))
}
const load = (d, f) => import(pathToFileURL(path.join(tmp, d, `${f}.mjs`)).href)
const { BANK, SKILLS, nextStep, expectedTotal } = await load('data', 'placement')
const D = await load('lib', 'diagnosis')
const PL = await load('lib', 'plan')
const PR = await load('data', 'program')

let fails = 0
const ok = (c, m) => { if (!c) { fails++; console.log('  ✗', m) } else console.log('  ✓', m) }
const R = (...a) => a.map(([level, ok, idk]) => ({ level, ok, idk: !!idk }))

console.log('классификация')
ok(D.classify([]).status === 'nodata', 'нет ответов → «не проверяли»')
ok(D.classify(R(['d2', true], ['d3', true])).status === 'partial', 'два ответа → «данных мало», даже если оба верны')
ok(D.classify(R(['d2', true], ['d3', true], ['d3', true])).status === 'strong', 'три верных → «уверенно»')
const b = D.classify(R(['d2', true], ['d3', false], ['d2', true]))
ok(b.status === 'base' && b.solidCore, 'два средних верно, сложное нет → «основа», ядро надёжное')
ok(!D.classify(R(['d2', false], ['d1', true], ['d2', true])).solidCore, 'промах на среднем уровне → ядро не надёжное')
ok(D.classify(R(['d2', true], ['d3', false], ['d2', false])).status === 'weak', 'одна верная из трёх → «пробелы»')
const g = D.classify(R(['d2', false, true], ['d1', false, true], ['d1', false]))
ok(g.status === 'gap' && g.idk === 2, '«не знаю» считается отдельно, три неверных → «не знакомо»')

console.log('режимы: пропуск только по основаниям')
ok(D.modeFor(D.classify(R(['d2', true], ['d3', true]))) === 'full', 'по двум ответам материал не пропускается')
ok(D.modeFor({ status: 'nodata' }) === 'full', 'без проверки — полный курс')
ok(D.modeFor(D.classify(R(['d2', true], ['d3', true], ['d3', true]))) === 'mastered', 'три верных → проверка вместо уроков')
ok(D.modeFor(b) === 'fast', 'надёжное ядро → ускоренно')

console.log('выбор вопросов')
const order = SKILLS.map((s) => s.id)
const play = (policy, seed = 0) => {
  const ans = []
  for (let guard = 0; guard < 100; guard++) {
    const st = nextStep(ans, order, seed)
    if (!st) break
    ans.push({ skill: st.skill, level: st.level, key: st.key, q: st.q.q, ok: policy(st, ans) })
  }
  return ans
}
const allRight = play(() => true), allWrong = play(() => false)
ok(allRight.length === expectedTotal(order) && allWrong.length === expectedTotal(order), 'по 3 вопроса на каждый из 8 навыков')
const per = (ans, sk) => ans.filter((a) => a.skill === sk)
ok(order.every((sk) => per(allRight, sk).map((a) => a.level).join() === 'd2,d3,d3'), 'все верно: средний → сложный → сложный')
ok(order.every((sk) => per(allWrong, sk).map((a) => a.level).join() === 'd2,d1,d1'), 'все неверно: средний → лёгкий → лёгкий')
ok(order.every((sk) => new Set(per(allRight, sk).map((a) => a.q)).size === 3 && new Set(per(allWrong, sk).map((a) => a.q)).size === 3), 'внутри навыка вопросы не повторяются')
const mixed = play((st, ans) => per(ans, st.skill).length !== 1)
ok(order.every((sk) => per(mixed, sk).map((a) => a.level).join() === 'd2,d3,d2'), 'смешанный результат → третий вопрос среднего уровня')
const s1 = play(() => true, 1)
ok(order.some((sk) => per(s1, sk)[0].q !== per(allRight, sk)[0].q), 'при пересдаче (seed) вопросы другие')

console.log('банк вопросов')
const all = Object.entries(BANK).flatMap(([sk, lv]) => Object.entries(lv).flatMap(([d, qs]) => qs.map((q) => ({ sk, d, q }))))
ok(all.every(({ q }) => q.answer === 0 && q.options.length >= 3 && new Set(q.options).size === q.options.length), 'у каждого вопроса 3+ различных варианта')
ok(order.every((sk) => BANK[sk].d1.length >= 2 && BANK[sk].d2.length >= 2 && BANK[sk].d3.length >= 2), 'на каждом уровне минимум два вопроса')
const longest = all.filter(({ q }) => q.options[0].length > Math.max(...q.options.slice(1).map((o) => o.length))).length / all.length
ok(longest <= 0.5, `верный вариант самый длинный не чаще чем в половине вопросов (сейчас ${Math.round(longest * 100)}%)`)

console.log('план')
const survey = { goal: 'school', grade: '8', minutes: 20, interests: [], self: 3 }
const none = PL.makePlan(survey, [])
ok(Object.entries(none.plan.modes).every(([, m]) => m === 'full'), 'без ответов (даже при самооценке «знаю хорошо») ничего не пропускается')
ok(none.result.startLevel === 'unknown', 'без ответов общий уровень не назначается')
const strong = PL.makePlan(survey, allRight)
ok(strong.result.startLevel === 'advanced', 'всё уверенно → «продвинутый»')
const midAns = allRight.map((a) => (a.skill === 'water' ? { ...a, ok: false } : a))
ok(PL.makePlan(survey, midAns).result.startLevel === 'intermediate', 'одна тема с явным пробелом → не «продвинутый», а «средний»')
ok(strong.plan.v === 5 && strong.plan.diag.length === 24, 'план v5 хранит ответы диагностики')
ok(PR.planOf({ placement: { plan: strong.plan } }) === strong.plan, 'программа читает новый план')
const indirect = ['hazards', 'continents', 'eco', 'kazakhstan']
ok(PR.MODULES.filter((m) => !m.pro && !indirect.includes(m.id)).every((m) => strong.plan.modes[m.id] === 'mastered'), 'все темы подтверждены → режим «проверка вместо уроков»')
ok(indirect.every((id) => strong.plan.modes[id] === 'fast'), 'темы, проверенные косвенно, не засчитываются целиком — только ускоренно')
ok(strong.result.summary.checks > 0 && strong.result.summary.lessons > 0, 'итог считает и проверки, и оставшиеся уроки')
const g5 = PL.makePlan({ ...survey, grade: '5' }, []).plan.order, g10 = PL.makePlan({ ...survey, grade: '10' }, []).plan.order
ok(g10.indexOf('people') < g5.indexOf('people') && g10.indexOf('regions') < g5.indexOf('regions'), 'класс влияет на порядок: в 10 классе население и регионы раньше')
ok(PL.makePlan({ ...survey, grade: '10' }, []).plan.why.people.some((t) => t.includes('10 класса')), 'причина называет класс')
const weakPlan = PL.makePlan(survey, allWrong)
ok(weakPlan.plan.weakSpots.length === 8 && weakPlan.plan.startLevel === 'beginner', 'везде неверно → все навыки в слабых местах, уровень «начинающий»')
ok(weakPlan.plan.why.globe[0].includes('0 из 3'), 'причина по теме называет число ответов')

console.log('пересмотр по мере обучения')
const health = (status, extra = {}) => ({ status, items: 12, solid: status === 'solid' ? 9 : 2, misses: 8, answers: 20, ...extra })
const st0 = { placement: strong.result, srs: {} }
const hw = { cart: health('weak'), climate: health('solid') }
const mk = (diagPlan, h) => PL.makePlan({ goal: 'school', minutes: 20, interests: [], self: 2 }, diagPlan, { health: h })
const re = mk(allRight, hw)
ok(re.per.cart.status === 'weak' && re.plan.modes.cart === 'full', 'слабая практика понижает «уверенно» до «пробелы»')
const re2 = mk(allWrong, { water: health('solid') })
ok(re2.per.water.status === 'base' && re2.plan.modes.water === 'full', 'хорошая практика поднимает «не знакомо» до «основа», но не пропускает материал')
const rp = PL.replan({ placement: strong.result, srs: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`w${i}`, { b: 0, d: '2026-01-01', n: 3, m: 3, s: 'cart' }])) }, '2026-06-01')
ok(rp && rp.plan.revision === 1 && rp.plan.skills.cart.status === 'weak', 'replan: версия растёт, слабая практика учтена')
ok(PL.replan({ placement: null }) === null, 'без исходной диагностики пересмотра нет')
ok(PL.practiceSince({ placement: { plan: { practiceN: 5 } }, srs: { a: { n: 10 } } }) === 5, 'счётчик новых ответов практики')

console.log(fails ? `\n${fails} ошибок` : '\nДиагностика: все проверки пройдены'); process.exit(fails ? 1 : 0)
