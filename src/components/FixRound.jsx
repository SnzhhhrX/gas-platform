import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { Mascot } from './Mascot'
import { optLetter } from '../lib/i18n'
import { play } from '../lib/sound'
import { checkTyped } from '../lib/typed'
import { seeded } from '../lib/vary'

// Второй подход к ошибкам урока: те же вопросы ещё раз, варианты в другом порядке.
// На счёт, XP, сердца и интервальное повторение этот подход не влияет: он нужен, чтобы сразу проверить, что ошибка понята.
export default function FixRound({ items, sound = true, onDone }) {
  const list = useMemo(() => items.map((w, n) => {
    if (w.type === 'input' || w.type === 'tf' || !Array.isArray(w.options) || typeof w.answer !== 'number') return w
    const r = seeded(`fix|${w.q}|${n}`)
    const idx = w.options.map((_, i) => i)
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]] }
    return { ...w, options: idx.map((i) => w.options[i]), answer: idx.indexOf(w.answer) }
  }), [items])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [typed, setTyped] = useState('')
  const [right, setRight] = useState(0)
  const q = list[i]
  const isInput = q?.type === 'input'
  const ok = picked !== null && (isInput ? checkTyped(q, picked) : picked === q.answer)

  const answer = (v) => {
    if (picked !== null) return
    const good = isInput ? checkTyped(q, v) : v === q.answer
    play(good ? 'ok' : 'bad', sound)
    if (good) setRight((r) => r + 1)
    setPicked(v)
  }
  const next = () => {
    if (i + 1 >= list.length) return onDone(right)
    setI(i + 1); setPicked(null); setTyped('')
  }
  if (!q) return null

  return (
    <div className="pop fix-round">
      <small className="kicker"><Icon name="redo" size={14} /> {`Исправляем ошибки · ${i + 1}/${list.length}`}</small>
      <h2 className="question">{q.q}</h2>
      {isInput ? (
        <form className="typed" onSubmit={(e) => { e.preventDefault(); if (typed.trim()) answer(typed.trim()) }}>
          <input autoFocus value={typed} disabled={picked !== null} onChange={(e) => setTyped(e.target.value)} placeholder="Введите ответ" autoComplete="off" spellCheck="false" aria-label="Ваш ответ" className={picked === null ? '' : ok ? 'right' : 'wrong'} />
          {picked === null && <button className="btn" disabled={!typed.trim()}>Проверить</button>}
        </form>
      ) : (
        <div className="options" role="listbox" aria-label="Варианты ответа">
          {q.options.map((o, k) => {
            const st = picked === null ? '' : k === q.answer ? 'right' : picked === k ? 'wrong' : 'dim'
            return <button key={k} type="button" role="option" aria-selected={picked === k} className={`option ${st}`} disabled={picked !== null} onClick={() => answer(k)}><span>{optLetter(k)}</span>{o}</button>
          })}
        </div>
      )}
      {picked !== null && (
        <div className={`feedback ${ok ? 'right' : 'wrong'}`}>
          <div className="fb-head"><Mascot mood={ok ? 'happy' : 'think'} size={52} /><div><b>{ok ? 'Теперь верно' : 'Ещё не то'}</b></div></div>
          {!ok && isInput && <p>Правильный ответ: <b>{q.answers?.[0]}</b></p>}
          {!ok && !isInput && <p>Верно: <b>{q.options[q.answer]}</b></p>}
          {!ok && !isInput && q.miss?.[q.options[picked]] && <p className="fb-miss">{q.miss[q.options[picked]]}</p>}
          {q.why && <p>{q.why}</p>}
          <button className="btn dark" onClick={next}>{i + 1 >= list.length ? 'Готово' : 'Дальше'}</button>
        </div>
      )}
    </div>
  )
}
