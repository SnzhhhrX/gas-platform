import { useEffect, useMemo, useState, useCallback } from 'react'
import { tr, optLetter } from '../lib/i18n'
import { SKILLS, expectedTotal, nextStep, skillById } from '../data/placement'
import { GOALS, GRADE_OPTIONS, INTERESTS, SELF, TIME, goalName, makePlan, modeLabel, skillOrder, LEVEL_META, STATUS_LABEL } from '../lib/plan'
import { Icon, Tile } from './Icon'
import { play } from '../lib/sound'
import { Mascot } from './Mascot'

const SURVEY = [
  { id: 'goal', title: 'Зачем география?', hint: 'От цели зависит порядок и глубина тем.' },
  { id: 'grade', title: 'Кто вы?', hint: 'Чтобы подобрать темп.' },
  { id: 'minutes', title: 'Сколько минут в день?', hint: 'Считаем срок и цель XP.' },
  { id: 'interests', title: 'Что интереснее?', hint: 'Можно несколько — поставим раньше.', multi: true },
  { id: 'self', title: 'Как оцениваете знания?', hint: 'Тест уточнит уровень.' },
]

// Загрузка программы: после теста и после пропуска — разные тексты и длительность, без резких скачков
const PHASES = {
  skipped: ['Читаем ваши ответы', 'Подбираем темы под вашу цель', 'Собираем программу'],
  tested: ['Проверяем ответы теста', 'Определяем уровень', 'Подбираем темы', 'Собираем программу'],
}
function Analysis({ onDone, skipped }) {
  const phases = skipped ? PHASES.skipped : PHASES.tested
  const total = skipped ? 2200 : 3600
  const [p, setP] = useState(0)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    let raf, t0, t1, t2
    const tick = (t) => {
      t0 ??= t
      const k = Math.min(1, (t - t0) / total)
      setP(k < 1 ? 1 - Math.pow(1 - k, 1.6) : 1) // плавное замедление к концу
      if (k < 1) raf = requestAnimationFrame(tick)
      else { t1 = setTimeout(() => setLeaving(true), 400); t2 = setTimeout(onDone, 1000) }
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2) }
  }, [])
  const idx = Math.min(phases.length - 1, Math.floor(p * phases.length))
  const R = 52, C = 2 * Math.PI * R
  return (
    <div className={`app auth pl-load ${leaving ? 'out' : ''}`} role="status" aria-live="polite">
      <div className="pl-gasring" aria-hidden>
        <svg className="pl-rsvg" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} className="rtrk" />
          <circle cx="60" cy="60" r={R} className="rbar" strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
        </svg>
        <Mascot mood={p >= 1 ? 'cheer' : 'think'} size={96} />
      </div>
      <h1 key={idx} className="pl-phase">{p >= 1 ? 'Программа готова' : phases[idx]}</h1>
    </div>
  )
}

