import { useState, useEffect, useRef, useMemo } from 'react'
import { buildProgram, reviewDue, srsLesson } from '../data/program'
import { modeLabel } from '../lib/plan'
import { formatHearts, lastDays, liveStreak, xpFor } from '../lib/store'
import { moduleChallenge } from '../data/program'
import { tr } from '../lib/i18n'
import { GasSays } from './Mascot'
import { greeting } from '../lib/gas'
import { Icon, Tile } from './Icon'
import { Inf, ProgressBar, Sheet } from './ui'

const starsOf = (c) => (c?.score === c?.total ? 3 : c?.score >= (c?.total ?? 1) * 0.6 ? 2 : c?.score > 0 ? 1 : 0)
const KIND = { read: ['bulb', 'Конспект'], lesson: ['star', 'Урок'], test: ['trophy', 'Проверка'] }

// Окошко под узлом: название урока и кнопка «НАЧАТЬ: +N XP»
function LessonPop({ n, idx, color, onStart }) {
  const ref = useRef(null)
  const q = n.lesson.questions?.length || 0
  const full = xpFor(q, q)
  const xp = n.done ? Math.round(full / 2) : full
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Даём кадру отрисоваться, затем мягко центрируем плашку в видимой зоне
    const t = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    })
    return () => cancelAnimationFrame(t)
  }, [])
  return (
    <div className="lp-pop" ref={ref} role="dialog" style={{ '--c': color, '--i': idx }}>
      <b>{n.kind === 'read' ? tr('Конспект') : n.lesson.title}</b>
      <button type="button" className="lp-go" onClick={onStart}>
        {tr(n.done ? 'ПОВТОРИТЬ' : 'НАЧАТЬ')}{q > 0 && `: +${xp} XP`}
      </button>
    </div>
  )
}

function PathNode({ n, color, current, idx, onOpen }) {
  const [icon] = KIND[n.kind]
  const state = n.done ? 'done' : n.locked ? 'lock' : current ? 'cur' : 'open'
  const offset = idx % 2 === 0 ? 'a' : 'b'

  return (
    <li className={`jp-node ${state} ${offset}`} style={{ '--c': color, '--i': idx }}>
      <button
        type="button"
        className="jp-hit"
        onClick={onOpen}
        aria-label={n.lesson.title}
        aria-disabled={n.locked && !current}
      >
        <span className="jp-ring" aria-hidden>
          <span className={`jp-disc ${n.kind}`}>
            {n.done ? <Icon name="check" size={26} strokeWidth={2.8} />
              : n.locked ? <Icon name="lock" size={20} />
              : <Icon name={icon} size={26} strokeWidth={2.2} fill={n.kind === 'lesson' ? 'currentColor' : 'none'} />}
          </span>
        </span>
        {current && <span className="jp-pill">Сейчас</span>}
        {n.done && (
          <span className="jp-stars" aria-label={`${starsOf(n.rec)} из 3`}>
            {[0, 1, 2].map((s) => <i key={s} className={s < starsOf(n.rec) ? 'on' : ''} />)}
          </span>
        )}
      </button>
      <div className="jp-cap">
        <b>{n.kind === 'read' ? tr('Конспект') : n.lesson.title}</b>
        <small>
          {tr(KIND[n.kind][1])}
          {n.lesson.questions?.length ? ` · ${n.lesson.questions.length}` : ''}
          {n.locked && n.need ? ` · ${tr('ещё')} ${n.need}` : ''}
        </small>
      </div>
    </li>
  )
}

