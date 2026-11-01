// Мини-i18n: ключ — русская строка, значение — перевод. Нет перевода → показываем русский.
// Переведён интерфейс (меню, заголовки, кнопки). Уроки переведены через src/lib/auto/*.json.
import { useSyncExternalStore } from 'react'
import { T } from './dict'
import { E } from './dict-en'
import { X } from './dict-extra'
import { G, gasPatterns } from './dict-gas'

const KEY = 'gas-lang'
export const LANGS = [['ru', 'Русский'], ['kk', 'Қазақша'], ['en', 'English']]
let lang = (() => { try { const l = localStorage.getItem(KEY); return LANGS.some((x) => x[0] === l) ? l : 'ru' } catch { return 'ru' } })()
const subs = new Set()
if (typeof document !== 'undefined') document.documentElement.lang = lang

// Автопереводы (scripts/auto-translate.py) подгружаются лениво и только как запасной вариант
const loaded = {}
const loadAuto = (l) => {
  if (l === 'ru' || loaded[l]) return
  loaded[l] = true
  import(`./auto/${l}.json`).then((m) => {
    for (const [ru, t] of Object.entries(m.default)) if (D[l][ru] === undefined) D[l][ru] = t
    subs.forEach((f) => f())
  }).catch(() => { loaded[l] = false })
}
export const getLang = () => lang
export const setLang = (l) => {
  lang = l
  loadAuto(l)
  try { localStorage.setItem(KEY, l) } catch { /* приватный режим */ }
  document.documentElement.lang = l
  subs.forEach((f) => f())
}
export const useLang = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => lang)

