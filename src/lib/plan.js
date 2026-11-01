// Персональный план: анкета + результаты диагностики + данные практики → порядок модулей, глубина, темп, цель дня.
// Самооценка («как вы оцениваете знания») на материал не влияет: пропускать темы можно только по ответам и результатам уроков.
import { MODULES, NATURAL_ORDER, buildProgram, moduleById } from '../data/program'
import { SKILLS, skillById } from '../data/placement'
import { skillStates, modeFor, reasonFor, startLevel, STATUS_LABEL } from './diagnosis'
import { skillHealth, totalAnswers } from './srs'
import { today } from './dates'

export const GOALS = [
  {
    id: 'school',
    title: 'Школа и оценки',
    sub: 'Закрепить программу, уверенно отвечать на уроках',
    icon: 'grad',
    name: 'Школьная программа',
  },
  {
    id: 'travel',
    title: 'Путешествия и кругозор',
    sub: 'Страны, столицы, флаги и карта мира',
    icon: 'plane',
    name: 'Кругозор и путешествия',
  },
  {
    id: 'curious',
    title: 'Просто интересно',
    sub: 'Идти туда, где интереснее всего',
    icon: 'sparkles',
    name: 'Свободное изучение',
  },
]

export const SELF = [
  [1, 'Только начинаю', 'Мало что помню со школы'],
  [2, 'Знаю основы', 'Уверенно в простых темах'],
  [3, 'Знаю хорошо', 'Хочу сложных задач'],
]

export const TIME = [
  [10, '10 минут', 'Коротко каждый день'],
  [20, '20 минут', 'Спокойный темп'],
  [30, '30 минут', 'Хороший ритм'],
  [45, '45+ минут', 'Интенсив'],
]

export const INTERESTS = [
  ['nature', 'Природа и климат', 'mountain'],
  ['world', 'Страны и столицы', 'landmark'],
  ['maps', 'Карты и ориентирование', 'map'],
  ['people', 'Люди и экономика', 'users'],
]

export const GRADE_OPTIONS = ['5', '6', '7', '8', '9', '10', '11', 'Студент', 'Взрослый']

const INTEREST_MODULES = {
  nature: ['relief', 'water', 'climate', 'biomes', 'hazards'],
  world: ['regions', 'world', 'continents', 'kazakhstan', 'atlas'],
  maps: ['globe', 'cart', 'atlas'],
  people: ['people', 'eco'],
}

const INTEREST_SKILLS = {
  nature: ['relief', 'water', 'climate', 'nature'],
  world: ['world'],
  maps: ['globe', 'cart'],
  people: ['people'],
}

const GOAL_BOOST = {
  school: { globe: 0.1, cart: 0.1, relief: 0.1, climate: 0.1, people: 0.05 },
  travel: { regions: 0.25, world: 0.3, atlas: 0.3, people: 0.05 },
  curious: { biomes: 0.1, water: 0.05 },
}

// Школьная программа по классам: эти модули поднимаются выше, особенно при цели «Школа и оценки»
const GRADE_MODULES = {
  5: ['globe', 'cart'],
  6: ['relief', 'water', 'climate', 'biomes'],
  7: ['continents', 'biomes', 'regions', 'hazards'],
  8: ['kazakhstan', 'relief', 'climate', 'water'],
  9: ['kazakhstan', 'people', 'eco'],
  10: ['people', 'eco', 'world', 'regions'],
  11: ['world', 'regions', 'eco', 'atlas'],
  'Студент': ['world', 'people', 'eco'],
  'Взрослый': ['world', 'regions', 'atlas'],
}
export const gradeModules = (grade) => GRADE_MODULES[grade] ?? []
const gradeLabel = (grade) => (/^\d+$/.test(grade) ? `${grade} класса` : '')

// Модули, которые диагностика проверяет лишь косвенно (через соседний навык): «освоено» по ним не ставим,
// максимум — ускоренный режим с ключевыми уроками
const INDIRECT = new Set(['hazards', 'continents', 'eco', 'kazakhstan'])
const capIndirect = (mode) => (mode === 'mastered' ? 'fast' : mode === 'fast' ? 'full' : mode)

const PREREQ = {
  cart: ['globe'],
  climate: ['globe'],
  biomes: ['climate', 'relief'],
  water: ['relief'],
  world: ['regions'],
  people: ['regions'],
  kazakhstan: ['regions'],
  hazards: ['relief'],
  continents: ['regions'],
  eco: ['climate'],
  atlas: ['world'],
  olympiad: ['climate', 'cart', 'people'],
}

