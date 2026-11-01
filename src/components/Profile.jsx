import { useState } from 'react'
import { achievements } from '../data/achievements'
import { buildProgram } from '../data/program'
import { nameOf } from '../data/world'
import { viaServer } from '../lib/api'
import { emailOf, usernameOf } from '../lib/auth'
import { level, levelProgress, levelTitle, lastDays, liveStreak } from '../lib/store'
import EditProfile from './EditProfile'
import { tr, getLang } from '../lib/i18n'
import { Icon, Tile } from './Icon'
import { Avatar, ProgressBar, Sheet } from './ui'
import { StatTiles, SecHead, TILE_COLORS } from './StatTiles'
import { SKILLS } from '../data/placement'
import { STATUS_LABEL } from '../lib/diagnosis'

const LOC = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US' }
const SINCE = { ru: 'С', kk: 'Басталған күні:', en: 'Since' }
const fmt = (iso) => (getLang() === 'ru'
  ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\d+\s/, '')
  : new Date(iso).toLocaleDateString(LOC[getLang()] ?? 'ru-RU', { month: 'long', year: 'numeric' }))

const Count = ({ v }) => <>{v}</>

// Подробная статистика — только для Pro
const WD_HEAD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
function ProStats({ state, program, goal }) {
  const { answered, correct } = state.stats
  const acc = answered ? Math.round((correct / answered) * 100) : 0
  const cells = lastDays(35).map((d) => ({ ...d, xp: state.activity?.[d.date] ?? 0 }))
  const lead = (new Date(`${cells[0].date}T00:00:00`).getDay() + 6) % 7
  const active = Object.values(state.activity || {}).filter((v) => v > 0)
  const avg = active.length ? Math.round(active.reduce((a, b) => a + b, 0) / active.length) : 0
  const best = Math.max(0, ...active)
  const level = (xp) => (xp <= 0 ? 0 : xp < goal * 0.5 ? 1 : xp < goal ? 2 : 3)
  const d14 = lastDays(14).map((d) => ({ ...d, xp: state.activity?.[d.date] ?? 0 }))
  const peak = Math.max(goal, ...d14.map((d) => d.xp), 1)
  const total14 = d14.reduce((a, d) => a + d.xp, 0)
  const hits = d14.filter((d) => d.xp >= goal).length
  const sections = program.modules
    .filter((m) => m.acc)
    .map((m) => ({ id: m.id, title: m.title, icon: m.icon, color: m.color, n: m.acc.a, pct: Math.round((m.acc.c / m.acc.a) * 100) }))
    .sort((a, b) => a.pct - b.pct)
  const byLesson = {}
  ;(state.mistakes || []).forEach((m) => { if (m.lesson) byLesson[m.lesson] = (byLesson[m.lesson] || 0) + 1 })
  const mist = Object.entries(byLesson).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const tone = (p) => (p >= 80 ? 'ok' : p >= 60 ? 'mid' : 'low')
  const skills = state.placement?.plan?.skills

  return (
    <div className="ps">
      <section className="ps-sec ps-top">
        <div className="ps-ring" style={{ '--p': acc }}><b>{answered ? `${acc}%` : '—'}</b><small>{tr('точность')}</small></div>
        <StatTiles cols={3} items={[['check', '#0ea5e9', answered, tr('ответов')], ['zap', '#f59e0b', avg, tr('XP в день')], ['flame', '#f97316', best, tr('лучший день')]]} />
      </section>

      <section className="ps-sec">
        <SecHead icon="chart" color="#16a34a" aside={`${total14} XP`}>{tr('Динамика · 14 дней')}</SecHead>
        <div className="ps-bars">
          {d14.map((d) => (
            <div key={d.date} className="ps-bc" title={`${d.date}: ${d.xp} XP`}>
              <span className="ps-bt"><i className={d.xp >= goal ? 'hit' : d.xp > 0 ? 'part' : ''} style={{ height: `${Math.max(d.xp ? 8 : 0, (d.xp / peak) * 100)}%` }} /></span>
              <small>{Number(d.date.slice(-2))}</small>
            </div>
          ))}
        </div>
        <p className="ps-note">{`${tr('Цель выполнена')}: ${hits} / 14`}</p>
      </section>

      <section className="ps-sec">
        <SecHead icon="calendar" color="#0ea5e9" aside={`${active.length} ${tr('активных дней')}`}>{tr('Календарь · 5 недель')}</SecHead>
        <div className="ps-cal">
          {WD_HEAD.map((d) => <em key={d}>{d}</em>)}
          {Array.from({ length: lead }, (_, i) => <i key={`b${i}`} className="blank" />)}
          {cells.map((c, i) => (
            <i key={c.date} className={`l${level(c.xp)} ${i === cells.length - 1 ? 'today' : ''}`} title={`${c.date}: ${c.xp} XP`}>
              <span>{Number(c.date.slice(-2))}</span>
            </i>
          ))}
        </div>
      </section>

      {skills && (
        <section className="ps-sec">
          <SecHead icon="target" color="#8b5cf6">{tr('Навыки')}</SecHead>
          <div className="ps-skills">
            {SKILLS.map((k) => {
              const st = skills[k.id]?.status || 'nodata'
              return <div key={k.id} className={`ps-skill st-${st}`} style={{ '--c': k.color }}><span className="ps-name"><Icon name={k.icon} size={16} /><span>{tr(k.title)}</span></span><i>{tr(STATUS_LABEL[st])}</i></div>
            })}
          </div>
        </section>
      )}

      <section className="ps-sec">
        <SecHead icon="map" color="#f59e0b" aside={tr('слабые — сверху')}>{tr('Точность по разделам')}</SecHead>
        {sections.length ? sections.map((m) => (
          <div key={m.id} className="ps-row2" style={{ '--c': m.color }}>
            <span className="ps-name"><Icon name={m.icon} size={16} /><span>{m.title}</span></span>
            <b className={`ps-pct ${tone(m.pct)}`}>{m.pct}%</b>
            <span className="ps-bar"><i className={tone(m.pct)} style={{ width: `${m.pct}%` }} /></span>
          </div>
        )) : <p className="ps-empty">{tr('Пройдите несколько уроков — здесь появится точность по каждому разделу.')}</p>}
      </section>

      <section className="ps-sec">
        <SecHead icon="redo" color="#ef4444" aside={`${(state.mistakes || []).length} ${tr('в памяти')}`}>{tr('Разбор ошибок')}</SecHead>
        {mist.length ? mist.map(([name, n]) => (
          <div key={name} className="ps-row ps-mist"><span className="ps-name"><span>{name}</span></span><b className="ps-pct low">{n}</b></div>
        )) : <p className="ps-empty">{tr('Ошибок нет — так держать!')}</p>}
      </section>
    </div>
  )
}

