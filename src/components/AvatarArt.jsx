// Собственный стиль аватаров GAS: круглый «геонавт» собирается из частей. Хранится строкой av:12345678
// порядок цифр: кожа, причёска, цвет волос, глаза, рот, аксессуар, фон, одежда
export const SKIN = ['#ffe0c7', '#f6c9a3', '#e2a979', '#c68642', '#8d5524', '#5c3a21']
export const HAIR = ['#2b2118', '#5b3a1e', '#a0561c', '#d4a72c', '#a5321f', '#4b5563']
export const BG = ['#16a34a', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#14b8a6', '#475569']
export const CLOTH = ['#1e3a8a', '#be123c', '#065f46', '#7c3aed', '#b45309', '#0f172a']
export const TABS = [
  { label: 'Фон', i: 6, n: 8 }, { label: 'Кожа', i: 0, n: 6 }, { label: 'Причёска', i: 1, n: 6 }, { label: 'Цвет волос', i: 2, n: 6 },
  { label: 'Глаза', i: 3, n: 4 }, { label: 'Рот', i: 4, n: 4 }, { label: 'Аксессуар', i: 5, n: 6 }, { label: 'Одежда', i: 7, n: 6 },
]
const SIZES = [6, 6, 6, 4, 4, 6, 8, 6]
export const parseAv = (v) => (/^av:\d{8}$/.test(v || '') ? v.slice(3).split('').map(Number).map((x, i) => Math.min(x, SIZES[i] - 1)) : null)
export const encodeAv = (a) => `av:${a.join('')}`
export const randomAv = () => encodeAv(SIZES.map((n) => Math.floor(Math.random() * n)))
export const avBg = (v) => { const c = parseAv(v); return c ? BG[c[6]] : null }

const ink = '#1f2937'
export function AvatarArt({ cfg }) {
  const [s, h, r, e, m, a, b, c] = cfg
  const skin = SKIN[s], hair = HAIR[r]
  const stroke = { stroke: ink, strokeWidth: 2.4, strokeLinecap: 'round', fill: 'none' }
  const eyes = [
    <g key="e"><circle cx="42" cy="46" r="2.6" fill={ink} /><circle cx="58" cy="46" r="2.6" fill={ink} /></g>,
    <g key="e"><path d="M38.5 47.5Q42 42.5 45.5 47.5" {...stroke} /><path d="M54.5 47.5Q58 42.5 61.5 47.5" {...stroke} /></g>,
    <g key="e"><circle cx="42" cy="46" r="4" fill="#fff" /><circle cx="58" cy="46" r="4" fill="#fff" /><circle cx="43" cy="46.5" r="2.2" fill={ink} /><circle cx="59" cy="46.5" r="2.2" fill={ink} /></g>,
    <g key="e"><path d="M38.5 46.5H45.5M54.5 46.5H61.5" {...stroke} /></g>,
  ][e]
  const mouth = [
    <path key="m" d="M43 56Q50 62 57 56" {...stroke} strokeWidth="2.2" />,
    <path key="m" d="M42.5 55Q50 67 57.5 55Z" fill="#7c2d12" />,
    <path key="m" d="M45 58H55" {...stroke} strokeWidth="2.2" />,
    <ellipse key="m" cx="50" cy="58" rx="3" ry="3.6" fill="#7c2d12" />,
  ][m]
  const front = [
    null,
    <path key="h" d="M28 45Q28 21 50 21Q72 21 72 45Q64 33 50 33Q36 33 28 45Z" fill={hair} />,
    <path key="h" d="M28 47Q28 21 50 21Q72 21 72 47Q66 32 50 32Q34 32 28 47Z" fill={hair} />,
    <g key="h" fill={hair}>{[[34, 29, 9], [46, 22, 10], [58, 22, 10], [68, 30, 9], [28, 41, 7], [72, 41, 7]].map(([x, y, q]) => <circle key={x + y} cx={x} cy={y} r={q} />)}</g>,
    <g key="h" fill={hair}><circle cx="50" cy="14" r="9" /><path d="M28 45Q28 21 50 21Q72 21 72 45Q64 33 50 33Q36 33 28 45Z" /></g>,
    <path key="h" d="M28 45L30 24L38 32L44 17L50 30L56 17L62 32L70 24L72 45Q64 34 50 34Q36 34 28 45Z" fill={hair} />,
  ][h]
  const acc = [
    null,
    <g key="a" {...stroke} strokeWidth="2"><circle cx="42" cy="46" r="6.4" /><circle cx="58" cy="46" r="6.4" /><path d="M48.4 46H51.6" /></g>,
    <g key="a"><rect x="34.5" y="41" width="14" height="9.5" rx="4.5" fill="#111827" /><rect x="51.5" y="41" width="14" height="9.5" rx="4.5" fill="#111827" /><path d="M48.5 44H51.5" stroke="#111827" strokeWidth="2" /></g>,
    <g key="a"><ellipse cx="50" cy="33" rx="33" ry="8" fill="#c9a66b" /><path d="M32 33Q32 11 50 11Q68 11 68 33Z" fill="#dcbb83" /><rect x="32" y="26" width="36" height="5.5" fill="#8a5a2b" /></g>,
    <g key="a"><path d="M27 49Q26 20 50 20Q74 20 73 49" {...stroke} stroke={ink} strokeWidth="4" /><rect x="21.5" y="43" width="9" height="16" rx="4" fill={ink} /><rect x="69.5" y="43" width="9" height="16" rx="4" fill={ink} /><rect x="24" y="47" width="4" height="8" rx="2" fill="#38bdf8" /><rect x="72" y="47" width="4" height="8" rx="2" fill="#38bdf8" /></g>,
    null,
  ][a]
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Аватар">
      <rect width="100" height="100" fill={BG[b]} />
      <circle cx="84" cy="16" r="30" fill="#fff" opacity=".14" /><circle cx="12" cy="90" r="20" fill="#000" opacity=".08" />
      {h === 2 && <path d="M26 46Q26 20 50 20Q74 20 74 46L77 80L23 80Z" fill={hair} />}
      <path d="M10 102Q13 70 50 68Q87 70 90 102Z" fill={CLOTH[c]} />
      {a === 5 && <g><circle cx="50" cy="87" r="7.5" fill="#fff" /><path d="M50 80.5L53.2 87L50 93.5L46.8 87Z" fill="#ef4444" /></g>}
      <rect x="43" y="58" width="14" height="14" rx="5" fill={skin} /><path d="M43 66Q50 72 57 66V62H43Z" fill="#000" opacity=".1" />
      <circle cx="28.5" cy="48" r="4.2" fill={skin} /><circle cx="71.5" cy="48" r="4.2" fill={skin} />
      <circle cx="50" cy="46" r="22" fill={skin} />
      <circle cx="37.5" cy="54" r="3.4" fill="#ff7a8a" opacity=".3" /><circle cx="62.5" cy="54" r="3.4" fill="#ff7a8a" opacity=".3" />
      {eyes}{mouth}{front}{acc}
    </svg>
  )
}
