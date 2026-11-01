import { buildProgram, isProgramLesson } from './program'
// test(state) → true, когда достижение получено
const topicLessons = (s) => Object.keys(s.completed).filter(isProgramLesson).length
export const achievements = [
  { id: 'first', icon: 'sprout', title: 'Первый шаг', text: 'Пройдите первый урок', test: (s) => topicLessons(s) >= 1 },
  { id: 'perfect', icon: 'target', title: 'Без ошибок', text: 'Ответьте на все вопросы урока верно', test: (s) => Object.values(s.completed).some((c) => c.score === c.total) },
  { id: 'daily', icon: 'zap', title: 'Вызов принят', text: 'Пройдите ежедневный вызов', test: (s) => Object.keys(s.completed).some((k) => k.startsWith('daily-')) },
  { id: 'xp100', icon: 'award', title: '100 XP', text: 'Наберите 100 XP', test: (s) => s.xp >= 100 },
  { id: 'xp500', icon: 'rocket', title: '500 XP', text: 'Наберите 500 XP', test: (s) => s.xp >= 500 },
  { id: 'xp1000', icon: 'trophy', title: '1000 XP', text: 'Наберите 1000 XP', test: (s) => s.xp >= 1000 },
  { id: 'streak3', icon: 'flame', title: 'Три дня подряд', text: 'Серия занятий 3 дня', test: (s) => s.streak >= 3 },
  { id: 'streak7', icon: 'medal', title: 'Неделя подряд', text: 'Серия занятий 7 дней', test: (s) => s.streak >= 7 },
  { id: 'streak14', icon: 'flame', title: 'Две недели', text: 'Серия занятий 14 дней', test: (s) => s.streak >= 14 },
  { id: 'accurate', icon: 'target', title: 'Меткий', text: 'Точность ответов ≥ 80% (мин. 20)', test: (s) => s.stats.answered >= 20 && s.stats.correct / s.stats.answered >= 0.8 },
  { id: 'mapmaster', icon: 'map', title: 'Картограф', text: 'Пройдите 5 уроков с картой', test: (s) => Object.keys(s.completed).filter((k) => k.includes('map') || k.startsWith('countries')).length >= 1 },
  { id: 'all', icon: 'compass', title: 'Исследователь', text: 'Пройдите всю свою программу', test: (s) => { const p = buildProgram(s); return p.totals.nodes > 0 && p.totals.done >= p.totals.nodes } },
  { id: 'blitz15', icon: 'timer', title: 'Блиц: 15', text: 'Найдите 15 стран за один блиц', test: (s) => (s.records?.blitz ?? 0) >= 15 },
  { id: 'blitz30', icon: 'zap', title: 'Блиц: 30', text: 'Найдите 30 стран за один блиц', test: (s) => (s.records?.blitz ?? 0) >= 30 },
  { id: 'capitals', icon: 'landmark', title: 'Столичный житель', text: 'Пройдите практику «Столицы»', test: (s) => !!s.completed['practice-capitals'] },
  { id: 'pro', icon: 'sparkles', title: 'Pro-путь', text: 'Пройдите углублённое задание', test: (s) => !!s.completed['pro-olympiad'] },
]
