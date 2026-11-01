// Тренировки: вопросы генерируются заново при каждом запуске из списка стран (INFO + карта).
import { INFO } from './capitals'
import { COUNTRIES, nameOf } from './world'

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

// Настоящие острова и островные государства (без материковых вроде Катара или Гайаны)
const ISLAND_IDS = new Set([
  '144', '192', '196', '242', '332', '214', '352', '360', '372', '388', '392', '450', '548', '554', '598', '608',
  '626', '780', '826', '044', '090', '304', // Шри-Ланка, Куба, Кипр, Фиджи, Гаити, Доминикана, Исландия, Индонезия, Ирландия, Ямайка, Япония, Мадагаскар, Вануату, Н. Зеландия, ПНГ, Филиппины, В. Тимор, Тринидад, Британия, Багамы, Соломоновы, Гренландия
])
const islandPool0 = quizPool.filter((c) => ISLAND_IDS.has(c.id))
const islandPool = islandPool0.length >= 4 ? islandPool0 : findPool // страховка: урок никогда не бывает пустым
const islandFind = islandPool.filter((c) => c.size >= 3).length >= 8 ? islandPool.filter((c) => c.size >= 3) : islandPool
const islandNames = islandPool.map((c) => nameOf(c.id))

export const islandsLesson = () => base('practice-islands', 'Острова', 'anchor', '#14b8a6', 'Найдите острова и островные государства на глобусе. Подсказка покажет область поиска.',
  shuffle(islandFind).slice(0, 8).map((c) => ({
    type: 'map',
    q: `Найдите остров: ${nameOf(c.id)}`,
    answer: c.id,
    region: 'world',
    why: `${nameOf(c.id)} — островное государство. Столица — ${INFO[c.id].cap}.`,
  })))

export const islandsIdLesson = () => base('practice-islands-id', 'Какой остров?', 'waves', '#06b6d4', 'Остров выделен на глобусе — выберите его название среди других островов.',
  shuffle(islandPool).slice(0, 8).map((c) => {
    const [options, answer] = withDistractors(nameOf(c.id), islandNames)
    return { type: 'mapid', q: 'Какой остров или архипелаг выделен на глобусе?', target: c.id, region: 'world', options, answer, why: `Это ${nameOf(c.id)}. Столица — ${INFO[c.id].cap}.` }
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
  ['islands', 'anchor', '#14b8a6', 'Острова', 'Найдите 8 островов на глобусе', islandsLesson],
  ['islands-id', 'waves', '#06b6d4', 'Какой остров?', 'Угадайте остров по глобусу', islandsIdLesson],
]