export default function Profile({
  openAdmin,
  uid,
  state,
  sync,
  updateProfile,
  openPro,
  openSettings,
  goTab,
  notify,
  pending,
}) {
  const [edit, setEdit] = useState(false)
  const [selAch, setSelAch] = useState(null)
  const [tab, setTab] = useState('overview') // overview | stats | ach
  const { profile } = state
  const got = achievements.filter((a) => a.test(state))
  const server = viaServer()
  const username = usernameOf(uid)
  const lp = levelProgress(state.xp)
  const lv = level(state.xp)
  const program = buildProgram(state)
  const { answered, correct } = state.stats
  const accuracy = answered ? Math.round((correct / answered) * 100) : null
  const days = lastDays(7).map((d) => ({ ...d, xp: state.activity[d.date] ?? 0 }))
  const peak = Math.max(state.profile.goal || 20, ...days.map((d) => d.xp), 1)
  const lessonsDone = Object.keys(state.completed || {}).length
  const weekXp = days.reduce((a, d) => a + d.xp, 0)
  const freeMods = program.modules.filter((m) => !m.proLock)
  const modsDone = freeMods.filter((m) => m.done).length

  const [clicks, setClicks] = useState(0)
  const onLogo = () => {
    const n = clicks + 1
    setClicks(n)
    if (n >= 5) {
      setClicks(0)
      openAdmin()
    }
  }

  return (
    <div className="profile-page">
      <aside className="profile-side">
      <header className="profile-hero" style={{ '--pc': profile.color || 'var(--green)' }}>
        <div className="profile-hero-actions">
          <button type="button" className="pa" style={{ '--k': '#16a34a' }} onClick={() => setEdit(true)}><Icon name="edit" size={16} /><span>{tr('Изменить')}</span></button>
          <button type="button" className="pa" style={{ '--k': '#0ea5e9' }} onClick={openSettings} aria-label={tr('Настройки')}><Icon name="settings" size={16} /><span>{tr('Настройки')}</span></button>
        </div>

        <div className="profile-id">
          <button type="button" className="profile-avatar-btn" onClick={onLogo} aria-label={tr('Аватар')}>
            <Avatar emoji={profile.avatar} name={profile.name} color={profile.color} frame={profile.frame} size={88} />
          </button>
          <div className="profile-id-txt">
            <h1 className="profile-name">{profile.name || tr('Географ')}</h1>
            <p className="profile-handle">{username ? `@${username}` : emailOf(uid) || tr('локальный аккаунт')}</p>
            <div className="profile-badges">
              <span className="badge">{tr(levelTitle(state.xp))}</span>
              {state.pro && <span className="badge gold"><Icon name="crown" size={12} /> Pro</span>}
            </div>
          </div>
        </div>

        <StatTiles items={[
          ['award', TILE_COLORS.level, lv, tr('уровень')], ['zap', TILE_COLORS.xp, state.xp, 'XP'], ['flame', TILE_COLORS.streak, liveStreak(state), tr('серия')], ['target', TILE_COLORS.acc, accuracy == null ? null : `${accuracy}%`, tr('точность')],
          ['calendar', TILE_COLORS.week, weekXp, tr('за неделю')], ['timer', TILE_COLORS.blitz, state.records?.blitz ?? 0, tr('блиц')], ['book', TILE_COLORS.lessons, lessonsDone, tr('уроков')], ['trophy', TILE_COLORS.awards, got.length, tr('наград')],
        ]} />

        {server && (
          <p className={`syncline ${sync.error ? 'bad' : ''}`}>
            <Icon name={sync.error ? 'cloudoff' : 'shield'} size={12} />
            {sync.error
              ? tr('Нет связи — на устройстве')
              : sync.at
                ? tr(`Сохранено · ${new Date(sync.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
                : tr('Синхронизация…')}
          </p>
        )}
      </header>

      <section className="profile-level">
        <div className="pf-ring" style={{ '--p': lp }} aria-label={tr('Уровень')}>
          <small>{tr('ур.')}</small>
          <b>{lv}</b>
        </div>
        <div className="pl-body">
          <div className="profile-level-head">
            <span>{tr(levelTitle(state.xp))}</span>
            <span className="profile-level-xp">{lp} / 100 XP</span>
          </div>
          <ProgressBar value={lp} max={100} />
          <p className="profile-level-hint">{tr('Ещё')} {100 - lp} {tr('XP до следующего уровня')}</p>
        </div>
      </section>
      </aside>

      <div className="profile-main">
      <nav className="profile-tabs" role="tablist">
        {[
          ['overview', 'Обзор'],
          ['stats', 'Статистика'],
          ['ach', 'Награды'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'on' : ''}
            onClick={() => setTab(id)}
          >
            {tr(label)}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="profile-panel">
          {!state.pro && (
            <button type="button" className="plink" onClick={openPro}>
              <Icon name="crown" size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span className="plink-txt">
                <b>{tr('GAS Pro')}</b>
                <small>{tr('Безлимит сердец и углублённый модуль')}</small>
              </span>
              <Icon name="chevron" size={16} style={{ flexShrink: 0 }} />
            </button>
          )}

          <SecHead icon="map" color="#16a34a">{tr('Прогресс')}</SecHead>
          <div className="card list profile-mod-list">
            {freeMods.slice(0, 6).map((m) => (
              <div key={m.id} className="row" style={{ '--c': m.color }}>
                <span className="rowt">
                  <Icon name={m.icon} size={16} style={{ color: m.color, flexShrink: 0 }} />
                  <span className="rowt-name">{m.title}</span>
                  <small>{m.doneN}/{m.total}</small>
                </span>
                <ProgressBar value={m.doneN} max={m.total || 1} />
              </div>
            ))}
          </div>

          <div className="profile-meta">
            {profile.country && (
              <span><Icon name="pin" size={13} />{nameOf(profile.country)}</span>
            )}
            {profile.favorite && (
              <span><Icon name="flag" size={13} />{nameOf(profile.favorite)}</span>
            )}
            {state.joined && (
              <span><Icon name="calendar" size={13} />{`${SINCE[getLang()] ?? 'С'} ${fmt(state.joined)}`}</span>
            )}
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="profile-panel profile-stats-panel">
          <StatTiles items={[['zap', TILE_COLORS.xp, state.xp, tr('Всего XP')], ['target', TILE_COLORS.acc, accuracy != null ? `${accuracy}%` : null, tr('Точность')], ['flame', TILE_COLORS.streak, state.bestStreak, tr('Рекорд серии')], ['book', TILE_COLORS.lessons, lessonsDone, tr('Уроков')]]} />

          <SecHead icon="calendar" color="#16a34a">{tr('Неделя')}</SecHead>
          <div className="card chart">
            {days.map((d) => (
              <div key={d.date} className="col">
                <div className="barv">
                  <i className={d.xp >= (state.profile.goal || 20) ? 'hit' : ''} style={{ height: `${(d.xp / peak) * 100}%` }} />
                </div>
                <small>{d.label}</small>
              </div>
            ))}
          </div>
          <p className="cap">{tr('Зелёный — цель')} {state.profile.goal || 20} XP</p>

          {state.pro ? (
            <>
              <SecHead icon="crown" color="#f59e0b" aside="Pro">{tr('Подробная статистика')}</SecHead>
              <ProStats state={state} program={program} goal={state.profile.goal || 20} />
            </>
          ) : (
            <>
          <SecHead icon="list" color="#0ea5e9">{tr('По разделам')}</SecHead>
          <div className="card list profile-mod-list">
            {freeMods.map((m) => (
              <div key={m.id} className="row" style={{ '--c': m.color }}>
                <span className="rowt">
                  <Icon name={m.icon} size={16} style={{ color: m.color, flexShrink: 0 }} />
                  <span className="rowt-name">{m.title}</span>
                  <small>{m.doneN}/{m.total}</small>
                </span>
                <ProgressBar value={m.doneN} max={m.total || 1} />
              </div>
            ))}
          </div>

          {answered > 0 && (
            <div className="profile-acc-card">
              <div className="acc-head"><span>{tr('Ответов:')} <b>{answered}</b></span><span>{tr('Верных:')} <b>{correct}</b></span></div>
              <div className="acc-bar"><i style={{ width: `${accuracy ?? 0}%` }} /></div>
              <small>{accuracy ?? 0}%</small>
            </div>
          )}

            </>
          )}

          {!state.pro && (
            <button type="button" className="card pro" onClick={openPro}>
              <Tile name="crown" color="#fff" />
              <div>
                <b>{tr('Подробная статистика')}</b>
                <small>{tr('Точность по разделам, календарь, разбор ошибок')}</small>
              </div>
              <span className="badge">Pro</span>
            </button>
          )}
        </div>
      )}

      {tab === 'ach' && (
        <div className="profile-panel">
          <h2 className="section-title">{tr('Достижения')} · {got.length}/{achievements.length}</h2>
          <div className="ach-grid">
            {achievements.map((a) => {
              const on = got.some((g) => g.id === a.id)
              return (
                <button type="button" key={a.id} className={`ach ${on ? 'on' : ''}`} onClick={() => setSelAch(a)}>
                  <Tile name={a.icon} color={on ? a.color || '#16a34a' : '#94a3b8'} size={40} />
                  <b>{a.title}</b>
                  <small>{a.text}</small>
                </button>
              )
            })}
          </div>
        </div>
      )}
      </div>

      {selAch && (
        <Sheet onClose={() => setSelAch(null)}>
          {(close) => {
            const on = got.some((g) => g.id === selAch.id)
            return (
              <div className="ach-sheet">
                <Tile name={selAch.icon} color={on ? selAch.color || '#16a34a' : '#94a3b8'} size={72} />
                <h2>{selAch.title}</h2>
                <span className={`ach-status ${on ? 'on' : ''}`}>{on ? tr('Получено') : tr('Ещё не получено')}</span>
                <div className="ach-req"><small>{tr('Условие')}</small><b>{selAch.text}</b></div>
                <button type="button" className="btn ghost" onClick={close}>{tr('Закрыть')}</button>
              </div>
            )
          }}
        </Sheet>
      )}

      {edit && (
        <EditProfile
          profile={profile}
          onSave={(p) => {
            updateProfile(p)
            setEdit(false)
          }}
          onClose={() => setEdit(false)}
        />
      )}
    </div>
  )
}
