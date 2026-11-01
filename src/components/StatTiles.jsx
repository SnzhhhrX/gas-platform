import { Icon } from './Icon'

// Цветные плитки статистики: иконка, число, подпись. Один вид для своего и чужого профиля и для окна Pro.
// items: [иконка, цвет, значение, подпись]; cols — число колонок (по умолчанию 4).
export function StatTiles({ items, cols = 4 }) {
  return (
    <div className={`xt c${cols}`}>
      {items.map(([icon, color, value, label]) => (
        <div key={label} className="xt-i" style={{ '--k': color }}>
          <span className="xt-ic"><Icon name={icon} size={18} /></span>
          <b>{value ?? '—'}</b>
          <small>{label}</small>
        </div>
      ))}
    </div>
  )
}

// Заголовок раздела с цветной иконкой
export const SecHead = ({ icon, color, children, aside }) => (
  <h2 className="sec2" style={{ '--k': color }}>
    <span className="sec2-ico"><Icon name={icon} size={18} /></span>
    <span className="sec2-t">{children}</span>
    {aside != null && <span className="sec2-aside">{aside}</span>}
  </h2>
)

export const TILE_COLORS = { level: '#8b5cf6', xp: '#f59e0b', streak: '#f97316', acc: '#0ea5e9', week: '#16a34a', blitz: '#ec4899', lessons: '#14b8a6', awards: '#eab308' }