export default function Placement({ onDone, onCancel = null, seed = 0, practiceN = 0 }) {
  const retake = !!onCancel
  const [phase, setPhase] = useState('intro')
  const [si, setSi] = useState(0)
  const [survey, setSurvey] = useState({ goal: null, grade: null, minutes: null, interests: [], self: null })
  const [answers, setAnswers] = useState([])
  const [plan, setPlan] = useState(null)
  const [resultReady, setResultReady] = useState(0)
  const [picked, setPicked] = useState(null)
  const [skipped, setSkipped] = useState(false)

  const order = useMemo(() => skillOrder(survey), [phase === 'test'])
  const step = phase === 'test' ? nextStep(answers, order, seed) : null
  const total = expectedTotal(order)

  const build = useCallback((sv, list) => {
    setPlan(makePlan(sv, list, { practiceN, revision: seed }))
    setPhase('analysis')
  }, [])

  const skip = () => {
    const sv = { goal: 'school', grade: '', minutes: 20, interests: [], self: 2 }
    setSurvey(sv)
    setSkipped(true)
    build(sv, [])
  }

  // Pure diagnostic: no right/wrong feedback, just collect answers
  const answer = (i) => {
    if (!step || picked !== null) return
    // Use sentinel for "don't know" so we can highlight the button
    setPicked(i === null ? 'idk' : i)
    play('click', true)
    const ok = i !== null && i === step.q.answer
    const list = [...answers, { skill: step.skill, key: step.key, level: step.level, ok, idk: i === null }]
    // Brief pause so selection feels intentional, then advance
    setTimeout(() => {
      setAnswers(list)
      setPicked(null)
      if (!nextStep(list, order, seed)) {
        build(survey, list)
      }
    }, 280)
  }

  // Result reveal stagger
  useEffect(() => {
    if (phase !== 'result') return
    setResultReady(0)
    const timers = [1, 2, 3, 4].map((n) => setTimeout(() => setResultReady(n), n * 220))
    return () => timers.forEach(clearTimeout)
  }, [phase])

  /* ── INTRO ── */
  if (phase === 'intro') {
    return (
      <div className="app auth pl-intro">
        <div className="pl-hero"><Mascot mood="wave" size={150} /></div>
        <h1>{retake ? 'Диагностика заново' : 'Определим ваш уровень'}</h1>
        <p className="text">{retake ? 'Вопросы будут другими. Пройденные уроки сохранятся.' : 'Несколько вопросов о вас и по три коротких вопроса на каждую из 8 тем. Около 4 минут, закончить можно в любой момент.'}</p>
        <button className="btn" onClick={() => setPhase('survey')}>Начать</button>
        {retake ? <button className="link" onClick={onCancel}>Отмена</button> : <button className="link" onClick={skip}>Пропустить</button>}
      </div>
    )
  }

  /* ── SURVEY ── */
  if (phase === 'survey') {
    const q = SURVEY[si]
    const v = survey[q.id]
    const set = (val) =>
      setSurvey((s) => ({
        ...s,
        [q.id]: q.multi
          ? s.interests.includes(val)
            ? s.interests.filter((x) => x !== val)
            : [...s.interests, val]
          : val,
      }))
    const ok = q.multi ? v.length > 0 : v !== null
    const opts = {
      goal: GOALS.map((g) => [g.id, g.title, g.sub, g.icon]),
      grade: GRADE_OPTIONS.map((g) => [g, g]),
      minutes: TIME.map(([m, t, s]) => [m, t, s]),
      interests: INTERESTS.map(([id, t, icon]) => [id, t, null, icon]),
      self: SELF.map(([id, t, s]) => [id, t, s]),
    }[q.id]
    const on = (val) => (q.multi ? v.includes(val) : v === val)

    return (
      <div className="app focus pl-page">
        <div className="pl-top">
          <button
            className="icon"
            onClick={() => (si ? setSi(si - 1) : setPhase('intro'))}
            aria-label="Назад"
          >
            <Icon name="back" size={20} />
          </button>
          <div className="bar">
            <i style={{ width: `${((si + 1) / SURVEY.length) * 100}%`, animation: 'none' }} />
          </div>
          <small className="pl-count">{si + 1}/{SURVEY.length}</small>
        </div>
        <div key={si} className="pl-body anim-in">
          <h2>{q.title}</h2>
          <small className="pl-hint">{q.hint}</small>
          <div className={q.id === 'grade' ? 'pl-grid' : 'options pl-opts'}>
            {opts.map(([val, label, sub, icon]) => (
              <button
                key={val}
                type="button"
                className={`option ${on(val) ? 'picked' : ''} ${q.id === 'grade' ? 'pl-grade' : ''}`}
                onClick={() => set(val)}
                aria-pressed={on(val)}
              >
                {icon ? (
                  <span className="pl-ico">
                    <Icon name={icon} size={18} />
                  </span>
                ) : null}
                <span className="pl-opt">
                  <b>{label}</b>
                  {sub ? <small>{sub}</small> : null}
                </span>
              </button>
            ))}
          </div>
          <button
            className="btn"
            disabled={!ok}
            onClick={() => (si + 1 < SURVEY.length ? setSi(si + 1) : setPhase('test'))}
          >
            {si + 1 < SURVEY.length ? 'Дальше' : 'К тесту'}
          </button>
        </div>
      </div>
    )
  }

  /* ── TEST (no right/wrong feedback) ── */
  if (phase === 'test' && step) {
    const sk = skillById(step.skill)
    return (
      <div className="app focus pl-page">
        <div className="pl-top">
          <div className="bar">
            <i style={{ width: `${(answers.length / Math.max(total, 1)) * 100}%`, animation: 'none' }} />
          </div>
          <small className="pl-count">
            {Math.min(answers.length + 1, total)}/{total}
          </small>
        </div>
        <div key={answers.length} className="pl-body anim-in">
          <small className="kicker" style={{ '--c': sk.color }}>
            <Icon name={sk.icon} size={14} /> {sk.title}
          </small>
          <h2 className="question">{step.q.q}</h2>
          <div className="options">
            {step.q.options.map((o, i) => (
              <button
                key={i}
                type="button"
                className={`option ${picked === i ? 'picked' : ''}`}
                onClick={() => answer(i)}
                disabled={picked !== null}
              >
                <span>{optLetter(i)}</span>
                {o}
              </button>
            ))}
          </div>
          <button type="button" className={`pl-idk ${picked === 'idk' ? 'picked' : ''}`} onClick={() => answer(null)} disabled={picked !== null}>Не знаю</button>
          {answers.length >= 8 && picked === null && (
            <button type="button" className="link" onClick={() => build(survey, answers)}>
              Завершить сейчас
            </button>
          )}
        </div>
      </div>
    )
  }

  /* ── ANALYSIS ── */
  if (phase === 'analysis' && plan) {
    return <Analysis skipped={skipped} onDone={() => setPhase('result')} />
  }

  if (!plan) return null

  /* ── RESULT ── */
  const { per, result, prog } = plan
  const s = result.summary
  const freeMods = prog.modules.filter((m) => !m.pro)
  const levelKey = result.startLevel || 'unknown'
  const levelMeta = LEVEL_META[levelKey] || LEVEL_META.unknown
  const asked = answers.length > 0

  return (
    <div className="app focus pl-result">
      <div className={`pl-res-head ${resultReady >= 1 ? 'show' : ''}`}>
        <Mascot mood="cheer" size={112} />
        <h1>Программа готова</h1>
        <span className="pl-level-badge" style={{ '--lc': levelMeta.color }}>
          {skipped ? 'Начинаем с основ' : levelMeta.title}
        </span>
        <p className="pl-level-desc">{skipped ? 'Вы пропустили тест, поэтому все темы пройдём полностью. Результат уточнится по ходу уроков.' : levelMeta.desc}</p>
      </div>

      <p className={`pl-sum ${resultReady >= 2 ? 'show' : ''}`}>
        {`${s.lessons} уроков · ${s.days <= 14 ? `${s.days} дн.` : `${s.weeks} нед.`} по ${result.plan.minutes} мин в день`}
      </p>

      {asked && resultReady >= 2 && (
        <div className="pl-card show">
          <div className="pl-skills">
            {SKILLS.map((k) => {
              const p = per[k.id]
              return (
                <div key={k.id} className={`pl-skill st-${p.status}`} style={{ '--c': k.color }}>
                  <span className="pl-skill-label"><Icon name={k.icon} size={18} />{k.title}</span>
                  <span className="pl-skill-st"><span>{STATUS_LABEL[p.status]}</span>{p.n ? <i>{` · ${p.right}/${p.n}`}</i> : null}</span>
                </div>
              )
            })}
          </div>
          <p className="pl-tip">Это ориентир, а не процент знаний: по каждой теме задавали не больше трёх вопросов.</p>
        </div>
      )}

      {resultReady >= 3 && (
        <div className="pl-card show">
          <div className="pl-route">
            {freeMods.slice(0, 3).map((m) => (
              <div key={m.id} className="pl-stop" style={{ '--c': m.color }}>
                <Tile name={m.icon} color={m.color} size={32} />
                <div className="pl-stop-body">
                  <b>{m.title}</b>
                  <small>{m.why?.[0] || ''}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resultReady >= 4 && (
        <button
          className="btn pl-start show"
          onClick={() => onDone(result, { xpGoal: result.plan.xpGoal, grade: survey.grade })}
        >
          {retake ? 'Сохранить результат' : 'Начать обучение'}
        </button>
      )}
    </div>
  )
}
