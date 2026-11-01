import { useEffect, useRef, useState } from 'react'
import { nameOf } from '../data/world'
import { XP_PER_ANSWER } from '../lib/store'
import { play } from '../lib/sound'
import { Icon, Tile } from './Icon'
import WorldMap from './WorldMap'
import { tr, optLetter } from '../lib/i18n'
import { rememberSeen } from '../lib/seen'
import Confetti from './Confetti'
import QImage, { LESSON_IMG } from './QImage'
import { Mascot, LessonArt, GasSays } from './Mascot'
import { reaction, resultLine } from '../lib/gas'
import { Sheet } from './ui'
import { checkTyped } from '../lib/typed'
import { ChallengeTimer } from './ProMedia'
import FixRound from './FixRound'

// Разбор конкретной ошибки: пояснение к выбранному неверному варианту (если оно написано для этого вопроса)
function pickedMiss(q, picked, isMulti, isInput, isMap) {
  if (!q.miss || isMulti || isInput || isMap || typeof picked !== 'number') return null
  return q.miss[q.options[picked]] ?? null
}

export default function Lesson({ lesson, calcXp, repeat, hearts, sound = true, onLoseHeart, onOpenPro, onFinish, onExit, getNext }) {
  const qs = lesson.questions
  const [step, setStep] = useState(-1) // -1 = объяснение/конспект, qs.length = итог
  const cards = lesson.cards ?? null
  const [ci, setCi] = useState(0) // номер карточки конспекта
  const [picked, setPicked] = useState(null)
  const [sel, setSel] = useState(null)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState([])
  const [combo, setCombo] = useState(0)
  const [run, setRun] = useState(0) // неверных подряд — для слов поддержки
  const [hints, setHints] = useState(1)
  const [faded, setFaded] = useState([])
  const [hinted, setHinted] = useState(false)
  const [dead, setDead] = useState(hearts <= 0)
  const [localHearts, setLocalHearts] = useState(hearts)
  const [confirmExit, setConfirmExit] = useState(false)
  const [fixOpen, setFixOpen] = useState(false)
  const [fixed, setFixed] = useState(null) // сколько ошибок исправлено во втором подходе
  const fb = useRef(null)
  const nextBtn = useRef(null)

  // Если в уроке уже есть прогресс — спрашиваем, точно ли выйти
  const hasProgress = (step >= 0 && step < qs.length) || (step === -1 && !!cards && ci > 0)
  const tryExit = () => (hasProgress ? setConfirmExit(true) : onExit())
  const tryExitRef = useRef(tryExit)
  tryExitRef.current = tryExit
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape' && !confirmExit) tryExitRef.current() }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [confirmExit])

  const q = qs[step]
  const isMap = q?.type === 'map'
  const isShow = q?.type === 'mapid'
  const isInput = q?.type === 'input'
  const [typed, setTyped] = useState('')
  const stars = score === qs.length ? 3 : score >= qs.length * 0.6 ? 2 : score > 0 ? 1 : 0

  useEffect(() => { if (picked !== null) fb.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [picked])
  useEffect(() => { if (picked !== null) setTimeout(() => nextBtn.current?.focus(), 80) }, [picked])

  // Клавиатура: 1–3 / АБВ, Enter, H — подсказка
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (step < 0) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cards && ci < cards.length - 1 ? setCi(ci + 1) : setStep(0) }
        return
      }
      if (step >= qs.length) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExit() }
        return
      }
      if (picked !== null) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next() }
        return
      }
      if (isMap || isInput) return
      const map = { '1': 0, '2': 1, '3': 2, 'а': 0, 'б': 1, 'в': 2, 'a': 0, 'b': 1, 'c': 2 }
      const i = map[e.key.toLowerCase()]
      if (i != null && i < (q?.options?.length ?? 0) && !faded.includes(i)) {
        e.preventDefault()
        answer(i)
      }
      if ((e.key === 'h' || e.key === 'H' || e.key === 'п' || e.key === 'П') && hints) {
        e.preventDefault()
        hint()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  const isMulti = q?.type === 'multi' && Array.isArray(q.answer)
  const isCorrect = (i) => {
    if (isMulti) {
      const a = [...q.answer].sort().join(',')
      const b = [...(Array.isArray(i) ? i : [i])].sort().join(',')
      return a === b
    }
    if (isInput) return checkTyped(q, i)
    return i === q.answer
  }

  const answer = (i) => {
    if (picked !== null) return
    // multi: toggle selection until confirm
    if (isMulti && !Array.isArray(i)) {
      setSel((prev) => {
        const cur = Array.isArray(prev) ? prev : []
        return cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]
      })
      return
    }
    const choice = isMulti ? (Array.isArray(i) ? i : sel) : i
    if (isMulti && (!Array.isArray(choice) || !choice.length)) return
    setPicked(isMulti ? choice : i)
    if (isCorrect(choice)) {
      setScore((s) => s + 1)
      setRun(0)
      setCombo((c) => {
        const n = c + 1
        play(n >= 3 ? 'combo' : 'ok', sound)
        return n
      })
    } else {
      setCombo(0)
      setRun((r) => r + 1)
      play('bad', sound)
      const nextH = typeof localHearts === 'number' ? Math.max(0, +(localHearts - 0.5).toFixed(1)) : localHearts
      setLocalHearts(nextH)
      onLoseHeart()
      setWrong((w) => [...w, {
        q: q.q, type: q.type, target: q.target, region: q.region, img: q.img, answers: q.answers,
        options: q.options, answer: isInput ? q.answers[0] : q.answer, why: q.why, miss: q.miss,
        picked: isInput ? String(choice) : isMap ? nameOf(choice) : (Array.isArray(choice) ? choice.map((x) => q.options[x]).join(', ') : q.options[choice]),
      }])
    }
  }

  const hint = () => {
    if (!hints || picked !== null) return
    setHints(0)
    play('click', sound)
    if (isMap) return setHinted(true)
    if (isInput) return setHinted(true)
    const pool = q.options.map((_, i) => i).filter((x) => x !== q.answer)
    setFaded(pool.sort(() => Math.random() - 0.5).slice(0, 1))
  }

  const next = () => {
    const last = step === qs.length - 1
    if (!last && localHearts <= 0) return setDead(true)
    if (last) {
      play(score === qs.length ? 'finish' : 'ok', sound)
      rememberSeen(qs)
      onFinish(lesson, score, wrong)
    }
    setPicked(null)
    setSel(null)
    setFaded([])
    setHinted(false)
    setTyped('')
    setStep(step + 1)
  }

  if (dead) return (
    <section className="lesson">
      <div className="pop center">
        <Mascot mood="oops" size={112} />
        <h1>Сердца закончились</h1>
        <p className="text">За ошибку списывается половина сердца. Завтра будет снова 5. С GAS Pro — безлимит, и можно тренироваться без пауз.</p>
        <button className="btn gold" onClick={onOpenPro}>Открыть GAS Pro</button>
        <button className="btn ghost" onClick={onExit}>На главную</button>
      </div>
    </section>
  )

  return (
    <section className={`lesson ${lesson.proChallenge ? 'pro-ch' : ''}`}>
      <header className="top">
        <button className="icon" onClick={tryExit} aria-label="Выйти"><Icon name="x" size={20} /></button>
        <div className="bar flex"><i style={{ width: `${Math.max(0, step) / qs.length * 100}%` }} /></div>
        {lesson.proChallenge && step >= 0 && step < qs.length && (
          <ChallengeTimer seconds={lesson.timeLimit || 180} onExpire={() => setStep(qs.length)} />
        )}
        <div className="pills">
          {combo >= 2 && <span className="chip hot" key={combo}><Icon name="flame" size={14} />×{combo}</span>}
          <button className="chip" disabled={!hints || picked !== null} onClick={hint} aria-label="Подсказка">
            <Icon name="bulb" size={20} />{hints}
          </button>
          <span className="chip heart"><Icon name="heart" size={20} />{localHearts === Infinity ? '∞' : (Number.isInteger(localHearts) ? localHearts : localHearts.toFixed(1))}</span>
        </div>
      </header>

      {step === -1 && cards && (
        <div key={ci} className="pop reader">
          <small className="kicker" style={{ '--c': lesson.color }}><Icon name={lesson.read ? 'book' : 'bulb'} size={14} /> {`${lesson.read ? 'Конспект' : 'Объяснение'} · ${ci + 1}/${cards.length}`}</small>
          {ci === 0 && lesson.goal && <div className="rd-goal"><Icon name="target" size={18} /><div><small>Цель урока</small><p>{lesson.goal}</p></div></div>}
          <h1>{cards[ci].h}</h1>
          {ci === 0 && LESSON_IMG[lesson.id] && <QImage id={LESSON_IMG[lesson.id]} />}
          <p className="text">{cards[ci].p}</p>
          {cards[ci].example && (
            <div className="rd-example">
              <small>Разберём пример</small>
              <p className="rd-task">{cards[ci].example.task}</p>
              <ol>{cards[ci].example.steps.map((t, i) => <li key={i}>{t}</li>)}</ol>
              <p className="rd-answer">Ответ: <b>{cards[ci].example.answer}</b></p>
            </div>
          )}
          {cards[ci].key && <div className="rd-say"><Mascot mood={ci === cards.length - 1 ? 'cheer' : 'happy'} size={76} /><div className="bubble"><small>Запомните</small><b>{cards[ci].key}</b></div></div>}
          {cards[ci].fact && <div className="rd-fact"><Icon name="bulb" size={18} /><div><small>Интересно</small><p>{cards[ci].fact}</p></div></div>}
          <div className="rd-dots">{cards.map((_, i) => <i key={i} className={i === ci ? 'on' : i < ci ? 'done' : ''} />)}</div>
          <div className="rd-nav">
            {ci > 0 && <button className="btn ghost" onClick={() => setCi(ci - 1)}>{tr('Назад')}</button>}
            <button className="btn" onClick={() => { play('click', sound); ci < cards.length - 1 ? setCi(ci + 1) : setStep(0) }}>{ci < cards.length - 1 ? tr('Дальше') : `Проверить себя · ${qs.length} вопр.`}</button>
          </div>
        </div>
      )}

      {step === -1 && !cards && (
        <div className="pop lesson-intro">
          {(lesson.img || LESSON_IMG[lesson.id]) ? <Mascot mood={lesson.test ? 'think' : 'happy'} size={92} /> : <LessonArt icon={lesson.icon} color={lesson.color} mood={lesson.test ? 'think' : 'happy'} />}
          <small className="kicker">{lesson.test ? 'Проверка' : lesson.review ? 'Повторение' : 'Урок'}</small>
          <h1>{lesson.title}</h1>
          {(lesson.img || LESSON_IMG[lesson.id]) && <QImage id={lesson.img || LESSON_IMG[lesson.id]} />}
          <p className="text">{lesson.text}</p>
          {lesson.goal && <div className="rd-goal"><Icon name="target" size={18} /><div><small>Цель урока</small><p>{lesson.goal}</p></div></div>}
          <div className="meta"><span><Icon name="target" size={15} />{qs.length} вопр.</span><span><Icon name="timer" size={15} />~{Math.max(1, Math.round(qs.length * 0.5))} мин</span><span><Icon name="zap" size={15} />до +{calcXp(qs.length)} XP</span></div>
          <button className="btn" onClick={() => { play('click', sound); setStep(0) }}>{tr('К вопросам')}</button>
          <p className="hint-keys">Enter — начать · 1–3 — ответ · H — подсказка</p>
        </div>
      )}

      {q && (
        <div key={step} className="pop">
          <small className="kicker">
            {isMap || isShow
              ? <><Icon name="map" size={14} /> Задание на карте</>
              : isInput
                ? <><Icon name="edit" size={14} /> Впишите ответ · {step + 1}/{qs.length}</>
              : isMulti
                ? <><Icon name="check" size={14} /> Выберите все верные · {step + 1}/{qs.length}</>
                : `Вопрос ${step + 1} из ${qs.length}`}
          </small>
          <h2 className="question">{q.q}</h2>
          {q.img && <QImage id={q.img} />}
          {isInput ? (
            <form className="typed" onSubmit={(e) => { e.preventDefault(); if (typed.trim() && picked === null) answer(typed.trim()) }}>
              <input autoFocus value={typed} disabled={picked !== null} onChange={(e) => setTyped(e.target.value)} placeholder="Введите ответ" autoComplete="off" autoCapitalize="sentences" spellCheck="false" aria-label="Ваш ответ"
                className={picked === null ? '' : isCorrect(picked) ? 'right' : 'wrong'} />
              {hinted && picked === null && <small className="typed-hint">Подсказка: {String(q.answers[0]).length} букв, начинается на «{String(q.answers[0])[0].toUpperCase()}»</small>}
              {picked === null && <button className="btn" disabled={!typed.trim()}>Проверить</button>}
              {picked !== null && !isCorrect(picked) && <small className="typed-hint">Правильный ответ: <b>{q.answers[0]}</b></small>}
            </form>
          ) : isMap ? (
            <>
              <WorldMap region={q.region} picked={picked} answer={q.answer} selected={sel} onSelect={setSel} hinted={hinted} />
              {picked === null && (
                <button className="btn" disabled={!sel} onClick={() => answer(sel)}>Проверить</button>
              )}
            </>
          ) : (
            <>
              {isShow && <WorldMap mode="show" answer={q.target} />}
              <div className="options" role="listbox" aria-label="Варианты ответа">
                {q.options.map((o, i) => {
                  const multiOn = isMulti && Array.isArray(sel) && sel.includes(i)
                  const rightSet = isMulti && Array.isArray(q.answer) ? q.answer : [q.answer]
                  const s = picked === null
                    ? (faded.includes(i) ? 'dim' : multiOn ? 'picked' : '')
                    : rightSet.includes(i) ? 'right' : (Array.isArray(picked) ? picked.includes(i) : picked === i) ? 'wrong' : 'dim'
                  return (
                    <button
                      key={i}
                      role="option"
                      className={`option ${s}`}
                      disabled={faded.includes(i) || picked !== null}
                      onClick={() => answer(i)}
                      aria-selected={picked === i || multiOn}
                    >
                      <span>{isMulti ? (multiOn || (picked !== null && rightSet.includes(i)) ? '✓' : '○') : optLetter(i)}</span>{o}
                    </button>
                  )
                })}
              </div>
              {isMulti && picked === null && (
                <button className="btn" disabled={!Array.isArray(sel) || !sel.length} onClick={() => answer(sel)}>Проверить</button>
              )}
            </>
          )}
          {picked !== null && (
            <div ref={fb} className={`feedback ${isCorrect(picked) ? 'right' : 'wrong'} ${!isCorrect(picked) && pickedMiss(q, picked, isMulti, isInput, isMap) ? 'long' : ''}`}>
              {(() => {
                const ok = isCorrect(picked)
                const r = reaction({ ok, n: step, combo, run, xp: XP_PER_ANSWER })
                const head = !ok ? tr(r.word) : r.combo ? `Комбо ×${r.combo}! +${r.xp} XP` : `${tr(r.word)} +${r.xp} XP`
                return (
                  <div className="fb-head"><Mascot mood={r.mood} size={52} /><div><b>{head}</b>{r.note && <small className="fb-note">{tr(r.note)}</small>}</div></div>
                )
              })()}
              {!isCorrect(picked) && !isInput && !isMap && !isShow && (
                <p className="fb-pick">Вы выбрали <b>{isMulti ? picked.map((x) => q.options[x]).join(', ') : q.options[picked]}</b> · верно <b>{isMulti ? q.answer.map((x) => q.options[x]).join(', ') : q.options[q.answer]}</b></p>
              )}
              {!isCorrect(picked) && pickedMiss(q, picked, isMulti, isInput, isMap) && (
                <p className="fb-miss"><b>Почему не так.</b> {pickedMiss(q, picked, isMulti, isInput, isMap)}</p>
              )}
              <p>{!isCorrect(picked) && pickedMiss(q, picked, isMulti, isInput, isMap) ? <b>Как правильно. </b> : null}{q.why}</p>
              {isInput && !isCorrect(picked) && (
                <p className="typed-hint" style={{ marginTop: 4 }}>Правильный ответ: <b>{q.answers?.[0]}</b></p>
              )}
              <button ref={nextBtn} className="btn dark" onClick={next}>
                {step === qs.length - 1 ? tr('Завершить') : tr('Дальше')}
              </button>
            </div>
          )}
        </div>
      )}

      {step === qs.length && fixOpen && (
        <FixRound items={wrong.filter((w) => w.type !== 'map' && w.type !== 'mapid')} sound={sound} onDone={(k) => { setFixed(k); setFixOpen(false) }} />
      )}
      {step === qs.length && !fixOpen && (
        <div className="pop center result">
          {stars === 3 && <Confetti count={lesson.proChallenge ? 80 : 48} duration={lesson.proChallenge ? 3600 : 2800} />}
          <Mascot mood={resultLine(stars, score, qs.length).mood} size={112} />
          <div className="pips big" aria-label={`${stars} из 3`}>
            {[0, 1, 2].map((i) => (
              <i key={i} className={i < stars ? 'on' : ''} style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <h1>{score} из {qs.length}</h1>
          <p className="xp">+{calcXp(score)} XP</p>
          <p className="text">
            <b className="res-head">{tr(resultLine(stars, score, qs.length).head)}</b>{' '}
            {score === qs.length
              ? 'Бонус +20 XP.'
              : tr(resultLine(stars, score, qs.length).note)}
            {repeat && ' Повторное прохождение даёт половину XP.'}
          </p>
          {wrong.length > 0 && (
            <div className="mistakes">
              {fixed !== null && <p className="fix-done"><Icon name="check" size={16} /> {`Исправлено ошибок: ${fixed} из ${wrong.filter((w) => w.type !== 'map' && w.type !== 'mapid').length}`}</p>}
              {fixed === null && wrong.some((w) => w.type !== 'map' && w.type !== 'mapid') && (
                <button type="button" className="btn ghost" onClick={() => setFixOpen(true)}>{`Исправить ошибки (${wrong.filter((w) => w.type !== 'map' && w.type !== 'mapid').length})`}</button>
              )}
              <details>
                <summary>{`Разбор ошибок (${wrong.length})`}</summary>
                <ul>
                  {wrong.slice(0, 10).map((w, i) => (
                    <li key={i}>
                      <b>{w.q}</b>
                      <span>{`Ваш ответ: ${String(w.picked)}`}</span>
                      {w.type !== 'map' && w.type !== 'mapid' && <span>{`Верно: ${Array.isArray(w.options) && typeof w.answer === 'number' ? w.options[w.answer] : Array.isArray(w.answer) ? w.answer.map((x) => w.options[x]).join(', ') : String(w.answer)}`}</span>}
                      {w.miss?.[w.picked] && <em>{w.miss[w.picked]}</em>}
                      {w.why && <small>{w.why}</small>}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
          {(() => {
            const nx = getNext?.()
            return nx ? (
              <>
                <button className="btn" onClick={nx.go}>{tr('Дальше')}: {nx.title}</button>
                <button className="btn ghost" onClick={onExit}>{tr('К пути')}</button>
              </>
            ) : <button className="btn" onClick={onExit}>Готово</button>
          })()}
        </div>
      )}
      {confirmExit && (
        <Sheet onClose={() => setConfirmExit(false)}>
          {(close) => (
            <div className="exit-sheet">
              <Mascot mood="think" size={104} />
              <h2>Выйти из урока?</h2>
              <p>Прогресс этого урока не сохранится.</p>
              <button className="btn" onClick={close}>Остаться</button>
              <button className="btn ghost danger" onClick={onExit}>Выйти</button>
            </div>
          )}
        </Sheet>
      )}
    </section>
  )
}
