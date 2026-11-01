import { memo, useEffect, useState } from 'react'
import { fetchLeaderboard } from '../lib/leaderboard'
import { tr } from '../lib/i18n'
import { Icon } from './Icon'
import { Avatar } from './ui'

// Карточка друга: кто это, уровень и прогресс до следующего, серия и XP за неделю. Нажатие — профиль и сравнение.
export const FriendCard = memo(function FriendCard({ u, onOpen }) {
  return (
    <button type="button" className="fcard" onClick={() => onOpen(u)}>
      <span className="fc-av">
        <Avatar emoji={u.avatar} name={u.name} color={u.color} size={48} />
        {u.today && <i className="fc-on" title={tr('Сегодня занимался(ась)')} />}
      </span>
      <span className="fc-main">
        <b className="fc-name"><span>{u.name}</span>{u.pro && <Icon name="crown" size={13} style={{ color: '#f59e0b', flex: 'none' }} />}</b>
        <small>@{u.username} · {tr('ур.')} {u.level}</small>
        <span className="fc-bar" aria-hidden="true"><i style={{ width: `${u.xp % 100}%` }} /></span>
      </span>
      <Icon name="chevron" size={18} className="fc-go" />
      <span className="fc-stats">
        <span><b>{u.xp}</b> XP</span>
        <span className={u.streak > 0 ? 'hot' : ''}><Icon name="flame" size={13} /><b>{u.streak}</b> {tr('дн.')}</span>
        <span><b>+{u.week}</b> {tr('за неделю')}</span>
        <span><b>{u.lessons}</b> {tr('уроков')}</span>
      </span>
    </button>
  )
})

// Гонка недели среди друзей: реальные данные рейтинга (scope=friends, period=week)
export function FriendsRace({ uid, onAll, onOpen }) {
  const [d, setD] = useState(null)
  useEffect(() => {
    let alive = true
    fetchLeaderboard({ scope: 'friends', period: 'week', metric: 'xp' }).then((r) => alive && setD(r)).catch(() => {})
    return () => { alive = false }
  }, [])
  if (!d || d.rows.length < 2) return null
  const top = d.rows.slice(0, 3), max = Math.max(1, top[0].score)
  const mineInTop = top.some((r) => r.id === uid)
  return (
    <section className="frace">
      <header><b>{tr('Гонка недели')}</b><small>{d.resetsIn != null ? `${tr('до финиша')} ${d.resetsIn} ${tr('дн.')}` : ''}</small></header>
      {top.map((r) => (
        <button type="button" key={r.id} className={`fr-row ${r.id === uid ? 'me' : ''}`} onClick={() => r.id !== uid && onOpen(r)} disabled={r.id === uid}>
          <span className="fr-rk">{r.rank}</span>
          <Avatar emoji={r.avatar} name={r.name} color={r.color} size={30} />
          <span className="fr-nm">{r.id === uid ? tr('Вы') : r.name}</span>
          <span className="fr-track"><i style={{ width: `${Math.max(4, (r.score / max) * 100)}%` }} /></span>
          <b>{r.score}</b>
        </button>
      ))}
      <footer>
        <small>{mineInTop ? tr('Вы в тройке — держите темп') : `${tr('Ваше место')}: ${d.me?.rank ?? '—'} ${tr('из')} ${d.me?.total ?? d.rows.length}`}</small>
        <button type="button" className="link-btn" onClick={onAll}>{tr('Весь рейтинг')}</button>
      </footer>
    </section>
  )
}
