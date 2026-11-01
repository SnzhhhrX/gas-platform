// Образовательная программа GAS.
// Иерархия: Ступень → Модуль → Глава → Узлы (конспект · уроки · проверка).
// Персональный путь собирает buildProgram(state): порядок модулей, глубина и пропуски зависят от плана пользователя.
import { topics, olympiadLessons } from './courses'
import { NEW_LESSONS } from './learn-lessons'
import { MORE_LESSONS } from './learn-more'
import { EXTRA_LESSONS, EXTRA_BY_CHAPTER } from './learn-extra'
import { KZ_LESSONS, KZ_BY_CHAPTER, KZ_NEW_CHAPTER } from './learn-kz'
import { freshFirst } from '../lib/seen'
import { BULK_LESSONS } from './learn-bulk'
import { READS } from './learn-reads'
import { varyQuestion } from '../lib/vary'
import { qKey, dueKeys, dueCount, skillHealth, MIN_EVIDENCE } from '../lib/srs'
import { today } from '../lib/dates'

export const STAGES = [
  { id: 'basics', num: 'I', title: 'Основы', blurb: 'Глобус, координаты и карта — язык географии.' },
  { id: 'planet', num: 'II', title: 'Природа Земли', blurb: 'Недра, рельеф, океаны, атмосфера, природные зоны.' },
  { id: 'people', num: 'III', title: 'Мир людей', blurb: 'Материки, страны, столицы, население и хозяйство.' },
  { id: 'olymp', num: 'IV', title: 'Pro · Углублённо', blurb: 'Сложные задачи: причины, расчёты, регионы. Только в Pro.' },
]

const ch = (id, title, blurb, lessons) => ({ id, title, blurb, lessons })
const mod = (id, stage, skill, title, blurb, icon, color, chapters, extra = {}) => ({ id, stage, skill, title, blurb, icon, color, chapters, ...extra })

