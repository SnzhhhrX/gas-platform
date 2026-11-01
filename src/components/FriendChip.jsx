import { Icon } from './Icon'

// Галочка, которая «дорисовывается» при появлении
export const SentCheck = ({ size = 16 }) => (
  <svg className="fr-check" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
  </svg>
)

// Чип действия в списках: «Добавить» → «Отправлено» (нажатие отменяет) / «Принять». Клик не всплывает — профиль не открывается.
export function FriendChip({ relation, onAdd, onCancel, onAccept }) {
  const stop = (fn) => (e) => { e.stopPropagation(); fn() }
  if (relation === 'none') return <button type="button" className="chip add" onClick={stop(onAdd)}><Icon name="userplus" size={14} />Добавить</button>
  if (relation === 'outgoing') return <button type="button" key="sent" className="chip sent" onClick={stop(onCancel)} aria-label="Заявка отправлена, нажмите чтобы отменить"><SentCheck size={13} />Отправлено</button>
  if (relation === 'incoming') return <button type="button" className="chip add" onClick={stop(onAccept)}>Принять</button>
  if (relation === 'friend') return <small>Друг</small>
  return null
}