export const LEVEL_META = {
  unknown: { title: 'Уровень уточнится', desc: 'Ответов пока мало для общего вывода. Уровень по темам станет точнее после первых уроков.', color: '#64748b' },
  beginner: { title: 'Начинающий', desc: 'Начнём с основ: глобус, карта, рельеф.', color: '#16a34a' },
  intermediate: { title: 'Средний', desc: 'База есть: знакомое подтвердим проверкой, слабое пройдём полностью.', color: '#16a34a' },
  advanced: { title: 'Продвинутый', desc: 'Уверенные темы проверим коротко, время уйдёт на пробелы и сложные задачи.', color: '#16a34a' },
}
export { STATUS_LABEL }

export function skillOrder(survey) {
  const first = new Set((survey.interests ?? []).flatMap((i) => INTEREST_SKILLS[i] ?? []))
  const ids = SKILLS.map((s) => s.id)
  return [...ids.filter((id) => first.has(id)), ...ids.filter((id) => !first.has(id))]
}

// Насколько теме нужно внимание: чем слабее и неопределённее навык, тем раньше она в плане
const NEED = { gap: 1, weak: 0.8, partial: 0.55, nodata: 0.5, base: 0.25, strong: 0.1 }
const needOf = (st) => (st.status === 'partial' && st.lean === 'down' ? 0.7 : NEED[st.status] ?? 0.5)

/**
 * Собирает план: анкета + ответы диагностики [{ skill, level, ok, idk }] + (необязательно) данные практики.
 * opts.health — результат skillHealth(srs); opts.revision — номер пересмотра плана.
 */