export const MODULES = [
  mod('globe', 'basics', 'globe', 'Глобус и координаты', 'Форма Земли, широта, долгота и время', 'compass', '#0ea5e9', [
    ch('globe-planet', 'Земля как планета', 'Форма, движения, главные линии', ['globe-2', 'globe-b1', 'globe-b2', 'continents-13', 'climate-6', 'globe-b5']),
    ch('globe-coords', 'Широта и долгота', 'Как найти любую точку на Земле', ['continents-11', 'globe-3', 'globe-b3']),
    ch('globe-time', 'Время и пояса', 'Почему в Токио уже вечер', ['globe-4', 'globe-5', 'globe-6', 'globe-b4']),
  ]),
  mod('cart', 'basics', 'cart', 'Язык карты', 'Масштаб, азимут, рельеф и проекции', 'map', '#6366f1', [
    ch('cart-scale', 'Масштаб и измерения', 'От сантиметров на карте до километров', ['maps-12', 'cart-2', 'cart-b1', 'cart-b2']),
    ch('cart-orient', 'Ориентирование', 'Стороны света, азимут, Полярная звезда', ['continents-14', 'cart-3', 'cart-b3']),
    ch('cart-relief', 'Рельеф и проекции', 'Горизонтали и искажения карты', ['maps-11', 'maps-13', 'cart-4', 'cart-5', 'cart-b4', 'cart-b5']),
  ]),
  mod('relief', 'planet', 'relief', 'Земная кора и рельеф', 'Плиты, горы, равнины и ископаемые', 'mountain', '#b45309', [
    ch('relief-earth', 'Строение Земли и плиты', 'Ядро, мантия, кора, вулканы', ['nature-18', 'nature-7', 'nature-11', 'relief-2', 'relief-b1', 'relief-b2', 'relief-b5']),
    ch('relief-forms', 'Горы и равнины', 'Формы рельефа и рекорды', ['nature-1', 'nature-3', 'nature-15', 'nature-17', 'relief-4', 'relief-b3', 'relief-b4']),
    ch('relief-ore', 'Недра и ископаемые', 'Что добывают и где', ['nature-9', 'relief-3', 'relief-extra-1']),
  ]),
  mod('water', 'planet', 'water', 'Океан и воды суши', 'Океаны, моря, реки, озёра, ледники', 'waves', '#0369a1', [
    ch('water-ocean', 'Мировой океан', 'Океаны, моря, проливы, течения', ['continents-2', 'continents-8', 'continents-9', 'continents-10', 'continents-15', 'continents-17', 'water-3', 'water-b1', 'water-b2']),
    ch('water-land', 'Реки, озёра, ледники', 'Воды суши и их рекорды', ['nature-4', 'nature-2', 'nature-16', 'nature-12', 'nature-8', 'water-b3', 'water-b4', 'water-b5', 'water-extra-1']),
  ]),
  mod('climate', 'planet', 'climate', 'Атмосфера и климат', 'Воздух, ветры, осадки, климатические пояса', 'cloud', '#f97316', [
    ch('climate-air', 'Атмосфера', 'Слои, тепло, влажность', ['climate-12', 'climate-13', 'climate-17', 'climate-9', 'climate-b1']),
    ch('climate-wind', 'Ветры, осадки, стихия', 'Давление, циклоны, ураганы', ['climate-2', 'climate-7', 'climate-15', 'climate-10', 'climate-b2', 'climate-b5']),
    ch('climate-zones', 'Климатические пояса', 'От экватора до полюсов', ['climate-1', 'climate-3', 'climate-14', 'climate-16', 'climate-11', 'climate-b3']),
    ch('climate-factors', 'Что формирует климат', 'Океан, горы, города', ['climate-4', 'climate-5', 'climate-8', 'climate-18', 'climate-b4', 'climate-extra-1']),
  ]),
  mod('biomes', 'planet', 'nature', 'Природные зоны', 'Леса, степи, пустыни и человек', 'trees', '#16a34a', [
    ch('biomes-zones', 'Природные зоны мира', 'Тундра, тайга, саванна, пустыни', ['nature-6', 'nature-13', 'nature-5', 'biomes-2', 'biomes-b1', 'biomes-b2', 'biomes-b3']),
    ch('biomes-human', 'Человек и природа', 'Охрана, угрозы, решения', ['nature-10', 'nature-14', 'biomes-3', 'biomes-b4']),
  ]),
  mod('hazards', 'planet', 'relief', 'Стихии и катастрофы', 'Землетрясения, вулканы, ураганы, цунами: причины и безопасность', 'zap', '#dc2626', [
    ch('hazards-earth', 'Недра: землетрясения и вулканы', 'Где и почему содрогается Земля', ['hazards-1', 'hazards-2']),
    ch('hazards-sky', 'Вода и воздух: стихии', 'Ураганы, цунами, паводки, сели', ['hazards-3', 'hazards-4']),
  ]),
  mod('regions', 'people', 'world', 'Материки и регионы', 'Части света, острова, границы, государства', 'globe', '#8b5cf6', [
    ch('regions-continents', 'Материки', 'Шесть материков и их особенности', ['continents-1', 'continents-3', 'continents-4', 'continents-5', 'continents-6', 'continents-7', 'continents-12', 'continents-16', 'regions-2', 'regions-3', 'regions-b1', 'regions-b2', 'regions-b3', 'regions-b4']),
    ch('regions-world', 'Регионы и границы', 'Как устроена политическая карта', ['countries-8', 'countries-6', 'countries-9', 'countries-12', 'countries-18', 'countries-10', 'regions-b5']),
  ]),
  mod('world', 'people', 'world', 'Страны, столицы, флаги', 'Столицы мира и язык флагов', 'landmark', '#d946ef', [
    ch('world-countries', 'Страны мира', 'Рекорды и неожиданные столицы', ['countries-1', 'countries-5', 'countries-11', 'countries-7', 'world-b4']),
    ch('world-cap-1', 'Столицы · I', 'Как запоминать и не путать', ['countries-2', 'countries-3', 'countries-4', 'capitals-1', 'capitals-2', 'capitals-3', 'capitals-4', 'capitals-5', 'capitals-6', 'world-b1']),
    ch('world-cap-2', 'Столицы · II', 'Азия и Африка', ['capitals-7', 'capitals-8', 'capitals-9', 'capitals-10', 'capitals-11', 'capitals-12', 'capitals-13', 'capitals-14', 'countries-14', 'world-b2']),
    ch('world-cap-3', 'Столицы · III', 'Америка и Европа', ['capitals-15', 'capitals-16', 'capitals-17', 'capitals-18', 'capitals-19', 'capitals-20', 'countries-22', 'world-b3']),
    ch('world-cap-4', 'Столицы · IV', 'Редкие столицы', ['capitals-21', 'capitals-22', 'capitals-23', 'capitals-24', 'capitals-25', 'capitals-26']),
    ch('world-flags', 'Флаги мира', 'Как «читать» флаги', ['countries-13', 'countries-15', 'countries-16', 'countries-19', 'countries-20', 'countries-21', 'world-b5']),
    ch('world-capitals-extra', 'Необычные столицы', 'Частые ошибки и сюрпризы', ['world-extra-1', 'world-extra-2']),
    ch('world-exam', 'Экзаменационная тренировка', 'Смешанные задачи по странам и природе', ['exam-b1', 'exam-b2', 'exam-b3']),
  ]),
  mod('people', 'people', 'people', 'Население и хозяйство', 'Демография, города, экономика, энергия', 'users', '#0d9488', [
    ch('people-pop', 'Население и города', 'Численность, плотность, урбанизация', ['people-1', 'people-2', 'people-b1', 'people-b2']),
    ch('people-eco', 'Хозяйство и энергия', 'Секторы экономики и ресурсы', ['people-3', 'people-4', 'countries-17', 'people-5', 'people-b3', 'people-b4', 'people-b5', 'people-extra-1']),
  ]),
  mod('continents', 'people', 'world', 'Материки: путеводитель', 'Рекорды, реки, горы и ориентиры шести материков', 'globe', '#8b5cf6', [
    ch('cont-north', 'Евразия', 'Европа и Азия: от Волги до Гималаев', ['cont-1', 'cont-2']),
    ch('cont-south', 'Африка и Америки', 'Нил, Анды, Амазонка и Великие озёра', ['cont-3', 'cont-4', 'cont-5']),
    ch('cont-far', 'Австралия и Антарктида', 'Океания и самый холодный материк', ['cont-6']),
  ]),
  mod('eco', 'people', 'people', 'Человек и природа', 'Климат, вода, охрана природы, энергия и отходы', 'sprout', '#22c55e', [
    ch('eco-air', 'Атмосфера и климат', 'Парниковый эффект и озоновый слой', ['eco-1']),
    ch('eco-water', 'Вода и почва', 'Пресная вода, эрозия, опустынивание', ['eco-2']),
    ch('eco-protect', 'Охрана природы и энергия', 'Заповедники, возобновляемая энергия, отходы', ['eco-3', 'eco-4']),
  ]),
  mod('kazakhstan', 'people', 'world', 'Казахстан', 'Территория, реки, города, природа и ресурсы страны', 'flag', '#06b6d4', [
    ch('kazakhstan-land', 'Территория и воды', 'Границы, реки, озёра и моря', ['kazakhstan-1', 'kazakhstan-2']),
    ch('kazakhstan-cities', 'Города и регионы', 'От Астаны до Мангистау', ['kazakhstan-3', 'kazakhstan-5']),
    ch('kazakhstan-nature', 'Природа и ресурсы', 'Степи, горы, нефть и уран', ['kazakhstan-4', 'kazakhstan-6']),
  ]),
  mod('atlas', 'people', 'world', 'Практикум по карте', 'Находим страны на настоящей карте', 'pin', '#06b6d4', [
    ch('atlas-1', 'Первые шаги на карте', 'Базовые страны и ориентиры', ['maps-1', 'maps-2', 'maps-3']),
    ch('atlas-2', 'Материки на карте', 'Азия, Африка, Америки, Европа', ['maps-4', 'maps-5', 'maps-6', 'maps-8']),
    ch('atlas-3', 'Мастер силуэтов', 'Сложные случаи и микс', ['maps-7', 'maps-9', 'maps-10', 'maps-extra-1']),
    ch('atlas-4', 'Европа и Азия глубже', 'Крупные страны и силуэты', ['maps-14', 'maps-15', 'maps-18']),
    ch('atlas-5', 'Африка, Америки, блиц', 'Регионы и быстрая серия', ['maps-16', 'maps-17', 'maps-19', 'maps-20']),
  ]),
  // Pro-only: углублённые задачи (не показываются в бесплатном пути)
  mod('olympiad', 'olymp', 'olymp', 'Углублённый модуль', 'Сложные задачи: причины, расчёты, регионы', 'trophy', '#ca8a04', [
    ch('oly-warm', 'Разминка', 'Метод решения и первые задачи', ['pro-olympiad', 'pro-olympiad-2']),
    ch('oly-nature', 'Природа: причины и следствия', 'Климат, рельеф, воды', ['pro-olympiad-3', 'pro-olympiad-6', 'pro-olympiad-9', 'pro-olympiad-12']),
    ch('oly-calc', 'Расчёты', 'Время, координаты, масштаб, плотность', ['pro-olympiad-4', 'pro-olympiad-5', 'pro-olympiad-8']),
    ch('oly-econ', 'Хозяйство и политика', 'Ресурсы, анклавы, столицы', ['pro-olympiad-7', 'pro-olympiad-10', 'pro-olympiad-11']),
    ch('oly-practice', 'Практикум', 'Часовые пояса, масштаб, климатограммы', ['pro-olympiad-13', 'pro-olympiad-14', 'pro-olympiad-15']),
    ch('oly-practice-2', 'Практикум: люди и хозяйство', 'Население, проливы, специализация', ['pro-olympiad-16', 'pro-olympiad-17', 'pro-olympiad-18']),
  ], { pro: true }),
]
export const moduleById = (id) => MODULES.find((m) => m.id === id)
export const NATURAL_ORDER = MODULES.map((m) => m.id)

