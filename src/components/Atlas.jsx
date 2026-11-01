import { useMemo, useState } from 'react'
import { INFO } from '../data/capitals'
import { COUNTRIES, nameOf } from '../data/world'
import { Icon } from './Icon'
import WorldMap from './WorldMap'

// Атлас: свободное изучение. Коснитесь страны или найдите её через поиск.
const named = COUNTRIES.filter((c) => INFO[c.id]).sort((a, b) => nameOf(a.id).localeCompare(nameOf(b.id)))

export default function Atlas({ onExit }) {
  const [sel, setSel] = useState(null)
  const [focus, setFocus] = useState(null)
  const [q, setQ] = useState('')
  const found = useMemo(() => (q.trim() ? named.filter((c) => nameOf(c.id).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5) : []), [q])
  const go = (id) => { setSel(id); setFocus(id); setQ('') }
  const random = () => go(named[Math.floor(Math.random() * named.length)].id)

  return (
    <section className="lesson">
      <header className="top">
        <button className="icon" onClick={onExit} aria-label="Выйти"><Icon name="x" size={20} /></button>
        <label className="search"><Icon name="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти страну" aria-label="Поиск страны" /></label>
        <button className="icon" onClick={random} aria-label="Случайная страна"><Icon name="compass" size={20} /></button>
      </header>
      {found.length > 0 && <div className="found">{found.map((c) => <button key={c.id} onClick={() => go(c.id)}>{nameOf(c.id)}<small>{INFO[c.id].cap}</small></button>)}</div>}
      <div className="pop">
        <WorldMap region="world" selected={sel} onSelect={setSel} focusId={focus} />
        <div className="atlas-info">
          {sel ? <><b>{nameOf(sel)}</b><span>{INFO[sel] ? `Столица: ${INFO[sel].cap}` : 'Столица не указана'}</span></> : <span>Коснитесь страны, чтобы узнать её название и столицу</span>}
        </div>
      </div>
    </section>
  )
}