export function makePlan(survey, answers, opts = {}) {
  const health = opts.health ?? {}
  const per = skillStates(answers, SKILLS.map((s) => s.id), health)
  const lvl = startLevel(per)
  const interests = new Set((survey.interests ?? []).flatMap((i) => INTEREST_MODULES[i] ?? []))
  const boost = GOAL_BOOST[survey.goal] ?? {}
  const goalTitle = GOALS.find((g) => g.id === survey.goal)?.title ?? ''
  const byGrade = new Set(gradeModules(survey.grade))
  const gradeW = survey.goal === 'school' ? 0.3 : 0.12
  // Новичкам важнее естественный порядок тем (от основ к сложному), уверенным — меньше
  const orderW = ({ 1: 0.06, 2: 0.035, 3: 0.025 })[survey.self] ?? 0.035
  const modes = {}
  const why = {}

  // Слабые места — только там, где вывод обоснован: три ответа, либо данные практики
  const weakSpots = SKILLS.filter((s) => {
    const st = per[s.id]
    return st.status === 'weak' || st.status === 'gap' || (st.status === 'partial' && st.lean === 'down' && st.idk > 0)
  }).map((s) => s.id)

  for (const m of MODULES) {
    if (m.pro) { modes[m.id] = 'full'; why[m.id] = ['Доступно в GAS Pro']; continue }
    const st = per[m.skill] ?? { status: 'nodata', n: 0, right: 0, idk: 0 }
    const base = modeFor(st)
    modes[m.id] = INDIRECT.has(m.id) ? capIndirect(base) : base
    const notes = [modes[m.id] === base ? reasonFor(st) : `Тему проверяли косвенно, через навык «${skillById(m.skill)?.title ?? m.skill}» — поэтому ${modes[m.id] === 'fast' ? 'оставили ключевые уроки' : 'полный курс'}.`]
    if (st.practice) notes.push(`Из практики: закреплено ${st.practice.solid} из ${st.practice.items} вопросов.`)
    if (interests.has(m.id)) notes.push('Вы выбрали эту тему.')
    else if (byGrade.has(m.id) && gradeLabel(survey.grade)) notes.push(`Проходят в программе ${gradeLabel(survey.grade)}.`)
    else if ((boost[m.id] ?? 0) >= 0.15) notes.push(`Важно для цели «${goalTitle}».`)
    why[m.id] = notes
  }

  const score = (m) =>
    0.5 * needOf(per[m.skill] ?? { status: 'nodata' }) +
    (interests.has(m.id) ? 0.3 : 0) +
    (boost[m.id] ?? 0) +
    (byGrade.has(m.id) ? gradeW : 0) -
    orderW * NATURAL_ORDER.indexOf(m.id) +
    (modes[m.id] === 'mastered' ? 0.2 : 0)

  // Порядок: предпосылки раньше. Предпосылку можно не проходить, только если она «освоена» (т.е. подтверждена проверкой)
  const done = new Set()
  const order = []
  const left = [...MODULES.filter((m) => !m.pro)]
  const ready = (m) => (PREREQ[m.id] ?? []).every((p) => done.has(p) || modes[p] === 'mastered')
  while (left.length) {
    const pool = left.filter(ready)
    const pick = (pool.length ? pool : left).sort((a, b) => score(b) - score(a))[0]
    order.push(pick.id)
    done.add(pick.id)
    left.splice(left.indexOf(pick), 1)
  }
  for (const m of MODULES) if (m.pro) order.push(m.id)

  const minutes = survey.minutes ?? 20
  const xpGoal = minutes <= 10 ? 10 : minutes <= 20 ? 20 : minutes <= 30 ? 30 : 50
  const names = weakSpots.slice(0, 2).map((id) => skillById(id)?.title || id).join(', ')
  const daily = {
    xpGoal, minutes, focusSkills: weakSpots.slice(0, 3),
    tip: weakSpots.length ? `Сначала уделите внимание: ${names}` : answers.length ? 'Явных пробелов в проверенных темах нет. Повторяйте пройденное, чтобы знания закрепились.' : 'Начните с первого шага, а по ходу уроков программа уточнится.',
  }

  const tested = answers.length > 0
  const plan = {
    v: 5, goal: survey.goal, grade: survey.grade ?? '', minutes, interests: survey.interests ?? [], self: survey.self ?? 2,
    tested, modes, why, order, startLevel: lvl.level, weakSpots, daily, revision: opts.revision ?? 0, practiceN: opts.practiceN ?? 0, createdAt: new Date().toISOString(),
    // Ответы диагностики храним сжато, чтобы можно было пересчитать план по мере обучения
    diag: answers.map((a) => ({ s: a.skill, l: a.level, ok: !!a.ok, i: !!a.idk })),
    skills: Object.fromEntries(Object.entries(per).map(([id, p]) => [id, { status: p.status, n: p.n, right: p.right, idk: p.idk, source: p.source, solidCore: !!p.solidCore }])),
  }

  const prog = buildProgram({ placement: { plan }, completed: {}, acc: {}, pro: false })
  const days = Math.max(1, Math.ceil((prog.totals?.minutesLeft ?? 120) / minutes))
  const score_ = answers.filter((a) => a.ok).length

  return {
    per, plan, prog,
    result: {
      score: score_, total: answers.length, level: lvl.level, startLevel: lvl.level, date: new Date().toISOString(), plan,
      summary: {
        skipped: prog.totals?.skipped ?? 0, lessons: prog.totals?.plannedLessons ?? 0, full: prog.totals?.fullLessons ?? 0,
        checks: MODULES.filter((m) => !m.pro && modes[m.id] === 'mastered').length, // модули, где вместо уроков одна проверка
        minutes: prog.totals?.minutesLeft ?? 0, days, weeks: Math.ceil(days / 7), xpGoal, weakSpots, tip: daily.tip,
      },
    },
  }
}

/**
 * Пересмотр плана по мере обучения: ответы диагностики те же, но добавляются данные практики (интервальное повторение).
 * Возвращает null, если исходной диагностики нет. Результат нужно сохранить через setPlacement(result).
 */
export function replan(state, day = today()) {
  const old = state.placement?.plan
  if (!old) return null
  const survey = { goal: old.goal, grade: old.grade, minutes: old.minutes, interests: old.interests, self: old.self }
  const answers = (old.diag ?? []).map((d) => ({ skill: d.s, level: d.l, ok: d.ok, idk: d.i }))
  return makePlan(survey, answers, { health: skillHealth(state.srs, day), revision: (old.revision ?? 0) + 1, practiceN: totalAnswers(state.srs) })
}

/** Сколько ответов в уроках накоплено с момента последней сборки плана: от этого зависит, есть ли смысл пересматривать. */
export const practiceSince = (state) => Math.max(0, totalAnswers(state.srs) - (state.placement?.plan?.practiceN ?? 0))
export const MIN_NEW_ANSWERS = 20

export const goalName = (plan) => GOALS.find((g) => g.id === plan?.goal)?.name ?? 'Ваша программа'
export const modeLabel = { mastered: 'Освоено', fast: 'Ускоренно', full: 'Полный курс' }
export { skillById, moduleById }