// новые уроки добавляются в конец своих глав
for (const m of MODULES) for (const c of m.chapters) if (EXTRA_BY_CHAPTER[c.id]) c.lessons.push(...EXTRA_BY_CHAPTER[c.id])
for (const m of MODULES) for (const c of m.chapters) if (KZ_BY_CHAPTER[c.id]) c.lessons.push(...KZ_BY_CHAPTER[c.id])
MODULES.find((m) => m.id === 'kazakhstan').chapters.push(ch(KZ_NEW_CHAPTER.id, 'Культура и космос', 'Флаг, юрта, Байконур', KZ_NEW_CHAPTER.lessons))

// ───────── Индекс уроков ─────────
// Собираем общий пул вопросов по префиксу модуля (globe-, cart-, …) для дополнения коротких уроков
const allRaw = [...topics.flatMap((t) => t.lessons), ...olympiadLessons, ...NEW_LESSONS, ...BULK_LESSONS, ...MORE_LESSONS, ...EXTRA_LESSONS, ...KZ_LESSONS]
const rawById = new Map(allRaw.map((l) => [l.id, l]))
const poolByPrefix = new Map()
for (const l of allRaw) {
  const prefix = (l.id || '').split('-')[0] || 'misc'
  if (!poolByPrefix.has(prefix)) poolByPrefix.set(prefix, [])
  for (const q of l.questions || []) poolByPrefix.get(prefix).push(q)
}
const MIN_Q = 8
const padUsed = new Set() // вопрос добирает недостающие места только в одном уроке — без частых повторов
function padQuestions(lesson) {
  const qs = [...(lesson.questions || [])]
  if (qs.length >= MIN_Q) return qs.map(varyQuestion)
  const prefix = (lesson.id || '').split('-')[0] || 'misc'
  const pool = poolByPrefix.get(prefix) || []
  const seen = new Set(qs.map((q) => q.q))
  for (const q of pool) {
    if (qs.length >= MIN_Q) break
    if (seen.has(q.q) || padUsed.has(q.q)) continue
    seen.add(q.q); padUsed.add(q.q)
    qs.push(q)
  }
  // пул опустел — разрешаем повтор, но берём вопросы из конца пула
  for (const q of [...pool].reverse()) {
    if (qs.length >= MIN_Q) break
    if (seen.has(q.q)) continue
    seen.add(q.q)
    qs.push(q)
  }
  // если пула не хватило — берём из соседних префиксов
  if (qs.length < MIN_Q) {
    for (const [, p] of poolByPrefix) {
      if (qs.length >= MIN_Q) break
      for (const q of p) {
        if (qs.length >= MIN_Q) break
        if (seen.has(q.q)) continue
        seen.add(q.q)
        qs.push(q)
      }
    }
  }
  return qs.map(varyQuestion)
}
const index = new Map()
for (const l of allRaw) index.set(l.id, { ...l, questions: padQuestions(l) })
export const lessonById = (id) => index.get(id)

