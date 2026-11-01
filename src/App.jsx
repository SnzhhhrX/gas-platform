import Splash from './components/Splash'
import { useEffect, useRef, useState } from 'react'
import { achievements } from './data/achievements'
import { buildProgram } from './data/program'
import { deleteAccount, logout, sessionId } from './lib/auth'
import { viaServer } from './lib/api'
import { play } from './lib/sound'
import { applyTheme, getTheme, setTheme } from './lib/theme'
import { gainXp, heartsOf, isRepeat, useStore } from './lib/store'
import Atlas from './components/Atlas'
import { CHALLENGE, acceptFriend, declineFriend, fetchFriends, fetchSuggestions, fetchUser, requestFriend, searchUsers } from './lib/friends'
import { usernameOf } from './lib/auth'
import { Avatar, Empty } from './components/ui'
import PublicProfile from './components/PublicProfile'
import { FriendChip } from './components/FriendChip'
import { FriendCard, FriendsRace } from './components/FriendCard'
import Auth from './components/Auth'
import Blitz from './components/Blitz'
import NavBar from './components/NavBar'
import { Icon } from './components/Icon'
import { tr, useLang } from './lib/i18n'
import Learn from './components/Learn'
import Lesson from './components/Lesson'
import Placement from './components/Placement'
import { replan } from './lib/plan'
import { totalAnswers } from './lib/srs'
import ProModal from './components/ProModal'
import Admin from './components/Admin'
import Profile from './components/Profile'
import SettingsPage from './components/SettingsPage'
import Leaderboard from './components/Leaderboard'
import { PRACTICE } from './data/practice'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  useLang()
  const [uid, setUid] = useState(sessionId)
  const out = (fn) => () => { fn(); setUid(null) }
  useEffect(() => {
    const add = new URLSearchParams(location.search).get('add')
    if (add) {
      sessionStorage.setItem('gas-invite', add.toLowerCase().slice(0, 20))
      history.replaceState(null, '', location.pathname)
    }
  }, [])
  return uid
    ? <Main key={uid} uid={uid} onLogout={out(logout)} onDelete={out(() => {})} />
    : <Auth onAuth={setUid} />
}

