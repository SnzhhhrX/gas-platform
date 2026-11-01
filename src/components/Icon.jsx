// Иконки GAS: собственный набор (lib/gas-icons.js), без внешних библиотек.
// Язык: мягкая подложка + плотные акценты + скруглённые линии, цвет только currentColor.
import { GAS_ICONS } from '../lib/gas-icons'

const part = (pt, i) => {
  const [k, a, b, c] = pt
  if (k === 's') return <path key={i} d={a} fill="currentColor" fillOpacity=".28" />
  if (k === 'p') return <path key={i} d={a} fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  if (k === 'l') return <path key={i} d={a} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  if (k === 'c') return <circle key={i} cx={a} cy={b} r={c} fill="currentColor" />
  return <circle key={i} cx={a} cy={b} r={c} fill="currentColor" fillOpacity=".28" />
}

// Правила: три размера — 14 (рядом с мелким текстом), 18 (кнопки, списки, навигация), 24 (акценты).
// Размеры из старого кода приводятся к ближайшему из трёх; крупные иконки в плитках (больше 24) не трогаем.
export const ICON_SIZES = { sm: 14, md: 18, lg: 24 }
const snap = (n) => (n > 24 ? n : n <= 15 ? ICON_SIZES.sm : n <= 21 ? ICON_SIZES.md : ICON_SIZES.lg)
export const Icon = ({ name, size = 18, strokeWidth, fill, ...p }) => {
  const parts = GAS_ICONS[name] ?? GAS_ICONS.globe
  const n = snap(size)
  return <svg width={n} height={n} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...p}>{parts.map(part)}</svg>
}

// Иконка в цветной плитке: единый вид секций, достижений, карточек
export const Tile = ({ name, color = 'var(--green)', size = 48 }) => (
  <span className="tile" style={{ '--c': color, width: size, height: size, borderRadius: size * 0.3 }}>
    <Icon name={name} size={Math.round(size * 0.52)} />
  </span>
)