// id узла → модуль (для статистики по модулям)
const nodeModule = new Map()
for (const m of MODULES) {
  nodeModule.set(`mtest-${m.id}`, m.id)
  for (const c of m.chapters) {
    nodeModule.set(`read-${c.id}`, m.id); nodeModule.set(`ctest-${c.id}`, m.id)
    for (const id of c.lessons) nodeModule.set(id, m.id)
  }
}
export const moduleOfNode = (id) => nodeModule.get(id) ?? null
// Навык узла: по модулю, к которому он относится. Итоговые узлы (mexit-, challenge-, focus-) тоже привязаны к модулю.
export const skillOfNode = (id) => {
  const direct = nodeModule.get(id)
  const mid = direct ?? (/^(mexit|challenge|focus)-(.+)$/.exec(id || '')?.[2] ?? null)
  return mid ? MODULES.find((m) => m.id === mid)?.skill ?? null : null
}
export const isProgramLesson = (id) => nodeModule.has(id) && !/^(read|ctest|mtest)-/.test(id)

// ───────── Узлы ─────────
const hasType = (l, types) => l.questions.some((q) => types.includes(q.type))
const minutesOf = (l) => Math.max(1, Math.round((l.cards?.length ?? 0) * 0.8 + l.questions.length * 0.5))
const noMap = (q) => !['map', 'mapid'].includes(q.type)

