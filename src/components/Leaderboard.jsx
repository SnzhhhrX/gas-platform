import { memo, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { viaServer } from '../lib/api'
import { fetchFriends } from '../lib/friends'
import { fetchLeaderboard } from '../lib/leaderboard'
import { tr } from '../lib/i18n'
import FriendsSheet from './FriendsSheet'
import { Icon } from './Icon'
import PublicProfile from './PublicProfile'
import { ListSkeleton } from './Skeleton'
import { Mascot } from './Mascot'
import { Avatar, Empty, Segmented } from './ui'

const TABS = [['all', 'Всё время'], ['week', 'Неделя'], ['month', 'Месяц'], ['blitz', 'Блиц']]
const MEDAL = ['#f59e0b', '#94a3b8', '#c2763d']
const POLL_MS = 30000
const unit = (tab) => (tab === 'blitz' ? 'стран' : 'XP')
const plural = (n, a, b, c) => (n % 10 === 1 && n % 100 !== 11 ? a : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? b : c)
const paramsOf = (scope, tab) => ({ scope, period: tab === 'blitz' ? 'all' : tab, metric: tab === 'blitz' ? 'blitz' : 'xp' })

// Кэш ответов живёт на уровне модуля: возврат на вкладку «Рейтинг» и переключение категорий показывают данные сразу,
// а свежие подтягиваются фоном (stale-while-revalidate). Ключ — пара (область, категория); кэш привязан к аккаунту.
const CACHE = new Map()
const ANIMATED = new Set() // категории, у которых вход уже проигран: фоновое обновление не анимируется
let cacheUid = null

const Row = memo(function Row({ r, i, me, tab, onOpen, clickable }) {
  return (
    <button className={`lrow ${r.id === me ? 'me' : ''}`} style={{ '--i': i }} onClick={() => onOpen(r)} disabled={!clickable || r.id === me}>
      <span className="pos">{r.rank <= 3 ? <Icon name="medal" size={24} style={{ color: MEDAL[r.rank - 1] }} /> : r.rank}</span>
      <Avatar emoji={r.avatar} name={r.name} color={r.color} size={42} />
      <b>
        <span className="nm">{r.name}{r.id === me && ' (вы)'}{r.pro && <Icon name="crown" size={13} style={{ color: '#f59e0b' }} />}{r.relation === 'friend' && <Icon name="users" size={13} style={{ color: '#0ea5e9' }} />}</span>
        <small>{r.username ? `@${r.username}` : ''}{r.streak > 0 && <span className="fl"><Icon name="flame" size={12} />{r.streak}</span>}{r.today && <span className="today">сегодня</span>}</small>
      </b>
      <span className="xpv">{r.score} {unit(tab)}</span>
    </button>
  )
})

export default function Leaderboard({ uid, onPending }) {
  const server = viaServer()
  const [scope, setScope] = useState('all')
  const [tab, setTab] = useState('all')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)
  const [incoming, setIncoming] = useState(0)
  const [view, setView] = useState(null) // { type: 'friends' } | { type: 'user', user }
  const [nonce, reload] = useReducer((n) => n + 1, 0) // ручное обновление
  const [, bump] = useReducer((n) => n + 1, 0) // перерисовка после записи в кэш
  const lastShown = useRef(null)

  if (cacheUid !== uid) { CACHE.clear(); ANIMATED.clear(); cacheUid = uid }
  const ck = `${scope}|${tab}`
  const current = CACHE.get(ck) ?? null
  if (current) lastShown.current = current
  // Пока данные новой категории не пришли, остаётся прежний список (приглушённый): экран не сбрасывается в скелетон
  const data = current ?? lastShown.current
  const fresh = !!current

  // Один эффект на запрос и опрос. Смена категории → cleanup помечает прошлый запрос устаревшим, его ответ не попадёт в состояние.
  useEffect(() => {
    let alive = true
    const run = async () => {
      setBusy(true)
      try {
        const d = await fetchLeaderboard(paramsOf(scope, tab))
        CACHE.set(ck, d) // ответ верен для своего ключа, даже если вкладку уже сменили
        if (alive) { setErr(false); bump() }
      } catch {
        if (alive) setErr(true)
      } finally {
        if (alive) setBusy(false)
      }
    }
    run()
    const t = setInterval(() => { if (!document.hidden) run() }, POLL_MS) // живое обновление без сброса списка
    return () => { alive = false; clearInterval(t) }
  }, [scope, tab, nonce])

  // Заявки в друзья — отдельно от рейтинга: на переключение категорий не влияют
  const loadIncoming = useCallback(() => {
    if (!server) return
    fetchFriends().then((d) => { setIncoming(d.incoming.length); onPending?.(d.incoming.length) }).catch(() => {})
  }, [server, onPending])
  useEffect(() => { loadIncoming() }, [loadIncoming])
  const refresh = useCallback(() => { reload(); loadIncoming() }, [loadIncoming])
  const open = useCallback((u) => setView({ type: 'user', user: u }), [])

  const rows = data?.rows ?? []
  const myRow = data?.me
  const shown = rows.some((r) => r.id === uid)
  const stale = !fresh && !!data
  const enter = fresh && !ANIMATED.has(ck)
  useEffect(() => { if (fresh) ANIMATED.add(ck) }, [fresh, ck])

  let body
  if (err && !fresh) {
    body = <Empty icon="cloudoff" title="Не удалось загрузить" text="Проверьте соединение с сервером."><button className="btn ghost" onClick={reload}>Повторить</button></Empty>
  } else if (!data || (stale && rows.length === 0)) {
    body = <><div className="lb-load"><Mascot mood="think" size={72} /><small>{tr('Загружаем рейтинг…')}</small></div><ListSkeleton rows={6} /></>
  } else if (fresh && scope === 'country' && !data.hasCountry) {
    body = <Empty icon="pin" title="Укажите страну" text="Добавьте страну в профиле, и вы увидите игроков из своей страны." />
  } else if (fresh && scope === 'friends' && rows.length <= 1) {
    body = <Empty icon="users" title="Соревнуйтесь с друзьями" text="Добавьте друзей — их результаты появятся здесь."><button className="btn" onClick={() => setView({ type: 'friends' })}>Найти друзей</button></Empty>
  } else if (rows.length === 0) {
    body = <Empty icon="trophy" title="Пока никого" text={tab === 'blitz' ? 'Сыграйте в блиц — станьте первым!' : 'Пройдите урок — и вы возглавите рейтинг.'} />
  } else {
    body = (
      <>
        {myRow && !shown && <div className="mine"><span className="mine-rank">#{myRow.rank}</span><span><b>{`Вы на ${myRow.rank} месте`}</b><small>{`${myRow.score} ${unit(tab)} · игроков: ${myRow.total}`}</small></span></div>}
        <div className="card board">
          {rows.map((r, i) => <Row key={r.id} r={r} i={Math.min(i, 12)} me={uid} tab={tab} onOpen={open} clickable={server} />)}
          {!shown && myRow && <div className="gap">· · ·</div>}
        </div>
      </>
    )
  }

  return (
    <div className="lb-page">
      <header className="lb-head">
        <div><h1>{tr('Рейтинг')}</h1><p>{tr('Соревнуйтесь и следите за друзьями')}</p></div>
        {server && (
          <button className="icon-btn" onClick={() => setView({ type: 'friends' })} aria-label={tr('Друзья')}>
            <Icon name="userplus" size={20} />{incoming > 0 && <i className="dot">{incoming}</i>}
          </button>
        )}
      </header>
      {!server && <p className="info">Сервер не подключён — видны только аккаунты на этом устройстве. Общий рейтинг работает с сервером: <code>npm run dev</code> {tr('или')} <code>npm run build && npm start</code>.</p>}

      {server && <div className="lb-scope"><Segmented value={scope} onChange={setScope} options={[['all', 'Все'], ['friends', 'Друзья'], ['country', 'Моя страна']]} /></div>}
      <div className="lb-periods" role="tablist">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{tr(label)}</button>)}
      </div>
      {/* Место под индикатор зарезервировано всегда — вёрстка не прыгает */}
      <div className={`lb-refresh ${busy && data ? 'on' : ''}`} role="status" aria-live="polite" aria-label={busy && data ? tr('Обновление') : undefined} />
      {fresh && data?.resetsIn != null && <small className="resets"><Icon name="timer" size={13} /> До обновления {data.resetsIn} {plural(data.resetsIn, 'день', 'дня', 'дней')}</small>}
      {err && fresh && (
        <p className="lb-err" role="alert"><Icon name="cloudoff" size={14} /> {tr('Не удалось обновить')} <button type="button" className="link" onClick={reload}>{tr('Повторить')}</button></p>
      )}

      <div className={`lb-body ${stale ? 'is-stale' : ''} ${enter ? 'enter' : ''}`} aria-busy={busy}>{body}</div>
      {fresh && rows.length > 0 && scope === 'country' && data.hasCountry && <small className="note">Страна игроков указана в профиле.</small>}

      {view?.type === 'friends' && <FriendsSheet uid={uid} onClose={() => { setView(null); refresh() }} onOpenUser={(user) => setView({ type: 'user', user })} onChange={refresh} />}
      {view?.type === 'user' && <PublicProfile uid={uid} user={view.user} onClose={() => setView(null)} onChange={refresh} />}
    </div>
  )
}
