// Проверка контента: npm run check
// Находит опечатки в уроках, вопросах, картах и достижениях ДО того, как их увидит ученик.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC = path.resolve('src')
// data-файлы импортируют друг друга без расширения (это нормально для Vite, но не для Node):
// копируем их во временную папку и дописываем .mjs
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gas-check-'))
fs.mkdirSync(path.join(tmp, 'data')); fs.mkdirSync(path.join(tmp, 'lib'))
const fix = (code) => code.replace(/from '(\.{1,2}\/[\w\-/]+)'/g, "from '$1.mjs'")
for (const [dir, files] of [['data', fs.readdirSync(path.join(SRC, 'data'))], ['lib', ['vary.js', 'seen.js', 'srs.js', 'dates.js']]]) {
  for (const f of files) if (f.endsWith('.js')) fs.writeFileSync(path.join(tmp, dir, f.replace(/\.js$/, '.mjs')), fix(fs.readFileSync(path.join(SRC, dir, f), 'utf8')))
}
const load = (f) => import(pathToFileURL(path.join(tmp, 'data', `${f}.mjs`)).href)
const { topics, olympiadLessons } = await load('courses')
const { BANK, SKILLS } = await load('placement')
const { INFO } = await load('capitals')
const { MODULES, STAGES, lessonById } = await load('program')
const { READS } = await load('learn-reads')
const { NEW_LESSONS } = await load('learn-lessons')