// Контрольный набор: по кругу берём вопросы из разных уроков (не меньше 10)
function mixTest(id, title, text, lessons, n, color, allowMap) {
  const target = Math.max(n || 10, 10)
  const pool = lessons.map((l) => freshFirst(l.questions.filter((q) => allowMap || noMap(q))))
  const out = []
  for (let i = 0; out.length < target && i < 24; i++) for (const p of pool) if (p[i] && out.length < target) out.push(p[i])
  return { id, title, text, test: true, icon: 'trophy', color, questions: out }
}

const READ_MIN_Q = 7
function readNode(m, c) {
  const r = READS[c.id]
  if (!r) return null
  // Конспект проверяется не тремя вопросами: добираем до семи из уроков этой же главы
  const qs = [...r.questions]
  const seen = new Set(qs.map((q) => q.q))
  for (const id of c.lessons) {
    for (const q of freshFirst(rawById.get(id)?.questions || [])) {
      if (qs.length >= READ_MIN_Q) break
      if (['map', 'mapid'].includes(q.type) || seen.has(q.q)) continue
      seen.add(q.q); qs.push(q)
    }
  }
  return { id: `read-${c.id}`, title: r.title, text: `Ключевые понятия главы «${c.title}» и ${qs.length} вопросов на понимание.`, cards: r.cards, questions: qs.map(varyQuestion), read: true, icon: 'book', color: m.color }
}

// Ускоренный курс: не меньше половины уроков главы; остаются те, где больше «трудных» заданий, и первый урок
function pickFast(lessons, completed) {
  if (lessons.length <= 2) return lessons
  const keep = Math.ceil(lessons.length * 0.5)
  const score = (l, i) => (completed[l.id] ? 100 : 0) + (i === 0 ? 3 : 0) + (hasType(l, ['input']) ? 2 : 0) + (hasType(l, ['map', 'mapid']) ? 1 : 0) + l.questions.length * 0.1
  const top = new Set(lessons.map((l, i) => [l, score(l, i)]).sort((a, b) => b[1] - a[1]).slice(0, keep).map((x) => x[0].id))
  return lessons.filter((l) => top.has(l.id))
}

