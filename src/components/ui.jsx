import { AvatarArt, parseAv } from './AvatarArt'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Mascot } from './Mascot'
import { Icon } from './Icon'

// Аватар: буква имени или тематическая иконка на цветном фоне. Старые эмодзи-аватары показываются как буква.
export const AV_ICONS = ['globe', 'compass', 'mountain', 'map', 'trees', 'waves', 'sun', 'snow', 'rocket', 'flag', 'telescope', 'anchor']
export const AVATARS = ['letter', ...AV_ICONS.map((i) => `icon:${i}`)]
export const COLORS = ['#16a34a', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#14b8a6', '#64748b', '#0f172a', '#84cc16']
export const GOALS = [
  [10, 'Спокойно', '10 XP в день'],
  [20, 'Размеренно', '20 XP в день'],
  [30, 'Обычно', '30 XP в день'],
  [50, 'Серьёзно', '50 XP в день'],
]
export const GRADES = ['5', '6', '7', '8', '9', '10', '11', 'Студент', 'Взрослый']
export const FRAMES = [
  { id: '', label: 'Без рамки' },
  { id: 'gold', label: 'Золото' },
  { id: 'green', label: 'Зелень' },
  { id: 'blue', label: 'Океан' },
  { id: 'fire', label: 'Огонь' },
]

export const ProgressBar = ({ value, max = 100 }) => (
  <div className="bar"><i style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></div>
)
export const Stat = ({ icon, color, value, label }) => (
  <div className="stat"><Icon name={icon} size={22} style={{ color }} /><b>{value}</b><small>{label}</small></div>
)
const isLight = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return false; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 186 }
export const Avatar = ({ emoji, name, size = 44, color, frame }) => {
  const cfg = parseAv(emoji)
  if (cfg) return <div className={`avatar art ${frame ? `frame-${frame}` : ''}`} style={{ width: size, height: size }}><AvatarArt cfg={cfg} /></div>
  const bg = color || '#16a34a'
  const icon = typeof emoji === 'string' && emoji.startsWith('icon:') ? emoji.slice(5) : null
  const letter = (name || '').trim().charAt(0).toUpperCase()
  return (
    <div className={`avatar ${frame ? `frame-${frame}` : ''}`} style={{ width: size, height: size, fontSize: size * 0.46, background: bg, color: isLight(bg) ? '#0f172a' : '#fff' }}>
      {icon ? <Icon name={icon} size={Math.round(size * 0.5)} /> : letter || <Icon name="globe" size={Math.round(size * 0.5)} />}
    </div>
  )
}
export const ColorPicker = ({ value, onChange }) => (
  <div className="picker colors">
    {COLORS.map((c) => (
      <button type="button" key={c} className={c === value ? 'on' : ''} style={{ background: c }} onClick={() => onChange(c)} aria-label={`Цвет ${c}`} />
    ))}
  </div>
)
// Переключатель из нескольких вариантов: options = [[value, label, icon?]]
export const Segmented = ({ value, options, onChange }) => (
  <div className="seg" role="radiogroup">
    {options.map(([v, label, icon]) => (
      <button type="button" key={v} role="radio" aria-checked={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
        {icon && <Icon name={icon} size={15} />}{label}
      </button>
    ))}
  </div>
)
export const Toggle = ({ on, onChange, label }) => (
  <button type="button" className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label}><i /></button>
)
// Подтверждение вместо confirm(): <Confirm title text ok danger onOk onClose />
// Лист подтверждения. Гас подбирает настроение под ситуацию: опасное действие — переживает, обычное — спокойно думает.
export const Confirm = ({ title, text, ok = 'Подтвердить', danger, mood, onOk, onClose }) => (
  <Sheet onClose={onClose}>
    {(close) => (
      <div className="confirm">
        <Mascot mood={mood || (danger ? 'oops' : 'think')} size={76} className="confirm-gas" />
        <h1>{title}</h1>
        {text && <p className="text">{text}</p>}
        <button className={`btn ${danger ? 'danger' : ''}`} onClick={() => { onOk(); close() }}>{ok}</button>
        <button className="btn ghost" onClick={close}>Отмена</button>
      </div>
    )}
  </Sheet>
)
// Пустое состояние. Гас вместо безликой иконки: настроение выводится из смысла экрана, но его можно задать явно.
const EMPTY_MOOD = { users: 'wave', check: 'happy', search: 'think', cloudoff: 'oops', pin: 'think', trophy: 'cheer' }
export const Empty = ({ icon, mood, title, text, children }) => {
  const m = mood || EMPTY_MOOD[icon]
  return (
    <div className="empty-state">{m ? <Mascot mood={m} size={92} className="empty-gas" /> : <Icon name={icon} size={34} />}<b>{title}</b>{text && <p>{text}</p>}{children}</div>
  )
}
export const AvatarPicker = ({ value, onChange }) => (
  <div className="picker av">
    {AVATARS.map((a) => (
      <button type="button" key={a} className={(a === value || (a === 'letter' && !String(value).startsWith('icon:'))) ? 'on' : ''} onClick={() => onChange(a)} aria-label={a === 'letter' ? 'Буква имени' : `Иконка ${a.slice(5)}`}>
        {a === 'letter' ? <b>Аа</b> : <Icon name={a.slice(5)} size={22} />}
      </button>
    ))}
  </div>
)
export const GoalPicker = ({ value, onChange }) => (
  <div className="goals">
    {GOALS.map(([v, t, s]) => (
      <button type="button" key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}><b>{t}</b><small>{s}</small></button>
    ))}
  </div>
)

// Модальное окно: плавное закрытие, Esc, блокировка прокрутки фона. children = (close) => JSX
export function Sheet({ onClose, children, tall }) {
  const [out, setOut] = useState(false)
  const close = () => { setOut(true); setTimeout(onClose, 220) }
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && close()
    addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', key)
      document.body.style.overflow = ''
    }
  }, [])
  // Портал в body: предки с анимацией/transform ломают position: fixed
  return createPortal(
    <div className={`overlay ${out ? 'out' : ''}`} onClick={close}>
      <div className={`sheet ${tall ? 'tall' : ''} ${out ? 'out' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="icon close" onClick={close} aria-label="Закрыть"><Icon name="x" size={18} /></button>
        {children(close)}
      </div>
    </div>,
    document.body
  )
}
export const Portal = ({ children }) => createPortal(children, document.body)

// Знак бесконечности: в Manrope нет глифа «∞», запасной шрифт сбивает выравнивание — рисуем линией, как иконки
export const Inf = ({ size = 18 }) => (
  <svg className="inf" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" role="img" aria-label="∞">
    <path d="M12 12c-1.8-2.4-3.4-3.8-5.3-3.8a3.8 3.8 0 0 0 0 7.6c1.9 0 3.5-1.4 5.3-3.8zm0 0c1.8 2.4 3.4 3.8 5.3 3.8a3.8 3.8 0 0 0 0-7.6c-1.9 0-3.5 1.4-5.3 3.8z" />
  </svg>
)