const iconsSrc = fs.readFileSync(path.join(SRC, 'lib', 'gas-icons.js'), 'utf8')
const ICONS = new Set([...iconsSrc.slice(iconsSrc.indexOf('export const GAS_ICONS')).matchAll(/^  (\w+): \[/gm)].map((m) => m[1]))
const REGIONS = new Set([...fs.readFileSync(path.join(SRC, 'data', 'world.js'), 'utf8').matchAll(/\['[^']+', '(\w+)', \[/g)].map((m) => m[1]))
let atlas = null
try {
  const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json', 'utf8'))
  atlas = new Set(topo.objects.countries.geometries.map((g) => String(g.id).padStart(3, '0')))
} catch { /* node_modules ещё не установлены — проверим по списку стран из capitals.js */ }

let errors = 0, warns = 0
const err = (where, msg) => { errors++; console.log(`  ✗ ${where}: ${msg}`) }
const warn = (where, msg) => { warns++; console.log(`  ! ${where}: ${msg}`) }
const isId = (id) => /^\d{3}$/.test(id) && (atlas ? atlas.has(id) : !!INFO[id])
const txt = (v) => typeof v === 'string' && v.trim().length > 0

function checkQuestion(q, where, needWhy = true) {
  if (!txt(q.q)) err(where, 'нет текста вопроса (q)')
  if (needWhy && !txt(q.why)) warn(where, 'нет пояснения (why) — ученик увидит пустое окно после ответа')
  if (q.type === 'input') {
    if (!Array.isArray(q.answers) || !q.answers.length || !q.answers.every(txt)) err(where, 'input: нужен непустой массив answers (допустимые ответы)')
    if (q.img && !/^(flag|fig):[a-z]+$/.test(q.img)) err(where, `img «${q.img}»: ожидается flag:xx или fig:name`)
    return
  }
  if (q.type === 'order') {
    if (!Array.isArray(q.items) || q.items.length < 3 || !q.items.every(txt)) err(where, 'order: нужен массив items из 3+ элементов в верном порядке')
    else if (new Set(q.items).size !== q.items.length) err(where, 'order: элементы items повторяются')
    return
  }
  if (q.type === 'match') {
    if (!Array.isArray(q.pairs) || q.pairs.length < 3 || !q.pairs.every((p) => Array.isArray(p) && p.length === 2 && p.every(txt))) err(where, 'match: нужен массив pairs из 3+ пар [слева, справа]')
    else if (new Set(q.pairs.map((p) => p[0])).size !== q.pairs.length || new Set(q.pairs.map((p) => p[1])).size !== q.pairs.length) err(where, 'match: значения в парах должны быть уникальны')
    return
  }
  if (q.img && !/^(flag|fig):[a-z]+$/.test(q.img)) err(where, `img «${q.img}»: ожидается flag:xx или fig:name`)
  if (!Array.isArray(q.options) && q.type !== 'map') return err(where, 'нет списка options')
  if (q.type === 'map') {
    if (!isId(q.answer)) err(where, `answer «${q.answer}» — не код страны (3 цифры, ISO 3166-1, например '076')`)
    if (!REGIONS.has(q.region)) err(where, `region «${q.region}» неизвестен (${[...REGIONS].join(', ')})`)
    return
  }
  if (q.options.length < 2 || q.options.length > 4) warn(where, `вариантов ${q.options.length}; обычно 2–3`)
  if (q.type === 'multi') {
    if (!Array.isArray(q.answer) || !q.answer.length) err(where, 'multi: answer должен быть непустым массивом индексов')
    else if (q.answer.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length)) err(where, `multi: answer вне диапазона`)
  } else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
    err(where, `answer=${q.answer} вне диапазона 0…${q.options.length - 1}`)
  }
  if (new Set(q.options).size !== q.options.length) err(where, 'одинаковые варианты ответа')
  if (q.type === 'mapid') {
    if (!isId(q.target)) err(where, `target «${q.target}» — не код страны`)
    if (!REGIONS.has(q.region)) err(where, `region «${q.region}» неизвестен`)
  }
}

console.log(`Темы: ${topics.length}, иконок: ${ICONS.size}, регионов: ${REGIONS.size}${atlas ? '' : '  (world-atlas не найден — коды стран проверены по capitals.js)'}`)
const lessonIds = new Set()
for (const t of topics) {
  console.log(`\n${t.title} (${t.id})`)
  if (!ICONS.has(t.icon)) err(t.id, `иконка «${t.icon}» не зарегистрирована в lib/gas-icons.js`)
  if (!/^#[0-9a-f]{6}$/i.test(t.color)) err(t.id, `цвет «${t.color}» должен быть вида #16a34a`)
  for (const l of t.lessons) {
    const w = `${t.id} → ${l.id}`
    if (lessonIds.has(l.id)) err(w, 'id урока уже использован'); lessonIds.add(l.id)
    if (!/^[a-z]+-\d+$/.test(l.id)) warn(w, 'id лучше делать вида «тема-номер» (достижения считают такие уроки)')
    if (!txt(l.title)) err(w, 'нет title'); if (!txt(l.text)) err(w, 'нет текста объяснения (text)')
    if (!l.questions?.length) err(w, 'нет вопросов')
    else if (l.questions.length < 3) warn(w, 'меньше 3 вопросов — оценка «три точки» будет грубой')
    const seen = new Set()
    l.questions?.forEach((q, i) => { checkQuestion(q, `${w} · вопрос ${i + 1}`); if (seen.has(q.q) && q.type !== 'mapid') warn(w, `повтор вопроса «${q.q}»`); seen.add(q.q) })
    console.log(`  ✓ ${l.id}: ${l.questions?.length ?? 0} вопр.`)
  }
}
console.log('\nОлимпиада (Pro)')
olympiadLessons.forEach((l) => l.questions.forEach((q, i) => checkQuestion(q, `${l.id} · вопрос ${i + 1}`)))
console.log('\nДиагностика')
for (const sk of SKILLS) {
  const b = BANK[sk.id]
  if (!b) { err(`diagnostic ${sk.id}`, 'нет банка вопросов'); continue }
  if (b.d1?.length < 2 || b.d2?.length < 2 || b.d3?.length < 2) err(`diagnostic ${sk.id}`, 'нужно минимум по 2 вопроса на каждом уровне (d1, d2, d3)')
  for (const [d, list] of Object.entries(b)) list.forEach((q, i) => checkQuestion({ ...q, why: 'x' }, `diagnostic ${sk.id}.${d}[${i}]`, false))
  if (!ICONS.has(sk.icon)) err(`diagnostic ${sk.id}`, `иконка «${sk.icon}» не зарегистрирована`)
}
console.log(`  навыков: ${SKILLS.length}, вопросов: ${SKILLS.reduce((n, s) => n + Object.values(BANK[s.id] ?? {}).flat().length, 0)}`)

console.log('\nПрограмма')
const stageIds = new Set(STAGES.map((s) => s.id)), used = new Map()
for (const m of MODULES) {
  if (!stageIds.has(m.stage)) err(m.id, `неизвестная ступень «${m.stage}»`)
  if (!ICONS.has(m.icon)) err(m.id, `иконка «${m.icon}» не зарегистрирована`)
  if (!SKILLS.some((s) => s.id === m.skill) && m.skill !== 'olymp') err(m.id, `навык «${m.skill}» не из диагностики`)
  if (!/^#[0-9a-f]{6}$/i.test(m.color)) err(m.id, 'цвет вида #rrggbb')
  for (const c of m.chapters) {
    if (!c.lessons.length) err(`${m.id} → ${c.id}`, 'в главе нет уроков')
    for (const id of c.lessons) {
      if (!lessonById(id)) err(`${m.id} → ${c.id}`, `урок «${id}» не найден`)
      if (used.has(id)) err(`${m.id} → ${c.id}`, `урок «${id}» уже в главе ${used.get(id)}`); used.set(id, c.id)
    }
    const r = READS[c.id]
    if (!r) warn(`${m.id} → ${c.id}`, 'у главы нет конспекта')
    else {
      if (!r.cards?.length || r.cards.some((k) => !txt(k.h) || !txt(k.p))) err(c.id, 'в конспекте нужны карточки с h и p')
      if (!txt(r.title)) err(c.id, 'нет title конспекта')
      r.questions.forEach((q, i) => checkQuestion(q, `read ${c.id} · вопрос ${i + 1}`))
    }
  }
}
for (const id of Object.keys(READS)) if (!MODULES.some((m) => m.chapters.some((c) => c.id === id))) err(`READS ${id}`, 'нет такой главы')
const orphan = [...topics.flatMap((t) => t.lessons), ...olympiadLessons, ...NEW_LESSONS].filter((l) => !used.has(l.id))
orphan.forEach((l) => warn(l.id, 'урок не входит ни в одну главу'))
NEW_LESSONS.forEach((l) => { if (lessonIds.has(l.id)) err(l.id, 'id совпадает с уроком из courses.js'); l.questions.forEach((q, i) => checkQuestion(q, `${l.id} · вопрос ${i + 1}`)) })
console.log(`  модулей: ${MODULES.length}, глав: ${MODULES.reduce((n, m) => n + m.chapters.length, 0)}, конспектов: ${Object.keys(READS).length}, уроков в программе: ${used.size}, новых уроков: ${NEW_LESSONS.length}`)
console.log('\nДостижения')
const achSrc = fs.readFileSync(path.join(SRC, 'data', 'achievements.js'), 'utf8')
const achItems = [...achSrc.matchAll(/id: '(\w+)', icon: '(\w+)'/g)]
const ach = new Set()
for (const [, id, icon] of achItems) { if (ach.has(id)) err(id, 'id повторяется'); ach.add(id); if (!ICONS.has(icon)) err(id, `иконка «${icon}» не зарегистрирована`) }
console.log(`  всего: ${achItems.length}`)
console.log('\nСтраны и столицы')
const caps = Object.entries(INFO)
caps.forEach(([id, c]) => { if (!/^\d{3}$/.test(id)) err(`capitals ${id}`, 'ключ должен быть 3 цифры'); if (!txt(c.name) || !txt(c.cap)) err(`capitals ${id}`, 'пустое имя или столица'); if (atlas && !atlas.has(id)) warn(`capitals ${id} (${c.name})`, 'такой страны нет на карте') })
console.log(`  всего: ${caps.length}`)

fs.rmSync(tmp, { recursive: true, force: true })
console.log(`\n${errors ? '✗' : '✓'} Ошибок: ${errors}, предупреждений: ${warns}`)
process.exit(errors ? 1 : 0)