// ───────── Адаптация плана к реальным результатам ─────────
const accOf = (state, id) => { const s = state.acc?.[id]; return s && s.a >= 1 ? s : null }
export function effectiveMode(state, m, base) {
  const done = state.completed ?? {}
  // Реальные данные о закреплении: если по навыку набралось достаточно ответов и они слабые, ускоренный путь не подходит
  const h = skillHealth(state.srs, today())[m.skill]
  if ((base === 'mastered' || base === 'fast') && h?.status === 'weak') return { mode: 'full', note: 'Повторяющиеся ошибки по этой теме — вернули все уроки и объяснения.' }
  const test = done[`mtest-${m.id}`]
  if (base === 'mastered' && test && test.score / test.total < 0.6) return { mode: 'fast', note: 'Проверка прошла не так гладко — подключили конспекты и ключевые уроки.' }
  const s = accOf(state, m.id)
  if (base === 'fast' && s && s.a >= 12 && s.c / s.a < 0.65) return { mode: 'full', note: `Точность ${Math.round((s.c / s.a) * 100)}% — вернули все уроки модуля.` }
  if (base === 'full' && s && s.a >= 25 && s.c / s.a >= 0.93) return { mode: 'fast', note: `Точность ${Math.round((s.c / s.a) * 100)}% — убрали повторяющиеся уроки.` }
  return { mode: base, note: null }
}

export const DEFAULT_PLAN = { v: 2, goal: 'school', modes: {}, order: NATURAL_ORDER, why: {}, mastery: {}, tested: false }
export const planOf = (state) => (state.placement?.plan?.v >= 2 && Array.isArray(state.placement.plan.order) ? state.placement.plan : DEFAULT_PLAN)