function Main({ uid, onLogout, onDelete }) {
  const { state, ready, sync, unlockModule, finishLesson, finishBlitz, updateProfile, markSeen, setPlacement, loseHeart, setPro, reset } = useStore(uid)
  const [tab, setTab] = useState('path')
  const [lesson, setLesson] = useState(null)
  const [game, setGame] = useState(null)
  const [proOpen, setProOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [redoDiag, setRedoDiag] = useState(false)
  const [toast, setToast] = useState(null)
  const [pending, setPending] = useState(0)
  const [invited, setInvited] = useState(null)
  const [rival, setRival] = useState(null) // вызов от друга: { name, score }
  const sound = state.profile.sound !== false
  const openPro = () => setProOpen(true)

  useEffect(() => {
    const go = () => { if (location.hash === '#admin') setAdminOpen(true) }
    go()
    addEventListener('hashchange', go)
    return () => removeEventListener('hashchange', go)
  }, [])

  const notify = (text, icon = 'lock') => setToast({ icon, text })

  useEffect(() => {
    const t = state.profile.theme
    if (t !== getTheme() && ['auto', 'light', 'dark'].includes(t)) setTheme(t)
  }, [state.profile.theme])

  useEffect(() => {
    const go = (e) => { setRival(e.detail); setGame('blitz') }
    addEventListener(CHALLENGE, go)
    return () => removeEventListener(CHALLENGE, go)
  }, [])

  useEffect(() => {
    if (!viaServer()) return
    const load = () => fetchFriends().then((d) => setPending(d.incoming.length)).catch(() => {})
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const name = sessionStorage.getItem('gas-invite')
    if (!name || !viaServer() || !ready || !state.placement) return
    sessionStorage.removeItem('gas-invite')
    fetchUser(name).then((u) => u.relation !== 'self' && setInvited(u)).catch(() => notify('Игрок из приглашения не найден', 'users'))
  }, [ready, state.placement])

  useEffect(() => {
    const fresh = achievements.filter((a) => a.test(state) && !state.seen.includes(a.id))
    if (!fresh.length) return
    markSeen(fresh.map((a) => a.id))
    play('achieve', sound)
    notify(`Достижение: ${fresh[0].title}`, fresh[0].icon)
  }, [state])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3200)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab, lesson, game, settingsOpen])

  if (!ready) return <Splash />

  if (!state.placement) {
    return (
      <Placement
        onDone={(r, p) => {
          setPlacement(r)
          if (p) updateProfile({ goal: p.xpGoal, grade: p.grade })
        }}
      />
    )
  }

  const retake = () => setPlacement(null)
  const replanNow = () => {
    const r = replan(state)
    if (!r) return notify('Нет исходной диагностики для пересмотра', 'lock')
    const was = state.placement?.plan?.modes ?? {}
    const changed = Object.keys(r.plan.modes).filter((id) => was[id] !== r.plan.modes[id]).length
    setPlacement(r.result)
    notify(changed ? `Программа обновлена: изменилось тем — ${changed}` : 'Программа пересчитана: изменений нет', 'check')
  }

  // Full-screen focus modes — wrapped in ErrorBoundary so a crash never kills the app
  if (game === 'blitz') {
    return (
      <div className="app focus">
        <ErrorBoundary title="Блиц временно недоступен" onRetry={() => setGame(null)}>
          <Blitz record={state.records.blitz} rival={rival} sound={sound} onFinish={finishBlitz} onExit={() => { setGame(null); setRival(null) }} />
        </ErrorBoundary>
      </div>
    )
  }
  if (redoDiag) {
    return (
      <Placement
        seed={(state.placement?.plan?.revision ?? 0) + 1}
        practiceN={totalAnswers(state.srs)}
        onCancel={() => setRedoDiag(false)}
        onDone={(r, p) => {
          setPlacement(r)
          if (p) updateProfile({ goal: p.xpGoal, grade: p.grade })
          setRedoDiag(false)
          notify('Диагностика обновлена', 'check')
        }}
      />
    )
  }
  if (game === 'atlas') {
    return (
      <div className="app focus">
        <ErrorBoundary title="Атлас временно недоступен" onRetry={() => setGame(null)}>
          <Atlas onExit={() => setGame(null)} />
        </ErrorBoundary>
      </div>
    )
  }
  if (lesson) {
    return (
      <div className="app focus">
        <ErrorBoundary title="Урок временно недоступен" onRetry={() => setLesson(null)}>
          <Lesson
            key={lesson.id}
            lesson={lesson}
            repeat={isRepeat(state, lesson)}
            calcXp={(s) => gainXp(state, lesson, s)}
            hearts={heartsOf(state)}
            sound={sound}
            onLoseHeart={loseHeart}
            onOpenPro={openPro}
            onFinish={(l, score, wrong) => {
              finishLesson(l, score, wrong)
              if (l.unlocks && score / (l.questions?.length || 10) >= 0.7) { unlockModule(l.unlocks); notify('Модуль открыт — можно начинать', 'check') }
            }}
            onExit={() => setLesson(null)}
            getNext={() => {
              const nx = buildProgram(state).next
              if (!nx || nx.module.proLock || nx.node.lesson.id === lesson.id) return null
              return { title: nx.node.kind === 'read' ? tr('Конспект') : nx.node.lesson.title, go: () => setLesson(nx.node.lesson) }
            }}
          />
        </ErrorBoundary>
      </div>
    )
  }
  if (settingsOpen) {
    return (
      <div className="app focus">
        <SettingsPage
          uid={uid}
          state={state}
          sync={sync}
          updateProfile={updateProfile}
          openPro={openPro}
          reset={reset}
          retake={retake}
          onReplan={replanNow}
          onRedo={() => { setSettingsOpen(false); setRedoDiag(true) }}
          onLogout={onLogout}
          onDelete={onDelete}
          notify={notify}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <main>
        <div className="page" key={tab}>
          {tab === 'path' && (
            <Learn
              state={state}
              hearts={heartsOf(state)}
              openLesson={setLesson}
              openPro={openPro}
              notify={notify}
            />
          )}
          {tab === 'blitz' && (
            <BlitzHub
              state={state}
              openGame={setGame}
              openLesson={setLesson}
              openPro={openPro}
            />
          )}
          {tab === 'rating' && (
            <Leaderboard uid={uid} onPending={setPending} />
          )}
          {tab === 'friends' && (
            <FriendsPage uid={uid} setPending={setPending} goRating={() => setTab('rating')} />
          )}
          {tab === 'profile' && (
            <Profile
              openAdmin={() => setAdminOpen(true)}
              uid={uid}
              state={state}
              sync={sync}
              notify={notify}
              updateProfile={updateProfile}
              openPro={openPro}
              openSettings={() => setSettingsOpen(true)}
              goTab={setTab}
              pending={pending}
            />
          )}
        </div>
      </main>

      <NavBar tab={tab} setTab={setTab} pending={pending} />

      {invited && <PublicProfile user={invited} onClose={() => setInvited(null)} />}
      {toast && (
        <div className="toast" key={toast.text} role="status">
          <Icon name={toast.icon} size={18} /> {toast.text}
        </div>
      )}
      {adminOpen && (
        <Admin
          onClose={() => {
            setAdminOpen(false)
            if (location.hash === '#admin') history.replaceState(null, '', location.pathname)
          }}
          notify={notify}
        />
      )}
      {proOpen && (
        <ProModal
          pro={state.pro}
          plan={state.proPlan}
          setPro={setPro}
          onClose={() => setProOpen(false)}
          openLesson={setLesson}
        />
      )}
    </div>
  )
}