const D = { en: {}, kk: {} }
// Запасной автоперевод через сервер (/api/translate): строки, которых нет в словарях, запрашиваются пачками
const API = import.meta.env.VITE_API_URL ?? ''
const asked = new Set()
let queue = [], qTimer
function ask(k) {
  const id = lang + '|' + k
  if (asked.has(id) || !/[А-Яа-яЁё]/.test(k)) return
  asked.add(id); queue.push(k)
  clearTimeout(qTimer); qTimer = setTimeout(flush, 400)
}
async function flush() {
  const l = lang, texts = queue.splice(0, 50)
  if (queue.length) qTimer = setTimeout(flush, 400)
  if (!texts.length) return
  try {
    const r = await fetch(`${API}/api/translate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: l, texts }) })
    const { map } = await r.json()
    let any = false
    for (const [ru, tt] of Object.entries(map || {})) if (D[l][ru] === undefined) { D[l][ru] = tt; any = true }
    if (any) subs.forEach((f) => f())
  } catch { texts.forEach((k) => asked.delete(l + '|' + k)) }
}
const tl = (x) => D.en[x.trim()] ?? x
for (const [ru, en, kk] of T) { D.en[ru] = en; D.kk[ru] = kk }
for (const [ru, en] of E) if (D.en[ru] === undefined) D.en[ru] = en
// Словарь новых уроков и подписей к рисункам: не перезаписывает уже существующие переводы
for (const [ru, en, kk] of X) { if (D.en[ru] === undefined) D.en[ru] = en; if (D.kk[ru] === undefined) D.kk[ru] = kk }
for (const [ru, en, kk] of G) { if (D.en[ru] === undefined) D.en[ru] = en; if (kk != null && D.kk[ru] === undefined) D.kk[ru] = kk }
// Шаблоны с числами: «5 вопр.», «~3 мин»
const PATTERNS = [
  ...gasPatterns((l, x) => D[l][x.trim()] ?? x),
  [/^(\d+) вопр\.$/, { en: '$1 questions', kk: '$1 сұрақ' }],
  [/^~(\d+) мин$/, { en: '~$1 min', kk: '~$1 мин' }],
  [/^Сохранено · (.+)$/, { en: 'Saved · $1', kk: 'Сақталды · $1' }],
  [/^Вы на (\d+) месте$/, { en: 'You are #$1', kk: 'Сіз $1-орындасыз' }],
  [/^(\d+) (XP|стран) · игроков: (\d+)$/, (m, l) => `${m[1]} ${m[2] === 'XP' ? 'XP' : (l === 'en' ? 'countries' : 'ел')} · ${l === 'en' ? 'players' : 'ойыншылар'}: ${m[3]}`],
  [/^(\d+) дн\. подряд$/, { en: '$1-day streak', kk: '$1 күн қатарынан' }],
  [/^(\d+) гл\. · (\d+)\/(\d+)$/, { en: '$1 ch. · $2/$3', kk: '$1 тарау · $2/$3' }],
  [/^(\d+) гл\.$/, { en: '$1 ch.', kk: '$1 тарау' }],
  [/^(\d+) XP в день$/, { en: '$1 XP a day', kk: 'Күніне $1 XP' }],
  [/^(\d+) тем$/, { en: '$1 topics', kk: '$1 тақырып' }],
  [/^Достижение: (.+)$/, (m, l) => `${l === 'en' ? 'Achievement' : 'Жетістік'}: ${D[l][m[1]] ?? m[1]}`],

  // ── English-only шаблоны (казахский пока падает на русский) ──
  ...(() => {
    const en = (re, f) => [re, (m, l) => (l === 'en' ? f(m, (x) => tl(x)) : null)]
    return [
      en(/^· ещё (\d+)$/, (m) => `· ${m[1]} more`),
      en(/^Ещё (\d+) XP$/, (m) => `${m[1]} XP to go`),
      en(/^Серия: (\d+)$/, (m) => `Streak: ${m[1]}`),
      en(/^Сердца: (.+)$/, (m) => `Hearts: ${m[1]}`),
      en(/^(\d+) из 3$/, (m) => `${m[1]} of 3`),
      en(/^Проверка откроется после ещё (\d+) ур\.( в главе)?$/, (m) => `Unlocks after ${m[1]} more lessons`),
      en(/^Вопрос (\d+) из (\d+)$/, (m) => `Question ${m[1]} of ${m[2]}`),
      en(/^Комбо ×(\d+)! \+(\d+) XP$/, (m) => `Combo ×${m[1]}! +${m[2]} XP`),
      en(/^Проверить себя · (\d+) вопр\.$/, (m) => `Check yourself · ${m[1]} questions`),
      en(/^(\d+) ч$/, (m) => `${m[1]} h`),
      en(/^(\d+) ч (\d+) мин$/, (m) => `${m[1]} h ${m[2]} min`),
      en(/^(\d+) мин$/, (m) => `${m[1]} min`),
      en(/^(\d+) гл\. · (\d+) ур\.$/, (m) => `${m[1]} ch. · ${m[2]} lessons`),
      en(/^(\d+) шагов · ≈ (.+)$/, (m, t) => `${m[1]} steps · ≈ ${t(m[2])}`),
      en(/^(\d+) дн\.$/, (m) => `${m[1]} d.`),
      en(/^(\d+) нед\.$/, (m) => `${m[1]} wk.`),
      en(/^(\d+) вопросов$/, (m) => `${m[1]} questions`),
      en(/^(\d+) олимпиадных уроков$/, (m) => `${m[1]} Olympiad lessons`),
      en(/^Олимпиадный модуль · (\d+) уроков$/, (m) => `Olympiad module · ${m[1]} lessons`),
      en(/^Челленджи на время · (\d+)$/, (m) => `Timed challenges · ${m[1]}`),
      en(/^\(вы\)$/, () => '(you)'),
      en(/^· рекорд (\d+)$/, (m) => `· best ${m[1]}`),
      en(/^· занимался\(ась\) сегодня$/, () => '· studied today'),
      en(/^· это устройство$/, () => '· this device'),
      en(/^Столица: (.+)$/, (m, t) => `Capital: ${t(m[1])}`),
      en(/^Верный ответ: (.+)$/, (m, t) => `Correct answer: ${t(m[1])}`),
      en(/^Ошибка −(\d+) с\. Это (.+), столица — (.+)$/, (m, t) => `Wrong −${m[1]} s. It's ${t(m[2])}, capital — ${t(m[3])}`),
      en(/^(.+): вариант (\d+)$/, (m, t) => `${t(m[1])}: option ${m[2]}`),
      en(/^Иконка (.+)$/, (m) => `Icon ${m[1]}`),
      en(/^Цвет (.+)$/, (m) => `Color ${m[1]}`),
      // викторины из practice.js
      en(/^(.+) — столица страны (.+)\.$/, (m, t) => `${t(m[1])} is the capital of ${t(m[2])}.`),
      en(/^(.+) — островное государство\. Столица — (.+)\.$/, (m, t) => `${t(m[1])} is an island nation. Capital — ${t(m[2])}.`),
      en(/^(.+) — столица (.+)\.$/, (m, t) => `${t(m[1])} is the capital of ${t(m[2])}.`),
      en(/^Это (.+)\. Столица — (.+)\.$/, (m, t) => `This is ${t(m[1])}. Capital — ${t(m[2])}.`),
      en(/^Найдите остров: (.+)$/, (m, t) => `Find the island: ${t(m[1])}`),
      en(/^Найдите: (.+)$/, (m, t) => `Find: ${t(m[1])}`),
      en(/^Столица страны (.+)\?$/, (m, t) => `What is the capital of ${t(m[1])}?`),
      // «Столицы мира» и флаги (генерируются шаблонами)
      en(/^Столицы мира · (\d+)$/, (m) => `World capitals · ${m[1]}`),
      en(/^В этом наборе: (.+)\. Запоминайте пары «страна — город» и проговаривайте их вслух(: так связь закрепляется лучше всего)?\.$/, (m, t) => `In this set: ${m[1].split('; ').map((p) => { const i = p.lastIndexOf(' — '); return `${t(p.slice(0, i))} — ${t(p.slice(i + 3))}` }).join('; ')}. Memorize the country–city pairs and say them aloud${m[2] ? ": that's how the link sticks best" : ''}.`),
      en(/^Какой город — столица страны «(.+)»\?$/, (m, t) => `Which city is the capital of ${t(m[1])}?`),
      en(/^Назовите столицу страны «(.+)»$/, (m, t) => `Name the capital of ${t(m[1])}`),
      en(/^«(.+)» — столица какой страны\?$/, (m, t) => `${t(m[1])} is the capital of which country?`),
      en(/^Столица страны «(.+)» — (.+)\.$/, (m, t) => `The capital of ${t(m[1])} is ${t(m[2])}.`),
      en(/^(.+) — столица страны «(.+)»\.$/, (m, t) => `${t(m[1])} is the capital of ${t(m[2])}.`),
      en(/^Это флаг страны «(.+)»\.$/, (m, t) => `This is the flag of ${t(m[1])}.`),
      en(/^Чей это флаг\? · (\d+)\/(\d+)$/, (m) => `Whose flag is this? · ${m[1]}/${m[2]}`),
      en(/^Назовите страну по флагу · (\d+)\/(\d+)$/, (m) => `Name the country by its flag · ${m[1]}/${m[2]}`),
      // программа и план
      en(/^Закрепление: (.+)$/, (m, t) => `Review: ${t(m[1])}`),
      en(/^Испытание: (.+)$/, (m, t) => `Challenge: ${t(m[1])}`),
      en(/^Проверка: (.+)$/, (m, t) => `Check: ${t(m[1])}`),
      en(/^Итоговые вопросы по главе «(.+)»\. Без ошибок — три звезды\.$/, (m, t) => `Final questions for the chapter “${t(m[1])}”. No mistakes — three stars.`),
      en(/^Ключевые понятия главы «(.+)» и (\d+) вопросов на понимание\.$/, (m, t) => `Key concepts of the chapter “${t(m[1])}” and ${m[2]} comprehension questions.`),
      en(/^Точность (\d+)% — вернули все уроки модуля\.$/, (m) => `Accuracy ${m[1]}% — all module lessons restored.`),
      en(/^Точность (\d+)% — убрали повторяющиеся уроки\.$/, (m) => `Accuracy ${m[1]}% — repeated lessons removed.`),
      en(/^Вы уже хорошо знаете тему «(.+)»\. Ответьте на 8 вопросов — и модуль будет засчитан без уроков\. Если выйдет хуже 60%, мы подключим конспекты\.$/, (m, t) => `You already know “${t(m[1])}” well. Answer 8 questions and the module will be counted without lessons. If you score below 60%, we'll add the notes.`),
      en(/^Ответьте верно минимум на 7 вопросов из 10 — модуль «(.+)» откроется сразу, без прохождения предыдущих\.$/, (m, t) => `Answer at least 7 of 10 correctly — the module “${t(m[1])}” opens right away, without completing the previous ones.`),
      en(/^Сначала пройдите испытание модуля «(.+)»$/, (m, t) => `First pass the challenge of the module “${t(m[1])}”`),
      en(/^База есть \((\d+)%\): конспекты и ключевые уроки\.$/, (m) => `Solid base (${m[1]}%): notes and key lessons.`),
      en(/^Тема уже освоена \((\d+)%\): конспекты и ключевые уроки\.$/, (m) => `Topic already mastered (${m[1]}%): notes and key lessons.`),
      en(/^Пока уверенности мало \((\d+)%\): полный курс\.$/, (m) => `Not much confidence yet (${m[1]}%): full course.`),
      en(/^Важно для цели «(.+)»\.$/, (m, t) => `Important for your goal “${t(m[1])}”.`),
      en(/^Сегодня уделите внимание: (.+)$/, (m, t) => `Today, focus on: ${m[1].split(', ').map(t).join(', ')}`),
    ]
  })(),
  // ── Казахские шаблоны (динамические строки) ──
  ...(() => {
    const kk = (re, f) => [re, (m, l) => (l === 'kk' ? f(m, (x) => tl(x)) : null)]
    return [
      kk(/^· ещё (\d+)$/, (m) => `· тағы ${m[1]}`),
      kk(/^Ещё (\d+) XP$/, (m) => `Тағы ${m[1]} XP`),
      kk(/^Серия: (\d+)$/, (m) => `Серия: ${m[1]}`),
      kk(/^Сердца: (.+)$/, (m) => `Жүректер: ${m[1]}`),
      kk(/^(\d+) из 3$/, (m) => `3-тен ${m[1]}`),
      kk(/^Вопрос (\d+) из (\d+)$/, (m) => `${m[2]} сұрақтан ${m[1]}-сұрақ`),
      kk(/^Комбо ×(\d+)! \+(\d+) XP$/, (m) => `Комбо ×${m[1]}! +${m[2]} XP`),
      kk(/^Проверить себя · (\d+) вопр\.$/, (m) => `Өзіңді тексер · ${m[1]} сұрақ`),
      kk(/^(\d+) ч$/, (m) => `${m[1]} сағ`),
      kk(/^(\d+) ч (\d+) мин$/, (m) => `${m[1]} сағ ${m[2]} мин`),
      kk(/^(\d+) мин$/, (m) => `${m[1]} мин`),
      kk(/^(\d+) гл\. · (\d+) ур\.$/, (m) => `${m[1]} тарау · ${m[2]} сабақ`),
      kk(/^(\d+) дн\.$/, (m) => `${m[1]} күн`),
      kk(/^(\d+) нед\.$/, (m) => `${m[1]} апта`),
      kk(/^(\d+) вопросов$/, (m) => `${m[1]} сұрақ`),
      kk(/^\(вы\)$/, () => '(сіз)'),
      kk(/^· рекорд (\d+)$/, (m) => `· рекорд ${m[1]}`),
      kk(/^· это устройство$/, () => '· осы құрылғы'),
      kk(/^Столица: (.+)$/, (m, t) => `Астана: ${t(m[1])}`),
      kk(/^Верный ответ: (.+)$/, (m, t) => `Дұрыс жауап: ${t(m[1])}`),
      kk(/^Найдите: (.+)$/, (m, t) => `Табыңыз: ${t(m[1])}`),
      kk(/^Найдите остров: (.+)$/, (m, t) => `Аралды табыңыз: ${t(m[1])}`),
      kk(/^Столица страны (.+)\?$/, (m, t) => `${t(m[1])} елінің астанасы қандай?`),
      kk(/^Чей это флаг\? · (\d+)\/(\d+)$/, (m) => `Бұл кімнің туы? · ${m[1]}/${m[2]}`),
      kk(/^Назовите страну по флагу · (\d+)\/(\d+)$/, (m) => `Елді ту бойынша атаңыз · ${m[1]}/${m[2]}`),
      kk(/^Закрепление: (.+)$/, (m, t) => `Бекіту: ${t(m[1])}`),
      kk(/^Испытание: (.+)$/, (m, t) => `Сынақ: ${t(m[1])}`),
      kk(/^Проверка: (.+)$/, (m, t) => `Тексеру: ${t(m[1])}`),
      kk(/^Проверка откроется после ещё (\d+) ур\.( в главе)?$/, (m) => `Тағы ${m[1]} сабақтан кейін ашылады`),
      kk(/^(\d+) шагов · ≈ (.+)$/, (m, t) => `${m[1]} қадам · ≈ ${t(m[2])}`),
      kk(/^Глава (\d+) · (.+)$/, (m, t) => `Тарау ${m[1]} · ${t(m[2])}`),
      kk(/^Ещё (\d+) XP до следующего уровня$/, (m) => `Келесі деңгейге тағы ${m[1]} XP`),
      kk(/^Сохранено · (.+)$/, (m) => `Сақталды · ${m[1]}`),
      kk(/^Зелёный — цель (\d+) XP$/, (m) => `Жасыл — мақсат ${m[1]} XP`),
      kk(/^Испытание: (.+)$/, (m, t) => `Сынақ: ${t(m[1])}`),
      kk(/^· ещё (\d+)$/, (m) => `· тағы ${m[1]}`),
    ]
  })(),
]
if (typeof document !== 'undefined') queueMicrotask(() => loadAuto(lang))
export const tr = (s) => D[lang]?.[s] ?? s