// Собираем персональную программу для состояния пользователя
export function buildProgram(state) {
  const plan = planOf(state)
  const completed = state.completed ?? {}
  const order = [...plan.order.filter((id) => moduleById(id)), ...NATURAL_ORDER.filter((id) => !plan.order.includes(id))]

  // Модули по порядку: следующий открывается после прохождения текущего
  // (все узлы / итоговая проверка модуля). Pro — только с подпиской.
  let prevDone = true
  let fullLessons = 0, plannedLessons = 0
  const modules = order.map((id, mi) => {
    const m = moduleById(id)
    const lessonsOf = (c) => c.lessons.map((x) => lessonById(x)).filter(Boolean)
    const total = m.chapters.reduce((n, c) => n + c.lessons.length, 0)
    if (!m.pro) fullLessons += total
    const base = plan.modes?.[id] ?? 'full'
    const { mode, note } = effectiveMode(state, m, base)

    let chapters
    if (mode === 'mastered') {
      const all = m.chapters.flatMap(lessonsOf)
      const t = mixTest(`mtest-${m.id}`, 'Проверка знаний', `Вы уже хорошо знаете тему «${m.title}». Ответьте на 8 вопросов — и модуль будет засчитан без уроков. Если выйдет хуже 60%, мы подключим конспекты.`, all, 8, m.color, m.id === 'atlas')
      chapters = [{ id: `mastered-${m.id}`, title: 'Проверка знаний', blurb: 'Одна проверка вместо всех уроков', nodes: [{ id: t.id, kind: 'test', lesson: { ...t, kind: 'test' } }] }]
    } else {
      chapters = m.chapters.map((c) => {
        const all = lessonsOf(c)
        const picked = mode === 'fast' ? pickFast(all, completed) : all
        if (!m.pro) plannedLessons += picked.length
        const nodes = []
        const r = readNode(m, c)
        if (r) nodes.push({ id: r.id, kind: 'read', lesson: { ...r, kind: 'read' } })
        for (const l of picked) nodes.push({ id: l.id, kind: 'lesson', lesson: { ...l, icon: m.icon, color: m.color, kind: 'lesson' } })
        if (picked.length >= 2) {
          const t = mixTest(`ctest-${c.id}`, `Проверка: ${c.title}`, `Итоговые вопросы по главе «${c.title}». Без ошибок — три звезды.`, picked, 6, m.color, m.id === 'atlas')
          nodes.push({ id: t.id, kind: 'test', lesson: { ...t, kind: 'test' } })
        }
        return { id: c.id, title: c.title, blurb: c.blurb, nodes }
      })
    }

    // Главы по порядку. Уроки внутри главы открыты; тест главы — после ≥60% уроков.
    // В конце модуля — итоговая проверка: без неё следующий модуль закрыт.
    let chapterOpen = true
    for (const c of chapters) {
      c.open = chapterOpen
      const lessons = c.nodes.filter((n) => n.kind === 'lesson'), doneL = lessons.filter((n) => completed[n.id]).length
      const need = Math.ceil(Math.max(1, lessons.length) * 0.6)
      for (const n of c.nodes) {
        n.done = !!completed[n.id]
        n.rec = completed[n.id]
        n.min = minutesOf(n.lesson)
        const chapterLock = !chapterOpen
        const testLock = n.kind === 'test' && lessons.length > 0 && doneL < need
        n.locked = chapterLock || testLock
        n.need = n.kind === 'test' && !chapterLock ? Math.max(0, need - doneL) : 0
      }
      c.done = c.nodes.length > 0 && c.nodes.every((n) => n.done)
      c.total = c.nodes.length
      c.doneN = c.nodes.filter((n) => n.done).length
      chapterOpen = chapterOpen && c.done
    }

    // Итоговая проверка модуля (если не режим «одна проверка»)
    if (mode !== 'mastered' && chapters.length) {
      const allLessons = chapters.flatMap((c) => c.nodes.filter((n) => n.kind === 'lesson').map((n) => n.lesson))
      if (allLessons.length >= 2) {
        const mt = mixTest(
          `mexit-${m.id}`,
          `Испытание: ${m.title}`,
          `Финальный тест модуля. Сдайте его, чтобы открыть следующий раздел.`,
          allLessons,
          Math.min(10, Math.max(6, allLessons.length)),
          m.color,
          m.id === 'atlas'
        )
        const lessonsDone = allLessons.filter((l) => completed[l.id]).length
        const needL = Math.ceil(allLessons.length * 0.5)
        const exitNode = {
          id: mt.id,
          kind: 'test',
          lesson: { ...mt, kind: 'test', moduleExit: true },
          done: !!completed[mt.id],
          rec: completed[mt.id],
          min: minutesOf(mt),
          locked: lessonsDone < needL,
          need: Math.max(0, needL - lessonsDone),
        }
        chapters.push({
          id: `exit-${m.id}`,
          title: 'Испытание модуля',
          blurb: 'Открывает следующий раздел',
          open: chapterOpen,
          nodes: [exitNode],
          done: exitNode.done,
          total: 1,
          doneN: exitNode.done ? 1 : 0,
        })
      }
    }

    const nodes = chapters.flatMap((c) => c.nodes)
    const doneN = nodes.filter((n) => n.done).length
    const done = nodes.length > 0 && doneN === nodes.length
    const isPro = !!m.pro
    const proLock = isPro && !state.pro && !done
    // Обычный модуль закрыт, пока предыдущий не пройден. Pro-модуль у владельца Pro открыт сразу
    // и не тормозит остальные модули.
    const locked = !done && (proLock || (!isPro && !prevDone && !state.unlocked?.[m.id]))
    if (!isPro) prevDone = prevDone && done
    return {
      ...m, index: mi, mode, baseMode: base, note, why: plan.why?.[id] ?? [], mastery: plan.mastery?.[m.skill] ?? null,
      chapters, nodes, doneN, total: nodes.length, done, locked, proLock, lessonCount: nodes.filter((n) => n.kind === 'lesson').length, fullLessonCount: total,
      minutes: nodes.reduce((t, n) => t + (n.done ? 0 : n.min), 0), acc: accOf(state, m.id),
    }
  })

  // Следующий шаг: первый непройденный открытый узел первого открытого модуля (конспект идёт первым)
  let next = null
  for (const m of modules) {
    if (m.done || m.locked) continue
    for (const c of m.chapters) {
      const n = c.nodes.find((x) => !x.done && !x.locked)
      if (n) { next = { module: m, chapter: c, node: n }; break }
    }
    if (next) break
  }
  const active = modules.filter((m) => !m.proLock) // закрытый Pro-модуль не считаем в общем прогрессе
  const all = active.flatMap((m) => m.nodes), left = all.filter((n) => !n.done)
  const stages = STAGES.map((s) => ({ ...s, modules: modules.filter((m) => m.stage === s.id) })).filter((s) => s.modules.length)

  // Слабое место: модуль с худшей фактической точностью (минимум 10 ответов) либо с самой низкой оценкой по диагностике
  const weak = modules.filter((m) => !m.proLock && m.acc && m.acc.a >= 10 && m.acc.c / m.acc.a < 0.75).sort((a, b) => a.acc.c / a.acc.a - b.acc.c / b.acc.a)[0]
  return {
    plan, modules, stages, next,
    totals: { nodes: all.length, done: all.filter((n) => n.done).length, minutesLeft: left.reduce((t, n) => t + n.min, 0), fullLessons, plannedLessons, skipped: Math.max(0, fullLessons - plannedLessons) },
    focus: weak ? { module: weak, pct: Math.round((weak.acc.c / weak.acc.a) * 100) } : null,
  }
}

