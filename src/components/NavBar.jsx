import { tr } from '../lib/i18n'
import { Icon } from './Icon'

// Стандартные линейные иконки Lucide: узнаваемые, одной толщины штриха.
export const TABS = [
  ['path', 'Путь', 'map'],
  ['blitz', 'Блиц', 'zap'],
  ['rating', 'Рейтинг', 'trophy'],
  ['friends', 'Друзья', 'users'],
  ['profile', 'Профиль', 'user'],
]

// Нижняя навигация. Бейдж на «Друзья» — входящие заявки; на «Профиле» бейджа нет.
export default function NavBar({ tab, setTab, pending = 0 }) {
  return (
    <nav aria-label={tr('Основная навигация')}>
      {TABS.map(([id, label, icon]) => {
        const on = tab === id
        return (
          <button key={id} type="button" className={`nb-item ${on ? 'on' : ''}`} onClick={() => setTab(id)} aria-current={on ? 'page' : undefined}>
            <span className="nb-ico">
              <Icon name={icon} size={24} strokeWidth={2} />
              {id === 'friends' && pending > 0 && <i className="nb-dot" aria-label={`${pending}`}>{pending > 9 ? '9+' : pending}</i>}
            </span>
            <span className="nb-lbl">{tr(label)}</span>
          </button>
        )
      })}
    </nav>
  )
}
