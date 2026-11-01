import { useEffect, useRef, useState } from 'react'
import { INFO } from '../data/capitals'
import { findPool } from '../data/practice'
import { nameOf } from '../data/world'
import { play } from '../lib/sound'
import Confetti from './Confetti'
import { Icon, Tile } from './Icon'
import WorldMap from './WorldMap'

// Блиц: 60 секунд, находите страны на глобусе. Верно = +1, ошибка = −3 секунды.
const TIME = 60, PENALTY = 3
const deck = () => [...findPool].sort(() => Math.random() - 0.5)

export default function Blitz({ record, sound, onFinish, onExit }) {
  const [phase, setPhase] = useState('ready') // ready | play | over
  const [left, setLeft] = useState(TIME)
  const [score, setScore] = useState(0)
  const [miss, setMiss] = useState(0)
  const [combo, setCombo] = useState(0)
  const [picked, setPicked] = useState(null)
  const [i, setI] = useState(0)
  const cards = useRef(deck()), endAt = useRef(0), saved = useRef(false)
  const target = cards.current[i % cards.current.length]

  const start = () => {
    cards.current = deck(); endAt.current = Date.now() + TIME * 1000; saved.current = false
    setScore(0); setMiss(0); setCombo(0); setPicked(null); setI(0); setLeft(TIME); setPhase('play'); play('click', sound)
  }
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => {
      const l = Math.max(0, (endAt.current - Date.now()) / 1000)
      setLeft(l)
      if (l <= 0) setPhase('over')
    }, 100)
    return () => clearInterval(t)
  }, [phase])
  useEffect(() => { // результат сохраняем один раз
    if (phase === 'over' && !saved.current) { saved.current = true; play('finish', sound); onFinish(score) }
  }, [phase])

  const judge = (id) => {
    if (phase !== 'play' || picked !== null) return
    setPicked(id)
    if (id === target.id) {
      setScore((s) => s + 1); setCombo((c) => { play(c + 1 >= 3 ? 'combo' : 'ok', sound); return c + 1 })
    } else {
      setMiss((m) => m + 1); setCombo(0); endAt.current -= PENALTY * 1000; play('bad', sound)
    }
    setTimeout(() => { setPicked(null); setI((n) => n + 1) }, id === target.id ? 600 : 1000)
  }

  const isRecord = score > record
  if (phase === 'ready') return (
    <section className="lesson">
      <header className="top"><button className="icon" onClick={onExit} aria-label="Выйти"><Icon name="x" size={20} /></button></header>
      <div className="pop center">
        <Tile name="timer" color="#f59e0b" size={84} />
        <h1>Блиц</h1>
        <p className="text">60 секунд. Находите названные страны на глобусе: верный ответ даёт +1 очко, ошибка отнимает {PENALTY} секунды. Вращайте глобус пальцем, приближайте щипком.</p>
        <p className="hint-keys">Ваш рекорд: {record}</p>
        <button className="btn" onClick={start}>Старт</button>
      </div>
    </section>
  )
  if (phase === 'over') return (
    <section className="lesson">
      <div className="pop center result">
        {isRecord && <Confetti />}
        <Tile name={isRecord ? 'trophy' : 'timer'} color="#f59e0b" size={84} />
        <h1>{isRecord ? 'Новый рекорд!' : 'Время вышло'}</h1>
        <div className="bigscore">{score}</div>
        <p className="text">найдено стран · ошибок: {miss} · +{score * 5} XP{!isRecord && record > 0 ? ` · рекорд ${record}` : ''}</p>
        <button className="btn" onClick={start}>Ещё раз</button>
        <button className="btn ghost" onClick={onExit}>Выйти</button>
      </div>
    </section>
  )
  return (
    <section className="lesson">
      <header className="top">
        <button className="icon" onClick={onExit} aria-label="Выйти"><Icon name="x" size={20} /></button>
        <div className={`bar flex ${left < 10 ? 'low' : ''}`}><i style={{ width: `${(left / TIME) * 100}%`, transition: 'none' }} /></div>
        <div className="pills">
          {combo >= 2 && <span className="chip hot" key={combo}><Icon name="flame" size={14} />×{combo}</span>}
          <span className="chip"><Icon name="target" size={14} />{score}</span>
        </div>
      </header>
      <div className="pop">
        <small className="kicker"><Icon name="timer" size={14} /> {Math.ceil(left)} с</small>
        <h2 className="question">Найдите: {nameOf(target.id)}</h2>
        <WorldMap region="world" picked={picked} answer={target.id} onSelect={judge} />
        <p className="hint-keys">{picked !== null ? (picked === target.id ? 'Верно!' : `Ошибка −${PENALTY} с. Это ${nameOf(target.id)}, столица — ${INFO[target.id].cap}`) : 'Коснитесь страны на глобусе'}</p>
      </div>
    </section>
  )
}