// ── Автоперевод DOM: все видимые строки, найденные в словаре, подменяются на лету ──
const orig = new WeakMap(), shown = new WeakMap()
const lead = (s) => s.match(/^\s*/)[0], trail = (s) => s.match(/\s*$/)[0]
function translate(raw) {
  if (lang === 'ru') return raw
  const k = raw.trim(); if (!k) return raw
  let t = D[lang][k]
  if (t === undefined) for (const [re, o] of PATTERNS) { const m = k.match(re); if (m) { t = typeof o === 'function' ? o(m, lang) : k.replace(re, o[lang]); if (t == null) { t = undefined; continue } break } }
  if (t === undefined) { ask(k); return raw }
  return lead(raw) + t + trail(raw)
}
function doText(n) {
  const cur = n.nodeValue
  let o = orig.get(n)
  if (o === undefined || cur !== shown.get(n)) { o = cur; orig.set(n, o) } // React записал новый текст → он и есть оригинал
  const t = translate(o)
  if (cur !== t) n.nodeValue = t
  shown.set(n, t)
}
const ATTRS = ['placeholder', 'aria-label', 'title']
function doAttr(el) {
  for (const a of ATTRS) {
    const cur = el.getAttribute(a); if (cur == null) continue
    const key = '__o_' + a, sk = '__s_' + a
    let o = el[key]
    if (o === undefined || cur !== el[sk]) { o = cur; el[key] = o }
    const t = translate(o)
    if (cur !== t) el.setAttribute(a, t)
    el[sk] = t
  }
}
function walk(root) {
  if (root.nodeType === 3) return doText(root)
  if (root.nodeType !== 1) return
  doAttr(root)
  const w = document.createTreeWalker(root, 1 | 4)
  for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? doText(n) : doAttr(n)
}
if (typeof document !== 'undefined') {
  const mo = new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'characterData') doText(m.target)
      else if (m.type === 'attributes') doAttr(m.target)
      else m.addedNodes.forEach(walk)
    }
  })
  const start = () => { mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); walk(document.body) }
  document.body ? start() : addEventListener('DOMContentLoaded', start)
  subs.add(() => document.body && walk(document.body))
}

// Буква варианта ответа: кириллица в русском и казахском интерфейсе, латиница в английском
export const optLetter = (i) => ((getLang() === 'en' ? 'ABCDEF' : 'АБВГДЕ')[i] ?? String(i + 1))
export { translate as translateText }
