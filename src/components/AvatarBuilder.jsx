import { useState } from 'react'
import { Icon } from './Icon'
import { AvatarArt, TABS, encodeAv, parseAv, randomAv } from './AvatarArt'

// Конструктор аватара: крупный предпросмотр, вкладки частей, варианты показаны на вашем же персонаже
export default function AvatarBuilder({ value, onChange }) {
  const cfg = parseAv(value) ?? parseAv('av:11000000')
  const [tab, setTab] = useState(0)
  const t = TABS[tab]
  return (
    <div className="avb">
      <div className="avb-top">
        <div className="avb-big"><AvatarArt cfg={cfg} /></div>
        <button type="button" className="btn ghost" onClick={() => onChange(randomAv())}><Icon name="sparkles" size={16} /> Случайный</button>
      </div>
      <div className="avb-tabs" role="tablist">
        {TABS.map((x, k) => <button type="button" role="tab" key={x.label} className={k === tab ? 'on' : ''} onClick={() => setTab(k)}>{x.label}</button>)}
      </div>
      <div className="avb-grid">
        {Array.from({ length: t.n }, (_, v) => {
          const c = [...cfg]; c[t.i] = v
          return <button type="button" key={v} className={cfg[t.i] === v ? 'on' : ''} onClick={() => onChange(encodeAv(c))} aria-label={`${t.label}: вариант ${v + 1}`}><AvatarArt cfg={c} /></button>
        })}
      </div>
    </div>
  )
}
