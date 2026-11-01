// Реплики Гаса. Чистые функции без случайности: фраза выбирается по номеру вопроса,
// поэтому она не «прыгает» при перерисовке. Все строки идут через tr() в компонентах.
const pick = (arr, n) => arr[Math.abs(n) % arr.length]

const RIGHT = ['Верно!', 'Точно!', 'В цель!', 'Отлично!', 'Так держать!']
const SUPPORT = [
  'Ошибка — часть пути. Теперь этот ответ запомнится.',
  'Бывает! Разбор ниже — и в следующий раз получится.',
  'Почти. Прочитайте пояснение, оно короткое.',
]
const SUPPORT_RUN = 'Не сдавайтесь, я рядом. Подсказка (H) тоже поможет.'

// Реакция на ответ. n — номер вопроса, combo — серия верных подряд, run — неверных подряд.
export function reaction({ ok, n = 0, combo = 0, run = 0, xp = 0 }) {
  if (ok) {
    return { mood: combo >= 3 ? 'cheer' : 'happy', word: pick(RIGHT, n), combo: combo >= 3 ? combo : 0, xp, note: '' }
  }
  return { mood: 'oops', word: 'Не совсем', combo: 0, xp: 0, note: run >= 2 ? SUPPORT_RUN : pick(SUPPORT, n) }
}

// Итог урока.
export function resultLine(stars, score, total) {
  if (stars === 3) return { mood: 'proud', head: 'Безупречно!', note: 'Все ответы верные. Вы в отличной форме.' }
  if (stars === 2) return { mood: 'cheer', head: 'Отличный результат!', note: 'Ошибки сохранены — их можно повторить на главной.' }
  if (stars === 1) return { mood: 'happy', head: 'Хорошее начало!', note: 'С каждым разом будет легче. Повторите ошибки на главной.' }
  return { mood: 'oops', head: 'Сегодня не получилось', note: 'Так бывает. Перечитайте конспект и попробуйте ещё раз.' }
}

// Приветствие на главной. hour — 0–23, streak — дней подряд, doneToday — серия уже засчитана.
export function greeting({ hour = 12, streak = 0, doneToday = false }) {
  const hello = hour < 5 ? 'Доброй ночи!' : hour < 12 ? 'Доброе утро!' : hour < 18 ? 'Добрый день!' : 'Добрый вечер!'
  if (doneToday) return { mood: 'proud', head: hello, note: `Серия ${streak} дн. засчитана. Можно продолжить или отдохнуть.` }
  if (streak > 0) return { mood: 'wave', head: hello, note: `Серия ${streak} дн. — один короткий урок сохранит её.` }
  return { mood: 'wave', head: hello, note: 'Я Гас. Начнём с короткого урока?' }
}
