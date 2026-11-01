import { useEffect, useState } from 'react'
import { PRO_CHALLENGES } from '../data/pro-content'
import { Icon, Tile } from './Icon'

/** Встроенный YouTube-плеер */
export function ProChallengeList({ onStart }) {
  return (
    <div className="pv-hub">
      <h3 className="pro-sub">Челлендж-тесты</h3>
      <p className="pv-hint">Сложнее обычных уроков. Есть лимит времени — как на туре.</p>
      <div className="pv-ch-list">
        {PRO_CHALLENGES.map((c) => (
          <button key={c.id} type="button" className="pv-ch" style={{ '--c': c.color }} onClick={() => onStart(c)}>
            <Tile name={c.icon} color={c.color} size={42} />
            <span>
              <b>{c.title}</b>
              <small>{c.questions.length} вопр. · {Math.round(c.timeLimit / 60)} мин</small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        ))}
      </div>
    </div>
  )
}

/** Таймер + обёртка: превращаем челлендж в lesson-совместимый объект */
export function challengeToLesson(c) {
  return {
    id: c.id,
    title: c.title,
    text: c.text,
    icon: c.icon,
    color: c.color,
    questions: c.questions,
    proChallenge: true,
    timeLimit: c.timeLimit,
  }
}

/** Таймер для Pro-челленджа */
export function ChallengeTimer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) { onExpire?.(); return }
    const t = setTimeout(() => setLeft((x) => x - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  const m = Math.floor(left / 60)
  const s = left % 60
  const urgent = left < 30
  return (
    <span className={`pv-timer ${urgent ? 'urgent' : ''}`}>
      <Icon name="timer" size={14} />
      {m}:{String(s).padStart(2, '0')}
    </span>
  )
}