export default function Learn({ state, hearts, openLesson, openPro, notify }) {
  const [streakOpen, setStreakOpen] = useState(false)
  const [chal, setChal] = useState(null)
  const program = buildProgram(state)
  const { next, totals, stages } = program
  // Состояние переживает открытие урока: после урока остаёмся в том же модуле и в том же режиме
  const saved = (() => { try { return JSON.parse(sessionStorage.getItem('gas-learn') || 'null') } catch { return null } })()
  const [view, setView] = useState(saved?.view ?? (next?.module.id ? 'path' : 'list'))
  const [modId, setModId] = useState(saved?.modId ?? next?.module.id ?? null)
  useEffect(() => { try { sessionStorage.setItem('gas-learn', JSON.stringify({ view, modId })) } catch { /* ок */ } }, [view, modId])
  const curRef = useRef(null)
  const pct = totals.nodes ? Math.round((totals.done / totals.nodes) * 100) : 0

  useEffect(() => {
    if (!next?.module.id) return
    setModId((prev) => {
      const cur = program.modules.find((x) => x.id === prev)
      if (prev && cur && !cur.done && !cur.locked) return prev
      return next.module.id
    })
  }, [next?.module.id, program.modules])

  useEffect(() => {
    if (view !== 'path') return
    const t = setTimeout(() => curRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 180)
    return () => clearTimeout(t)
  }, [view, modId])

  const activeMod = useMemo(() => {
    for (const st of stages) {
      const m = st.modules.find((x) => x.id === modId)
      if (m) return { m, st }
    }
    return null
  }, [stages, modId])

  const [pop, setPop] = useState(null)
  useEffect(() => setPop(null), [modId, view])
  useEffect(() => {
    if (!pop) return
    const off = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !e.target.closest?.('.lp-pop,.jp-hit')) setPop(null) }
    document.addEventListener('pointerdown', off); document.addEventListener('keydown', off)
    return () => { document.removeEventListener('pointerdown', off); document.removeEventListener('keydown', off) }
  }, [pop])

  const tap = (m, n) => {
    if (m.proLock) return openPro()
    if (m.locked && !m.proLock) return setChal(m)
    if (n.locked) return notify(n.kind === 'test' ? tr(`Проверка откроется после ещё ${n.need} ур.`) : tr('Шаг пока закрыт'))
    navigator.vibrate?.(6)
    setPop((p) => (p === n.id ? null : n.id))
  }

  const openMod = (m) => {
    if (m.proLock) return openPro()
    if (m.locked && !m.proLock) return setChal(m)
    setModId(m.id)
    setView('path')
  }

  return (
    <div className="learn">
      <header className="page-head learn-head">
        <div>
          <h1>{tr('Путь')}</h1>
          <p className="page-sub">{tr('Ваша программа обучения')}</p>
        </div>
        <div className="path-stats">
          <button type="button" className="sc" style={{ '--c': liveStreak(state) ? '#f97316' : 'var(--muted)' }} onClick={() => setStreakOpen(true)} aria-label={`${tr('Серия')}: ${liveStreak(state)}`}>
            <Icon name="flame" size={20} fill="currentColor" />
            <b>{liveStreak(state)}</b>
          </button>
          <button type="button" className="sc" style={{ '--c': '#ef4444' }} onClick={openPro} aria-label={`Сердца: ${formatHearts(hearts ?? 0)}`}>
            <Icon name="heart" size={20} fill="currentColor" />
            <b>{hearts === Infinity ? <Inf size={20} /> : formatHearts(hearts ?? 0)}</b>
          </button>
        </div>
      </header>

      {(() => {
        const g = greeting({ hour: new Date().getHours(), streak: liveStreak(state), doneToday: state.lastDay === lastDays(1)[0].date })
        return <GasSays className="gas-hello" mood={g.mood} size={64} head={tr(g.head)} note={tr(g.note)} />
      })()}

      <div className="learn-rail">
        <div className="learn-overview">
          <div className="learn-overview-meta">
            <span>{totals.done} / {totals.nodes} {tr('шагов')} · {pct}%</span>
            <span>{totals.nodes - totals.done > 0 ? `${tr('осталось')} ${totals.nodes - totals.done}` : tr('готово')}</span>
          </div>
          <ProgressBar value={pct} max={100} />
        </div>

        {next && (
          <button
            type="button"
            className="learn-cta"
            style={{ '--c': next.module.color }}
            onClick={() => {
              if (next.module.proLock) return openPro()
              openLesson(next.node.lesson)
            }}
          >
            <span className="learn-cta-ico"><Icon name={KIND[next.node.kind]?.[0] || 'target'} size={20} /></span>
            <span className="learn-cta-txt">
              <small>{next.module.title}</small>
              <b>{next.node.kind === 'read' ? tr('Конспект') : next.node.lesson.title}</b>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        )}

        {reviewDue(state) > 0 && (
          <button type="button" className="lh-review" onClick={() => { const l = srsLesson(state); if (l) openLesson(l) }}>
            <Icon name="repeat" size={18} />
            <span><b>{tr('Повторение')}</b><small>{`${reviewDue(state)} вопр. пора повторить`}</small></span>
            <Icon name="chevron" size={18} />
          </button>
        )}
      </div>

      <div className="jp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={view === 'path'} className={view === 'path' ? 'on' : ''} onClick={() => setView('path')} disabled={!modId}>
          {tr('Путь')}
        </button>
        <button type="button" role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
          {tr('Темы')}
        </button>
      </div>

      {view === 'list' && (
        <div className="jp-list">
          {stages.map((st) => (
            <section key={st.id} className="jp-stage">
              <div className="jp-st">
                <span>{st.num}</span>
                <div>
                  <b>{st.title}</b>
                  <small>{st.blurb}</small>
                </div>
              </div>
              {st.modules.map((m) => {
                const isCurrent = m.id === (next?.module?.id)
                const isDone = m.done
                const isLocked = m.locked
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`jp-mc ${isLocked ? 'lock' : ''} ${isDone ? 'done' : ''} ${isCurrent ? 'cur' : ''}`}
                    style={{ '--c': m.color }}
                    onClick={() => openMod(m)}
                  >
                    <Tile
                      name={isLocked ? (m.proLock ? 'crown' : 'lock') : isDone ? 'check' : m.icon}
                      color={isLocked ? 'var(--muted)' : m.color}
                      size={42}
                    />
                    <span className="jp-mc-t">
                      <b>{m.title}</b>
                      <small>
                        {m.proLock ? 'Pro'
                          : m.mode === 'mastered' ? 'Проверка'
                          : `${m.chapters?.length || 0} гл. · ${m.doneN || 0}/${m.total || m.lessonCount || 0}`}
                      </small>
                      {!isLocked && !m.proLock && (m.total > 0) && (
                        <span className="jp-mc-bar"><i style={{ width: `${Math.round(((m.doneN || 0) / m.total) * 100)}%` }} /></span>
                      )}
                    </span>
                    {isCurrent && <em className="jp-tag cur-tag">{tr('Сейчас')}</em>}
                    {!isLocked && m.mode && m.mode !== 'full' && !isCurrent && (
                      <em className={`jp-tag ${m.mode}`}>{modeLabel[m.mode]}</em>
                    )}
                    <Icon name="chevron" size={16} />
                  </button>
                )
              })}
            </section>
          ))}
        </div>
      )}

      {view === 'path' && activeMod && (() => {
        const { m, st } = activeMod
        let nodeIdx = 0
        return (
          <div className="jp-path">
            <div className="jp-path-head" style={{ '--c': m.color }}>
              <button type="button" className="jp-back" onClick={() => setView('list')} aria-label="К темам">
                <Icon name="back" size={18} />
              </button>
              <Tile name={m.icon} color={m.color} size={40} />
              <div>
                <small>{st.title}</small>
                <b>{m.title}</b>
              </div>
            </div>
            <ul className="jp-track">
              {(m.chapters || []).map((c, ci) => {
                if (!c.open && !m.done) return null
                return (
                  <div key={c.id} className="jp-chap-block">
                    <div className="jp-chap-label" style={{ '--c': m.color }}>
                      <b>{tr('Глава')} {ci + 1} · {c.title}</b>
                    </div>
                    {c.nodes.map((n) => {
                      const i = nodeIdx++
                      const isCur = next?.node?.id === n.id
                      return (
                        <div key={n.id} ref={isCur ? curRef : undefined}>
                          <PathNode
                            n={n}
                            color={m.color}
                            current={isCur}
                            idx={i}
                            onOpen={() => tap(m, n)}
                          />
                          {pop === n.id && <LessonPop n={n} idx={i} color={m.color} onStart={() => { setPop(null); openLesson(n.lesson) }} />}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </ul>
          </div>
        )
      })()}
      {chal && (
        <Sheet onClose={() => setChal(null)}>
          {(close) => (
            <div className="chal-sheet">
              <Tile name="trophy" color={chal.color} size={68} />
              <h2>{tr('Испытание')}: {chal.title}</h2>
              <p>{tr('Не хотите идти по порядку? Пройдите короткое испытание — и модуль откроется сразу. Или завершите предыдущие модули, и он откроется сам.')}</p>
              <div className="chal-meta"><span>{tr('10 вопросов')}</span><span>{tr('проходной балл — 7')}</span></div>
              <button type="button" className="btn" onClick={() => { close(); openLesson(moduleChallenge(chal)) }}>{tr('Пройти испытание')}</button>
              <button type="button" className="btn ghost" onClick={close}>{tr('Позже')}</button>
            </div>
          )}
        </Sheet>
      )}
      {streakOpen && (
        <Sheet onClose={() => setStreakOpen(false)}>
          {(close) => {
            const week = lastDays(7), todayKey = week[6].date
            return (
              <div className="streak-sheet">
                <div className="streak-big"><Icon name="flame" size={48} fill="currentColor" /><b>{liveStreak(state)}</b><span>{tr('дн. подряд')}</span></div>
                <p className="streak-best">{tr('Лучшая серия')}: {state.bestStreak} {tr('дн.')}</p>
                <div className="streak-week">
                  {week.map((d) => {
                    const on = (state.activity?.[d.date] ?? 0) > 0
                    return <div key={d.date} className={on ? 'on' : ''}><i>{on && <Icon name="check" size={14} />}</i><small>{d.label}</small></div>
                  })}
                </div>
                <p className="streak-hint">{state.lastDay === todayKey ? tr('Сегодня серия уже засчитана') : tr('Позанимайтесь сегодня, чтобы продлить серию')}</p>
                <button type="button" className="btn ghost" onClick={close}>{tr('Закрыть')}</button>
              </div>
            )
          }}
        </Sheet>
      )}
    </div>
  )
}
