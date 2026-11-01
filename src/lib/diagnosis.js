// Разбор результатов диагностики по навыкам. Чистые функции без зависимостей.
// Главный принцип: по 1–3 вопросам нельзя назвать «процент знаний». Мы называем состояние навыка и всегда указываем,
// на скольких ответах оно основано. Если ответов мало, навык помечается «данных мало» и пропускать по нему материал нельзя.
// «Не знаю» учитывается отдельно: это честный сигнал о пробеле, в отличие от случайного неверного ответа.

export const STATUS_LABEL = {
  strong: 'Уверенно',
  base: 'Основа есть',
  weak: 'Есть пробелы',
  gap: 'Пока не знакомо',
  partial: 'Данных мало',
  nodata: 'Не проверяли',
}

// res: ответы по одному навыку по порядку: [{ level: 'd1'|'d2'|'d3', ok, idk }]
export function classify(res = []) {
  const n = res.length
  const right = res.filter((x) => x.ok).length
  const idk = res.filter((x) => x.idk).length
  const base = { n, right, idk }
  if (n === 0) return { ...base, status: 'nodata', lean: null }
  const lean = right === n ? 'up' : right === 0 ? 'down' : 'mixed'
  if (n < 3) return { ...base, status: 'partial', lean }
  // Три ответа: число верных определяет состояние. Верно на сложных заданиях — «уверенно», только на простых — «основа».
  if (right === 3) return { ...base, status: 'strong', lean }
  if (right === 2) {
    const missedHard = res.some((x) => !x.ok && x.level === 'd3')
    return { ...base, status: 'base', lean, solidCore: missedHard } // solidCore: оба вопроса среднего уровня верны, промах на сложном
  }
  if (right === 1) return { ...base, status: 'weak', lean }
  return { ...base, status: 'gap', lean }
}

// Данные о практике по навыку (lib/srs.js → skillHealth): status 'solid' | 'learning' | 'weak' | 'nodata'
// Практика корректирует диагностику: слабые ответы в уроках понижают, закреплённые вопросы повышают не выше «основа есть».
export function combine(diag, practice) {
  if (!practice || practice.status === 'nodata') return { ...diag, source: diag.n ? 'diagnostic' : 'none' }
  const order = ['gap', 'weak', 'base', 'strong']
  const idx = (st) => order.indexOf(st)
  let status = diag.status
  if (practice.status === 'weak') {
    status = idx(status) > idx('weak') ? 'weak' : status === 'partial' || status === 'nodata' ? 'weak' : status
  } else if (practice.status === 'solid') {
    if (['gap', 'weak', 'partial', 'nodata'].includes(status)) status = 'base'
  }
  return { ...diag, status, source: diag.n ? 'both' : 'practice', practice: { items: practice.items, solid: practice.solid, misses: practice.misses } }
}

// Режим прохождения модуля по состоянию навыка. Пропуск материала возможен только при достаточных основаниях:
//  — «освоено» значит «вместо уроков одна проверка на 8 вопросов»; не сдали — вернём конспекты и уроки;
//  — «ускоренно» — только когда верны оба вопроса среднего уровня.
export function modeFor(st) {
  if (st.status === 'strong') return 'mastered'
  if (st.status === 'base' && st.solidCore) return 'fast'
  return 'full'
}

// Почему этому модулю назначен такой режим — текст для пользователя
export function reasonFor(st) {
  const of = `${st.right} из ${st.n}`
  switch (st.status) {
    case 'strong': return `В диагностике верно ${of}, включая сложные вопросы. Вместо уроков — проверка на 8 вопросов; не сдадите — вернём уроки.`
    case 'base': return st.solidCore ? `Верно ${of}: средний уровень уверенный, сложное не вышло. Оставили ключевые уроки.` : `Верно ${of}: есть неточности. Полный курс.`
    case 'weak': return `Верно ${of}: есть пробелы${st.idk ? `, «не знаю» — ${st.idk}` : ''}. Полный курс.`
    case 'gap': return `Верно 0 из ${st.n}${st.idk ? `, «не знаю» — ${st.idk}` : ''}. Начнём с основ.`
    case 'partial': return `Отвечено только ${st.n} вопр. — этого мало для вывода. Полный курс, уровень уточнится по урокам.`
    default: return 'Тему в диагностике не проверяли. Полный курс, уровень уточнится по урокам.'
  }
}

// Общий уровень старта — только по навыкам, где есть три ответа. Если таких меньше трёх, уровень не назначаем.
export function startLevel(per) {
  const rated = Object.values(per).filter((p) => p.n >= 3 || p.source === 'practice' || p.source === 'both')
  if (rated.length < 3) return { level: 'unknown', rated: rated.length }
  const lo = rated.filter((p) => p.status === 'weak' || p.status === 'gap').length
  const strong = rated.filter((p) => p.status === 'strong').length
  // «Продвинутый» только если уверенно знакомо не меньше половины проверенных тем и нет ни одного явного пробела
  const level = lo >= rated.length / 2 ? 'beginner' : strong >= rated.length / 2 && lo === 0 ? 'advanced' : 'intermediate'
  return { level, rated: rated.length }
}

/** Состояние каждого навыка: диагностика (answers: [{ skill, level, ok, idk }]) + при наличии данные практики (health). */
export function skillStates(answers, skillIds, health = {}) {
  const per = {}
  for (const id of skillIds) {
    const diag = classify(answers.filter((a) => a.skill === id))
    per[id] = combine(diag, health[id])
  }
  return per
}
