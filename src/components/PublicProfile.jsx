import { useEffect, useRef, useState } from 'react'
import { achievements } from '../data/achievements'
import { nameOf } from '../data/world'
import { usernameOf } from '../lib/auth'
import { acceptFriend, blockUser, declineFriend, fetchUser, removeFriend, requestFriend } from '../lib/friends'
import { SentCheck } from './FriendChip'
import { Icon, Tile } from './Icon'
import { Avatar, Portal, ProgressBar } from './ui'
import { StatTiles, SecHead, TILE_COLORS } from './StatTiles'
import { levelTitle } from '../lib/store'
import { tr, getLang } from '../lib/i18n'

// «февраля 2026» (родительный падеж — через формат с числом, затем число убираем)
const LOC = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US' }
const SINCE = { ru: 'С', kk: 'Басталған күні:', en: 'Since' }
const fmt = (ms) => (getLang() === 'ru'
  ? new Date(ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\d+\s/, '').replace(/\s?г\.$/, '')
  : new Date(ms).toLocaleDateString(LOC[getLang()] ?? 'ru-RU', { month: 'long', year: 'numeric' }))

// Профиль другого игрока: вверху — действие с дружбой, ниже — спокойная статистика.
// Отправка заявки меняет кнопку сразу (оптимистично), при ошибке возвращает прежнее состояние.
export default function PublicProfile({ user, uid, onClose, onChange }) {
  const [u, setU] = useState(user)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sure, setSure] = useState(null) // 'remove' | 'block'
  const [mine, setMine] = useState(null) // мои данные с сервера — для сравнения с другом
  const busyRef = useRef(false)
  useEffect(() => { fetchUser(user.id).then((d) => { if (!busyRef.current) setU(d) }).catch(() => {}) }, [user.id])

  useEffect(() => {
    const name = uid && usernameOf(uid)
    if (u.relation === 'friend' && name && !mine) fetchUser(name).then(setMine).catch(() => {})
  }, [u.relation, uid, mine])

  // next — состояние, которое показываем сразу, не дожидаясь сервера
  const act = (fn, next, close) => async () => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setErr('')
    const prev = u.relation
    if (next) setU((x) => ({ ...x, relation: next }))
    try {
      const r = await fn(u.id)
      setU((x) => ({ ...x, relation: r.relation ?? next ?? 'none' })); setSure(null); onChange?.(); close?.()
    } catch (e) {
      setU((x) => ({ ...x, relation: prev })); setErr(e.message || 'Не удалось выполнить действие')
    } finally { busyRef.current = false; setBusy(false) }
  }
  const got = achievements.filter((a) => (u.achievements ?? []).includes(a.id))
  const accN = u.answered ? Math.round((u.correct / u.answered) * 100) : null
  const rel = u.relation

  return (
    <Portal><div className="subpage" role="dialog" aria-label="Профиль игрока">
      <header className="subpage-bar">
        <button type="button" className="icon" onClick={onClose} aria-label="Назад"><Icon name="back" size={20} /></button>
        <h1>Профиль игрока</h1>
      </header>
      <div className="pp pp3">
        <section className="pc pc-id">
          <Avatar emoji={u.avatar} name={u.name} color={u.color} size={84} />
          <h2 className="pp-name"><span>{u.name}</span>{u.pro && <Icon name="crown" size={16} style={{ color: '#f59e0b', flex: 'none' }} />}</h2>
          <p className="pp-handle">@{u.username}</p>
          {u.bio && <p className="pp-bio">{u.bio}</p>}
          <div className="pp2-chips pp2-meta">
            {u.country && <span className="pp2-chip soft"><Icon name="pin" size={14} />{nameOf(u.country)}</span>}
            {u.joined && <span className="pp2-chip soft"><Icon name="calendar" size={14} />{`${SINCE[getLang()] ?? 'С'} ${fmt(u.joined)}`}</span>}
            {u.today && <span className="pp2-chip live"><Icon name="flame" size={14} />Занимался сегодня</span>}
          </div>
          <div className="pc-level">
            <div className="pc-level-h"><b>{tr(levelTitle(u.xp))}</b><span>{u.xp % 100} / 100 XP</span></div>
            <ProgressBar value={u.xp % 100} max={100} />
          </div>
        </section>

        {rel !== 'self' && (
          <div className="pp-act" aria-live="polite">
            {rel === 'none' && <button key="none" className="btn" onClick={act(requestFriend, 'outgoing')} disabled={busy}><Icon name="userplus" size={17} /> Добавить в друзья</button>}
            {rel === 'outgoing' && (
              <div key="out" className="pp-sent">
                <span className="btn ghost sent" role="status"><SentCheck size={18} /> Заявка отправлена</span>
                <button type="button" className="pp-link" onClick={act(declineFriend, 'none')} disabled={busy}>Отменить заявку</button>
              </div>
            )}
            {rel === 'incoming' && (
              <div key="in" className="duo">
                <button className="btn" onClick={act(acceptFriend, 'friend')} disabled={busy}>Принять</button>
                <button className="btn ghost" onClick={act(declineFriend, 'none')} disabled={busy}>Отклонить</button>
              </div>
            )}
            {rel === 'friend' && (
              <div key="fr" className="pp-sent">
                <span className="btn ghost sent" role="status"><SentCheck size={18} /> Вы друзья</span>
                {sure === 'remove'
                  ? <button type="button" className="pp-link danger" onClick={act(removeFriend, 'none')} disabled={busy}>Точно удалить?</button>
                  : <button type="button" className="pp-link" onClick={() => setSure('remove')}>Удалить из друзей</button>}
              </div>
            )}
          </div>
        )}
        {err && <p className="error pp-err" role="alert">{err}</p>}

        <StatTiles items={[
          ['award', TILE_COLORS.level, u.level, 'уровень'], ['zap', TILE_COLORS.xp, u.xp, 'XP'], ['flame', TILE_COLORS.streak, u.streak, 'серия'], ['target', TILE_COLORS.acc, accN == null ? null : `${accN}%`, 'точность'],
          ['calendar', TILE_COLORS.week, u.week, 'за неделю'], ['timer', TILE_COLORS.blitz, u.blitz, 'блиц'], ['book', TILE_COLORS.lessons, u.lessons, 'уроков'], ['trophy', TILE_COLORS.awards, (u.achievements ?? []).length, 'наград'],
        ]} />

        <section className="pc">
          <SecHead icon="chart" color="#0ea5e9">Подробнее</SecHead>
          <div className="pp2-rows">
            {[
              ['flame', '#f97316', 'Рекорд серии', `${u.bestStreak ?? 0}`],
              ['calendar', '#16a34a', 'За месяц, XP', `${u.month ?? 0}`],
              ['check', '#0ea5e9', 'Ответов', u.answered ? `${u.answered} · ${u.correct} верных` : '—'],
              u.favorite && ['flag', '#ec4899', 'Любимая страна', nameOf(u.favorite) || u.favorite],
              u.wish && ['plane', '#8b5cf6', 'Хочет посетить', nameOf(u.wish) || u.wish],
            ].filter(Boolean).map(([ic, c, l, v]) => (
              <div key={l} className="pp2-row" style={{ '--k': c }}><span className="pp2-ico"><Icon name={ic} size={16} /></span><span className="pp2-l">{l}</span><b>{v}</b></div>
            ))}
          </div>
        </section>

        {rel === 'friend' && mine && (
          <section className="pc pc-cmp">
            <SecHead icon="users" color="#8b5cf6">Сравнение</SecHead>
            <p className="cmp-legend"><span><i className="me" />Вы</span><span><i />{u.name}</span></p>
            {[['XP', mine.xp, u.xp], ['За неделю', mine.week, u.week], ['Серия, дней', mine.streak, u.streak], ['Уроков', mine.lessons, u.lessons], ['Уровень', mine.level, u.level]].map(([l, a, b]) => {
              const t = Math.max(a, b, 1)
              return (
                <div key={l} className="cmp-row">
                  <small>{l}</small>
                  <div className={`cmp-line me ${a > b ? 'lead' : ''}`}><span className="cmp-tr"><i style={{ width: `${Math.max(3, (a / t) * 100)}%` }} /></span><b>{a}</b></div>
                  <div className={`cmp-line ${b > a ? 'lead' : ''}`}><span className="cmp-tr"><i style={{ width: `${Math.max(3, (b / t) * 100)}%` }} /></span><b>{b}</b></div>
                </div>
              )
            })}
          </section>
        )}

        <section className="pc">
          <SecHead icon="trophy" color="#eab308" aside={`${got.length} / ${achievements.length}`}>Награды</SecHead>
          {got.length ? (
            <div className="pc-awards">{got.map((a) => <span key={a.id} className="pc-aw"><Tile name={a.icon} color="#eab308" size={30} /><span>{a.title}</span></span>)}</div>
          ) : <p className="pp2-empty">Пока нет наград</p>}
        </section>

        {rel !== 'self' && (sure === 'block'
          ? <button type="button" className="pp-link danger" onClick={act(blockUser, null, onClose)} disabled={busy}>Точно заблокировать?</button>
          : <button type="button" className="pp-link" onClick={() => setSure('block')}><Icon name="ban" size={13} /> Заблокировать</button>)}
      </div>
    </div></Portal>
  )
}
