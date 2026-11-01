import { ListSkeleton } from './Skeleton'
import { useEffect, useRef, useState } from 'react'
import { usernameOf } from '../lib/auth'
import { acceptFriend, declineFriend, fetchFriends, fetchSuggestions, requestFriend, challengeFriend, searchUsers, unblockUser } from '../lib/friends'
import { Icon } from './Icon'
import { SentCheck } from './FriendChip'
import { Avatar, Empty, Portal } from './ui'

const Row = ({ u, onOpen, children }) => (
  <div className="urow">
    <button className="who" onClick={() => onOpen(u)}>
      <Avatar emoji={u.avatar} name={u.name} color={u.color} size={44} />
      <span><b>{u.name}</b><small>@{u.username} · ур. {u.level}{u.streak > 0 && <span className="fl"><Icon name="flame" size={12} />{u.streak}</span>}{u.today && <span className="today">сегодня</span>}</small></span>
    </button>
    <div className="acts">{children}</div>
  </div>
)

// Друзья: список, заявки, поиск и рекомендации
export default function FriendsSheet({ uid, onClose, onOpenUser, onChange }) {
  const [tab, setTab] = useState('friends') // friends | requests | find
  const [data, setData] = useState(null)
  const [q, setQ] = useState('')
  const [found, setFound] = useState(null)
  const [sugg, setSugg] = useState([])
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const me = usernameOf(uid)

  const load = () => fetchFriends().then((d) => { setData(d); return d }).catch((e) => setErr(e.message))
  useEffect(() => { load().then((d) => d?.incoming.length && setTab('requests')); fetchSuggestions().then(setSugg).catch(() => {}) }, [])
  useEffect(() => {
    if (q.trim().length < 2) return setFound(null)
    const t = setTimeout(() => searchUsers(q).then((r) => { setFound(r); setErr('') }).catch((e) => setErr(e.message)), 300)
    return () => clearTimeout(t)
  }, [q])

  // Действие над пользователем: кнопка меняется сразу (next), при ошибке возвращается прежнее состояние
  const working = useRef(new Set())
  const run = (fn, id, next) => async () => {
    if (working.current.has(id)) return
    working.current.add(id); setErr('')
    const set = (rel) => { const patch = (l) => l.map((u) => (u.id === id ? { ...u, relation: rel } : u)); setFound((l) => l && patch(l)); setSugg((l) => patch(l)) }
    const prev = [...(found ?? []), ...sugg].find((u) => u.id === id)?.relation
    if (next) set(next)
    try {
      const r = await fn(id)
      set(r.relation ?? next ?? 'none'); await load(); onChange?.()
    } catch (e) {
      if (next && prev) set(prev)
      setErr(e.message || 'Не удалось выполнить действие')
    } finally { working.current.delete(id) }
  }
  const invite = async () => {
    const url = `${location.origin}/?add=${me}`, text = `Давай учить географию в GAS! Добавь меня: @${me}`
    try { if (navigator.share) await navigator.share({ text, url }); else { await navigator.clipboard.writeText(`${text}\n${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000) } } catch {}
  }

  const add = (u) => (
    u.relation === 'none' ? <button className="chip add" onClick={run(requestFriend, u.id, 'outgoing')}><Icon name="userplus" size={14} />Добавить</button>
    : u.relation === 'outgoing' ? <button key="sent" className="chip sent" onClick={run(declineFriend, u.id, 'none')} aria-label="Заявка отправлена, нажмите чтобы отменить"><SentCheck size={13} />Отправлено</button>
    : u.relation === 'incoming' ? <button className="chip add" onClick={run(acceptFriend, u.id, 'friend')}>Принять</button>
    : <small>Друг</small>
  )
  const nFriends = data?.friends.length ?? 0, nReq = data?.incoming.length ?? 0

  return (
    <Portal><div className="subpage" role="dialog" aria-label="Друзья">
      <header className="subpage-bar">
        <button type="button" className="icon" onClick={onClose} aria-label="Назад"><Icon name="back" size={20} /></button>
        <h1>Друзья</h1>
      </header>
        <div className="fsheet">
          <div className="tabs">
            <button className={tab === 'friends' ? 'on' : ''} onClick={() => setTab('friends')}>Друзья{nFriends > 0 && ` · ${nFriends}`}</button>
            <button className={tab === 'requests' ? 'on' : ''} onClick={() => setTab('requests')}>Заявки{nReq > 0 && <i className="dot">{nReq}</i>}</button>
            <button className={tab === 'find' ? 'on' : ''} onClick={() => setTab('find')}>Найти</button>
          </div>
          {err && <p className="error" role="alert">{err}</p>}

          {tab === 'friends' && (!data ? <ListSkeleton rows={3} /> : (
            <>
              {data.friends.map((u) => <Row key={u.id} u={u} onOpen={onOpenUser}><button className="chip duel" onClick={() => challengeFriend(u)} aria-label={`Вызвать на блиц: ${u.name}`}><Icon name="zap" size={14} />Вызов</button></Row>)}
              {!nFriends && <Empty icon="users" title="Пока нет друзей" text="Найдите друга по логину или отправьте ему приглашение."><button className="btn" onClick={() => setTab('find')}>Найти друзей</button></Empty>}
              {data.blocked.length > 0 && (
                <details className="blocked"><summary>Заблокированные · {data.blocked.length}</summary>
                  {data.blocked.map((u) => <Row key={u.id} u={u} onOpen={() => {}}><button className="chip" onClick={run(unblockUser, u.id)}>Разблокировать</button></Row>)}
                </details>
              )}
            </>
          ))}

          {tab === 'requests' && data && (
            <>
              {data.incoming.map((u) => (
                <Row key={u.id} u={u} onOpen={onOpenUser}>
                  <button className="chip add" onClick={run(acceptFriend, u.id, 'friend')}><Icon name="check" size={14} />Принять</button>
                  <button className="icon sm" onClick={run(declineFriend, u.id, 'none')} aria-label="Отклонить"><Icon name="x" size={14} /></button>
                </Row>
              ))}
              {data.outgoing.length > 0 && <h2>Отправлено</h2>}
              {data.outgoing.map((u) => <Row key={u.id} u={u} onOpen={onOpenUser}><button className="chip" onClick={run(declineFriend, u.id)}>Отменить</button></Row>)}
              {!nReq && !data.outgoing.length && <Empty icon="check" title="Заявок нет" text="Здесь появятся входящие и отправленные заявки." />}
            </>
          )}

          {tab === 'find' && (
            <>
              <label className="search big"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Логин или имя" aria-label="Поиск игроков" autoFocus /></label>
              {found ? (
                found.length ? found.map((u) => <Row key={u.id} u={u} onOpen={onOpenUser}>{add(u)}</Row>)
                  : <Empty icon="search" title="Никого не нашли" text="Проверьте логин: он указан в профиле друга." />
              ) : (
                <>
                  {me && (
                    <div className="mylogin">
                      <span><small>Ваш логин — назовите его другу</small><b>@{me}</b></span>
                      <button className="chip" onClick={invite}><Icon name={copied ? 'check' : 'share'} size={14} />{copied ? 'Скопировано' : 'Пригласить'}</button>
                    </div>
                  )}
                  {sugg.length > 0 && <h2>Возможные друзья</h2>}
                  {sugg.map((u) => <Row key={u.id} u={u} onOpen={onOpenUser}>{add(u)}</Row>)}
                </>
              )}
            </>
          )}
        </div>
    </div></Portal>
  )
}
