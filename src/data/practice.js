// Тренировки: вопросы генерируются заново при каждом запуске из списка стран (INFO + карта).
import { INFO } from './capitals'
import { COUNTRIES, nameOf } from './world'
import { ISLANDS, LEVELS } from './islands'

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)
export const quizPool = COUNTRIES.filter((c) => INFO[c.id])
// Страны крупнее ~4° реально найти на глобусе пальцем
export const findPool = quizPool.filter((c) => c.size >= 4)

// 3 варианта: верный + 2 случайных; возвращает [options, индекс верного]
const withDistractors = (right, all) => {
  const opts = shuffle([right, ...shuffle(all.filter((x) => x !== right)).slice(0, 2)])
  return [opts, opts.indexOf(right)]
}
const base = (id, title, icon, color, text, questions) => ({ id, title, icon, color, text, practice: true, questions })
const caps = quizPool.map((c) => INFO[c.id].cap), names = quizPool.map((c) => nameOf(c.id))

export const capitalsLesson = () => base('practice-capitals', 'Столицы', 'landmark', '#8b5cf6', 'Десять случайных стран — назовите столицу. Каждый раз новый набор.',
  shuffle(quizPool).slice(0, 10).map((c) => {
    const [options, answer] = withDistractors(INFO[c.id].cap, caps)
    return { q: `Столица: ${nameOf(c.id)}`, options, answer, why: `${INFO[c.id].cap} — столица страны ${nameOf(c.id)}.` }
  }))

export const findLesson = () => base('practice-find', 'Найди на карте', 'target', '#ec4899', 'Восемь случайных стран: найдите каждую на глобусе. Подсказка покажет область поиска.',
  shuffle(findPool).slice(0, 8).map((c) => ({ type: 'map', q: `Найдите: ${nameOf(c.id)}`, answer: c.id, region: 'world', why: `Это ${nameOf(c.id)}. Столица — ${INFO[c.id].cap}.` })))

export const identifyLesson = () => base('practice-identify', 'Какая страна?', 'globe', '#0ea5e9', 'Страна выделена на глобусе — выберите её название.',
  shuffle(findPool).slice(0, 8).map((c) => {
    const [options, answer] = withDistractors(nameOf(c.id), names)
    return { type: 'mapid', q: 'Какая страна выделена на карте?', target: c.id, region: 'world', options, answer, why: `Это ${nameOf(c.id)}. Столица — ${INFO[c.id].cap}.` }
  }))

// Острова: настоящие острова (Ява, Сицилия, Калимантан…), а не страны. Уровень сложности выбирается перед игрой.
const islandsOf = (level) => ISLANDS.filter((x) => x.level === level)
const lvName = (level) => LEVELS.find((l) => l[0] === level)?.[1] ?? ''

export const islandsLesson = (level = 1) => base(`practice-islands-${level}`, `Острова · ${lvName(level)}`, 'anchor', '#14b8a6', 'Найдите на глобусе настоящие острова. Подсказка покажет область поиска.',
  shuffle(islandsOf(level)).slice(0, 8).map((c) => ({ type: 'map', shapes: 'islands', q: `Найдите остров ${c.name}`, answer: c.id, region: 'world', why: c.fact })))

export const islandsIdLesson = (level = 1) => base(`practice-islands-id-${level}`, `Какой остров? · ${lvName(level)}`, 'waves', '#06b6d4', 'Остров выделен на глобусе — выберите его название.',
  shuffle(islandsOf(level)).slice(0, 8).map((c) => {
    const [options, answer] = withDistractors(c.name, islandsOf(level).map((x) => x.name))
    return { type: 'mapid', shapes: 'islands', q: 'Какой остров выделен на глобусе?', target: c.id, region: 'world', options, answer, why: c.fact }
  }))

export const capitalsInputLesson = () => base('practice-capitals-input', 'Столицы · ввод', 'edit', '#a855f7', 'Впишите столицу. Регистр не важен.',
  shuffle(quizPool).slice(0, 10).map((c) => ({
    type: 'input',
    q: `Столица страны ${nameOf(c.id)}?`,
    answers: [INFO[c.id].cap, String(INFO[c.id].cap).toLowerCase()],
    why: `${INFO[c.id].cap} — столица ${nameOf(c.id)}.`,
  })))

export const PRACTICE = [
  ['capitals', 'landmark', '#8b5cf6', 'Столицы', '10 вопросов', capitalsLesson],
  ['capitals-in', 'edit', '#a855f7', 'Столицы · ввод', '10 вопросов с клавиатуры', capitalsInputLesson],
  ['find', 'target', '#ec4899', 'Найди на карте', '8 заданий на глобусе', findLesson],
  ['identify', 'globe', '#0ea5e9', 'Какая страна?', '8 заданий на глобусе', identifyLesson],
  // седьмой элемент — перед стартом выбрать уровень сложности
  ['islands', 'anchor', '#14b8a6', 'Острова', 'Ява, Сицилия, Калимантан — найдите на глобусе', islandsLesson, true],
  ['islands-id', 'waves', '#06b6d4', 'Какой остров?', 'Узнайте остров по контуру', islandsIdLesson, true],
]