// Урок-закрепление по модулю: сначала вопросы из уроков с ошибками, затем остальные
export function reviewLesson(program, moduleId, state) {
  const m = program.modules.find((x) => x.id === moduleId)
  if (!m) return null
  const lessons = m.nodes.filter((n) => n.kind === 'lesson').map((n) => n.lesson)
  const weak = lessons.filter((l) => { const c = state.completed?.[l.id]; return c && c.score < c.total })
  const pool = [...weak, ...lessons.filter((l) => !weak.includes(l))].flatMap((l) => l.questions).filter(noMap)
  const questions = pool.slice(0, 6)
  if (!questions.length) return null
  return { id: `focus-${m.id}`, title: `Закрепление: ${m.title}`, text: `Шесть вопросов из уроков модуля, где у вас было больше всего ошибок.`, review: true, icon: m.icon, color: m.color, questions }
}

// Испытание для досрочного открытия модуля: 10 вопросов из его уроков, проходной балл — 7
export function moduleChallenge(m) {
  const pool = m.chapters.flatMap((c) => c.nodes.filter((n) => n.kind === 'lesson').flatMap((n) => n.lesson.questions))
    .filter((q) => !['map', 'mapid'].includes(q.type))
  const step = Math.max(1, pool.length / 10)
  const questions = Array.from({ length: Math.min(10, pool.length) }, (_, i) => pool[Math.floor(i * step)])
  return { id: `challenge-${m.id}`, title: `Испытание: ${m.title}`, text: `Ответьте верно минимум на 7 вопросов из 10 — модуль «${m.title}» откроется сразу, без прохождения предыдущих.`, test: true, icon: 'trophy', color: m.color, questions, unlocks: m.id }
}


// ───────── Интервальное повторение ─────────
// Индекс вопросов по ключу. Вопросы с карты не повторяем: им нужна карта нужного региона и больше времени.
let qIndex = null
const questionIndex = () => {
  if (qIndex) return qIndex
  qIndex = new Map()
  for (const l of index.values()) for (const q of l.questions) if (!['map', 'mapid'].includes(q.type)) qIndex.set(qKey(q), q)
  // Вопросы конспектов живут только внутри самого конспекта; без них часть ответов никогда не вернулась бы на повторение
  for (const r of Object.values(READS)) for (const q of r.questions || []) if (!['map', 'mapid'].includes(q.type)) qIndex.set(qKey(q), varyQuestion(q))
  return qIndex
}
export const reviewDue = (state) => {
  const idx = questionIndex()
  return dueKeys(state.srs, today()).filter((k) => idx.has(k)).length
}
/** Урок повторения: вопросы, срок которых пришёл (самые просроченные и слабые первыми). null, если повторять нечего. */
export function srsLesson(state, n = 8) {
  const idx = questionIndex()
  const keys = dueKeys(state.srs, today()).filter((k) => idx.has(k)).slice(0, n)
  if (!keys.length) return null
  const questions = keys.map((k) => idx.get(k))
  return { id: 'srs-review', srsReview: true, review: true, title: 'Повторение', text: `Вопросы, которые пора повторить: ${questions.length}. Верные ответы отодвигают следующий повтор, ошибки вернут вопрос на завтра.`, icon: 'repeat', color: '#16a34a', questions }
}
// Сводка по навыкам для диагностики и рекомендаций
export const skillsReport = (state) => skillHealth(state.srs, today())
export { MIN_EVIDENCE, dueCount }
