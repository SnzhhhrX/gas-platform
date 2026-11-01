// Проверка интервального повторения: `node scripts/test-srs.mjs` (входит в `npm test`).
import { record, dueKeys, dueCount, skillHealth, qKey, addDays, INTERVALS, MAX_ITEMS } from '../src/lib/srs.js'
let fails = 0
const ok = (c, m) => { if (!c) { fails++; console.log('  ✗', m) } else console.log('  ✓', m) }
const D0 = '2026-03-01', k = 'a'
let s = record({}, [{ key: k, ok: true, skill: 'globe' }], D0)
ok(s[k].b === 1 && s[k].d === addDays(D0, INTERVALS[1]), 'первый верный ответ: ящик 1, повтор через 2 дня')
s = record(s, [{ key: k, ok: true }], addDays(D0, 1))
ok(s[k].b === 1 && s[k].n === 2, 'досрочный верный ответ ящик не двигает')
s = record(s, [{ key: k, ok: true }], addDays(D0, 2))
ok(s[k].b === 2 && s[k].d === addDays(D0, 2 + INTERVALS[2]), 'верный ответ в срок: ящик 2, интервал растёт')
s = record(s, [{ key: k, ok: false }], addDays(D0, 6))
ok(s[k].b === 0 && s[k].m === 1 && s[k].d === addDays(D0, 7), 'ошибка: ящик 0, повтор завтра')
ok(dueKeys(s, addDays(D0, 6)).length === 0 && dueKeys(s, addDays(D0, 7))[0] === k, 'вопрос появляется в повторении только в срок')
let t = record({}, [{ key: 'x', ok: false }, { key: 'y', ok: false }], D0)
t = record(t, [{ key: 'x', ok: true }], addDays(D0, 1))
t = record({ ...t, y: { ...t.y, d: '2026-02-01' } }, [], D0)
ok(dueKeys(t, addDays(D0, 5))[0] === 'y', 'самый просроченный вопрос идёт первым')
let top = {}; for (let i = 0; i < 5; i++) top = record(top, [{ key: k, ok: true }], addDays(D0, 100 + i * 40))
ok(top[k].b === 5 && top[k].d === addDays(D0, 100 + 4 * 40 + 35), 'потолок: ящик 5 → 35 дней')
let dup = record({}, [{ key: 'z', ok: false }, { key: 'z', ok: true }], D0)
ok(dup.z.n === 1, 'один вопрос дважды в уроке считается один раз')
let big = {}; for (let i = 0; i < MAX_ITEMS + 50; i++) big[`k${i}`] = { b: i % 6, d: D0, n: 1, m: 0, s: 'globe' }
ok(Object.keys(record(big, [], D0)).length === MAX_ITEMS, 'размер хранилища ограничен')
const few = { a: { b: 0, d: D0, n: 1, m: 1, s: 'globe' } }
ok(skillHealth(few, D0).globe.status === 'nodata', 'мало ответов — «недостаточно данных», а не процент')
const many = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`q${i}`, { b: i < 6 ? 4 : 2, d: D0, n: 3, m: 0, s: 'cart' }]))
ok(skillHealth(many, D0).cart.status === 'solid', 'закреплено более половины — «освоено»')
const bad = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`w${i}`, { b: 0, d: D0, n: 2, m: i < 5 ? 2 : 0, s: 'water' }]))
ok(skillHealth(bad, D0).water.status === 'weak', 'частые ошибки — «слабое место»')
ok(qKey({ q: 'Найдите', target: '276' }) !== qKey({ q: 'Найдите', target: '250' }), 'ключ различает цели на карте')
ok(dueCount({}, D0) === 0 && dueKeys(undefined, D0).length === 0, 'пустое хранилище не ломается')
console.log(fails ? `\n${fails} ошибок` : '\nSRS: все проверки пройдены'); process.exit(fails ? 1 : 0)