export function FriendsPage({ uid, setPending, goRating }) {
  const [sort, setSort] = useState('streak')
  const [viewUser, setViewUser] = useState(null)
  const [tab, setTab] = useState('friends')
  const [data, setData] = useState(null)
  const [q, setQ] = useState('')
  const [found, setFound] = useState(null)
  const [sugg, setSugg] = useState([])
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const me = usernameOf(uid)

  const load = () => fetchFriends().then((d) => { setData(d); setPending(d.incoming?.length || 0); return d }).catch((e) => setErr(e.message))
  const online = viaServer()
  useEffect(() => {
    if (!online) return
    load().then((d) => d?.incoming?.length && setTab('requests'))
    fetchSuggestions().then(setSugg).catch(() => {})
  }, [])
  useEffect(() => {
    if (q.trim().length < 2) return setFound(null)
    const t = setTimeout(() => searchUsers(q).then((r) => { setFound(r); setErr('') }).catch((e) => setErr(e.message)), 300)
    return () => clearTimeout(t)
  }, [q])

  // Кнопка меняется сразу (next), при ошибке возвращается прежнее состояние; повторные нажатия игнорируются
  const working = useRef(new Set())
  const run = (fn, id, next) => async () => {
    if (working.current.has(id)) return
    working.current.add(id); setErr('')
    const set = (rel) => { const patch = (l) => l && l.map((u) => (u.id === id ? { ...u, relation: rel } : u)); setFound(patch); setSugg(patch) }
    const prev = [...(found ?? []), ...sugg].find((u) => u.id === id)?.relation
    if (next) set(next)
    try {
      const r = await fn(id)
      set(r.relation ?? next ?? 'none'); await load()
    } catch (e) {
      if (next && prev) set(prev)
      setErr(e.message || 'Не удалось выполнить действие')
    } finally { working.current.delete(id) }
  }
  const invite = async () => {
    const url = `${location.origin}/?add=${me}`
    const text = `Давай учить географию в GAS! Добавь меня: @${me}`
    try {
      if (navigator.share) await navigator.share({ text, url })
      else { await navigator.clipboard.writeText(`${text}\n${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch {}
  }

  return (
    <div className="friends-page">
      <header className="fr-head">
        <div><h1>{tr('Друзья')}</h1><p>{tr('Соревнуйтесь, сравнивайте прогресс, приглашайте')}</p></div>
      </header>

      {!online ? (
        <Empty icon="users" title="Друзья работают с сервером" text="Сейчас приложение запущено без сервера, поэтому поиск и заявки недоступны. Запустите «npm run dev» или «npm run build && npm start» — и друзья появятся." />
      ) : (<>
      <div className="seg" role="tablist" style={{ marginBottom: 16 }}>
        {[['friends', 'Друзья'], ['requests', 'Заявки'], ['find', 'Поиск']].map(([id, label]) => (
          <button key={id} type="button" role="tab" className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {tr(label)}{id === 'requests' && data?.incoming?.length > 0 ? ` · ${data.incoming.length}` : ''}{id === 'friends' && data?.friends?.length > 0 ? ` · ${data.friends.length}` : ''}
          </button>
        ))}
      </div>

      {err && (
        <p className="info" role="alert" style={{ color: 'var(--red)' }}>
          {err}{' '}
          {!data && <button type="button" className="link" onClick={() => { setErr(''); load() }}>Повторить</button>}
        </p>
      )}

      {!data ? (
        !err && <div className="fr-skel" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="card skeleton" style={{ height: 112 }} />)}</div>
      ) : (
        <>
          {tab === 'friends' && (
            data.friends?.length ? (
              <>
                <FriendsRace uid={uid} onAll={goRating} onOpen={setViewUser} />
                <div className="fr-sort" role="group" aria-label={tr('Сортировка')}>
                  {[['streak', 'Серия'], ['xp', 'XP'], ['level', 'Уровень'], ['week', 'Неделя']].map(([id, label]) => (
                    <button key={id} type="button" className={sort === id ? 'on' : ''} aria-pressed={sort === id} onClick={() => setSort(id)}>{tr(label)}</button>
                  ))}
                </div>
                <div className="fr-list">
                  {[...data.friends].sort((a, b) => (b[sort] - a[sort]) || (b.xp - a.xp) || a.name.localeCompare(b.name)).map((u) => <FriendCard key={u.id} u={u} onOpen={setViewUser} />)}
                </div>
              </>
            ) : <Empty icon="users" title="Пока нет друзей" text="Найдите друга по логину или отправьте ему приглашение — и вы сможете соревноваться.">
              <button type="button" className="btn" onClick={() => setTab('find')}>Найти друзей</button>
            </Empty>
          )}
          {tab === 'requests' && (
            data.incoming?.length || data.outgoing?.length ? (
              <>
                {data.incoming?.length > 0 && <h2 className="section-title">{tr('Входящие')}</h2>}
                {data.incoming?.map((u) => (
                  <div key={u.id} className="urow">
                    <button type="button" className="who" onClick={() => setViewUser(u)}>
                      <Avatar emoji={u.avatar} name={u.name} color={u.color} size={44} />
                      <span><b>{u.name}</b><small>@{u.username} · {tr('ур.')} {u.level}</small></span>
                    </button>
                    <div className="acts">
                      <button type="button" className="chip add" onClick={run(acceptFriend, u.id, 'friend')}>Принять</button>
                      <button type="button" className="icon-btn sm" onClick={run(declineFriend, u.id)} aria-label={tr('Отклонить')}><Icon name="x" size={16} /></button>
                    </div>
                  </div>
                ))}
                {data.outgoing?.length > 0 && <h2 className="section-title">{tr('Отправленные')}</h2>}
                {data.outgoing?.map((u) => (
                  <div key={u.id} className="urow">
                    <button type="button" className="who" onClick={() => setViewUser(u)}>
                      <Avatar emoji={u.avatar} name={u.name} color={u.color} size={44} />
                      <span><b>{u.name}</b><small>@{u.username}</small></span>
                    </button>
                    <FriendChip relation="outgoing" onCancel={run(declineFriend, u.id)} />
                  </div>
                ))}
              </>
            ) : <Empty icon="users" title="Нет заявок" text="Входящие и отправленные запросы появятся здесь." />
          )}
          {tab === 'find' && (
            <>
              <label className="search">
                <Icon name="search" size={18} />
                <input className="input" type="search" placeholder={tr('Найти по логину')} value={q} onChange={(e) => setQ(e.target.value)} autoCapitalize="none" autoComplete="off" spellCheck={false} />
              </label>
              {q.trim().length < 2 && <p className="hint">Введите минимум 2 символа логина</p>}
              {q.trim().length >= 2 && Array.isArray(found) && found.length === 0 && (
                <Empty icon="search" title="Никого не нашли" text="Проверьте логин — писать его нужно без @." />
              )}
              {found?.map((u) => (
                <div key={u.id} className="urow">
                  <button type="button" className="who" onClick={() => setViewUser(u)}>
                    <Avatar emoji={u.avatar} name={u.name} color={u.color} size={44} />
                    <span><b>{u.name}</b><small>@{u.username}</small></span>
                  </button>
                  <FriendChip relation={u.relation} onAdd={run(requestFriend, u.id, 'outgoing')} onCancel={run(declineFriend, u.id, 'none')} onAccept={run(acceptFriend, u.id, 'friend')} />
                </div>
              ))}
              <div className="fr-share">
                <span><b>{tr('Пригласить друзей')}</b><small>{me ? `@${me}` : tr('Отправьте ссылку со своим логином')}</small></span>
                <button type="button" className="chip" onClick={invite}><Icon name={copied ? 'check' : 'share'} size={14} />{copied ? tr('Скопировано') : tr('Поделиться')}</button>
              </div>
              {sugg?.length > 0 && !q && (
                <>
                  <h2 className="section-title">Рекомендации</h2>
                  {sugg.map((u) => (
                    <div key={u.id} className="urow">
                      <button type="button" className="who" onClick={() => setViewUser(u)}>
                        <Avatar emoji={u.avatar} name={u.name} color={u.color} size={44} />
                        <span><b>{u.name}</b><small>@{u.username}</small></span>
                      </button>
                      <FriendChip relation={u.relation} onAdd={run(requestFriend, u.id, 'outgoing')} onCancel={run(declineFriend, u.id, 'none')} onAccept={run(acceptFriend, u.id, 'friend')} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}
      </>)}
      {viewUser && <PublicProfile uid={uid} user={viewUser} onClose={() => setViewUser(null)} onChange={load} />}
    </div>
  )
}

/** Blitz tab — hub for speed practice and related modes */
function BlitzHub({ state, openGame, openLesson, openPro }) {
  const isPro = !!state.pro
  return (
    <div className="blitz-hub">
      <header className="page-head">
        <h1>{tr('Блиц')}</h1>
        <p className="page-sub">{tr('Скорость и короткие тренировки')}</p>
      </header>

      <button className="hero-action blitz-hero" onClick={() => openGame('blitz')}>
        <div className="hero-action-visual">
          <Icon name="timer" size={36} />
        </div>
        <div className="hero-action-body">
          <b>{tr('Блиц · 60 секунд')}</b>
          <small>{tr('Как можно больше верных ответов')}</small>
          {state.records.blitz > 0 && <em>Рекорд: {state.records.blitz}</em>}
        </div>
        <Icon name="chevron" size={20} className="hero-chevron" />
      </button>

      <section className="section">
        <h2 className="section-title">{tr('Тренировки')}</h2>
        <div className="action-list">
          {PRACTICE.map(([id, icon, color, title, sub, make]) => (
            <button key={id} className="action-row" onClick={() => openLesson(make())}>
              <span className="action-icon" style={{ '--c': color }}>
                <Icon name={icon} size={20} />
              </span>
              <span className="action-text">
                <b>{title}</b>
                <small>{sub}</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
      </section>

      {!isPro && (
        <button className="pro-strip subtle" onClick={openPro}>
          <Icon name="crown" size={18} />
          <span>Pro-челленджи и олимпиадный модуль</span>
          <Icon name="chevron" size={16} />
        </button>
      )}
    </div>
  )
}
