import { useEffect, useState } from 'react'
import { tr } from '../lib/i18n'
import { Icon } from './Icon'

// Интерактивные задания урока (кроме выбора варианта):
//  order — расставить элементы по порядку: { type: 'order', q, items: [в верном порядке], ends?: ['от', 'до'], why }
//  match — соединить пары: { type: 'match', q, pairs: [[слева, справа], …], why }
// Ответ уходит в урок объектом { ok, text }: урок сам считает очки, сердца и показывает пояснение.

const shuffle = (n, avoidIdentity = true) => {
  for (let t = 0; t < 8; t++) {
    const a = [...Array(n).keys()].sort(() => Math.random() - 0.5)
    if (!avoidIdentity || n < 2 || a.some((v, i) => v !== i)) return a
  }
  return [...Array(n).keys()].reverse()
}

export function OrderTask({ q, done, hinted, onSubmit }) {
  const n = q.items.length
  const [pool] = useState(() => shuffle(n))
  const [seq, setSeq] = useState([])
  useEffect(() => { if (hinted && seq[0] !== 0) setSeq((s) => [0, ...s.filter((x) => x !== 0)]) }, [hinted])
  const free = pool.filter((i) => !seq.includes(i))
  const put = (i) => !done && setSeq((s) => [...s, i])
  const take = (i) => !done && !(hinted && i === 0 && seq[0] === 0) && setSeq((s) => s.filter((x) => x !== i))
  const ok = seq.length === n && seq.every((v, i) => v === i)
  return (
    <div className="task order">
      {q.ends && <div className="ord-ends"><span>{q.ends[0]}</span><Icon name="chevron" size={14} /><span>{q.ends[1]}</span></div>}
      <ol className="ord-seq" aria-label={tr('Ваш порядок')}>
        {[...Array(n).keys()].map((k) => {
          const i = seq[k]
          const st = !done || i == null ? '' : i === k ? 'right' : 'wrong'
          return (
            <li key={k} className={`ord-slot ${i == null ? 'empty' : 'full'} ${st}`}>
              <span className="ord-n">{k + 1}</span>
              {i == null ? <span className="ord-ph">{k === seq.length && !done ? tr('Выберите ниже') : ''}</span>
                : <button type="button" className="ord-item" onClick={() => take(i)} disabled={done}>{q.items[i]}</button>}
            </li>
          )
        })}
      </ol>
      {!done && free.length > 0 && (
        <div className="ord-pool">
          {free.map((i) => <button key={i} type="button" className="ord-chip" onClick={() => put(i)}>{q.items[i]}</button>)}
        </div>
      )}
      {done && !ok && <p className="task-right"><b>{tr('Верный порядок')}:</b> {q.items.join(' → ')}</p>}
      {!done && <button type="button" className="btn" disabled={seq.length < n} onClick={() => onSubmit({ ok, text: seq.map((i) => q.items[i]).join(' → ') })}>{tr('Проверить')}</button>}
    </div>
  )
}

const TINTS = ['#0ea5e9', '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#6366f1']

export function MatchTask({ q, done, hinted, onSubmit }) {
  const n = q.pairs.length
  const [left] = useState(() => shuffle(n, false))
  const [right] = useState(() => shuffle(n))
  const [link, setLink] = useState({}) // индекс левого → индекс правого (индексы исходных пар)
  const [act, setAct] = useState(null)
  useEffect(() => {
    if (!hinted) return
    const l = left.find((i) => link[i] !== i)
    if (l != null) setLink((m) => { const x = Object.fromEntries(Object.entries(m).filter(([k, v]) => v !== l && +k !== l)); return { ...x, [l]: l } })
  }, [hinted])
  const order = Object.keys(link).map(Number)
  const tint = (l) => TINTS[order.indexOf(l) % TINTS.length]
  const pickL = (l) => { if (done) return; if (link[l] != null) setLink(({ [l]: _, ...m }) => m); setAct(l) }
  const pickR = (r) => {
    if (done || act == null) return
    setLink((m) => { const x = Object.fromEntries(Object.entries(m).filter(([, v]) => v !== r)); return { ...x, [act]: r } })
    setAct(left.find((i) => i !== act && link[i] == null) ?? null)
  }
  const owner = (r) => { const e = Object.entries(link).find(([, v]) => v === r); return e ? Number(e[0]) : null }
  const all = order.length === n
  const ok = all && order.every((l) => link[l] === l)
  return (
    <div className="task match">
      <p className="mt-tip">{done ? '' : act == null ? tr('Выберите слева, затем пару справа') : tr('Теперь выберите пару справа')}</p>
      <div className="mt-cols">
        <div className="mt-col">
          {left.map((l) => {
            const st = done ? (link[l] === l ? 'right' : 'wrong') : act === l ? 'act' : link[l] != null ? 'on' : ''
            return <button key={l} type="button" className={`mt-item ${st}`} style={link[l] != null && !done ? { '--t': tint(l) } : undefined} onClick={() => pickL(l)} disabled={done}>{q.pairs[l][0]}</button>
          })}
        </div>
        <div className="mt-col">
          {right.map((r) => {
            const o = owner(r)
            const st = done ? (o === r ? 'right' : o != null ? 'wrong' : '') : o != null ? 'on' : ''
            return <button key={r} type="button" className={`mt-item ${st}`} style={o != null && !done ? { '--t': tint(o) } : undefined} onClick={() => pickR(r)} disabled={done || act == null}>{q.pairs[r][1]}</button>
          })}
        </div>
      </div>
      {done && !ok && <ul className="task-right mt-key">{q.pairs.map(([a, b]) => <li key={a}><b>{a}</b> — {b}</li>)}</ul>}
      {!done && <button type="button" className="btn" disabled={!all} onClick={() => onSubmit({ ok, text: order.map((l) => `${q.pairs[l][0]} — ${q.pairs[link[l]][1]}`).join('; ') })}>{tr('Проверить')}</button>}
    </div>
  )
}
