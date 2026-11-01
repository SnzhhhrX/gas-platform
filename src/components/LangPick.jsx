import { useEffect, useRef, useState } from 'react'
import { LANGS, setLang, tr, useLang } from '../lib/i18n'
import { Icon } from './Icon'

const CODE = { ru: 'RU', kk: 'KZ', en: 'EN' }
const HINT = { ru: 'Русский', kk: 'Казахский', en: 'Английский' }

// Пункты языка: код, название на самом языке, подпись на языке интерфейса и галочка у выбранного
function Options({ lang, onPick }) {
  return LANGS.map(([id, name]) => {
    const hint = tr(HINT[id])
    return (
    <button key={id} type="button" role="menuitemradio" aria-checked={lang === id} className={`lang-opt ${lang === id ? 'on' : ''}`} onClick={() => onPick(id)}>
      <span className="lang-code">{CODE[id]}</span>
      <span className="lang-name"><b>{name}</b>{hint !== name && <small>{hint}</small>}</span>
      {lang === id && <Icon name="check" size={18} className="lang-ok" />}
    </button>
    )
  })
}

// Компактный выбор языка: пилюля с кодом, по нажатию — выпадающее меню
export function LangPick({ className = '' }) {
  const lang = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const out = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', out); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div ref={ref} className={`lang-pick ${open ? 'open' : ''} ${className}`}>
      <button type="button" className="lang-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Язык / Language">
        <Icon name="globe" size={16} /><span>{CODE[lang]}</span>
        <svg className="lang-car" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && <div className="lang-menu" role="menu"><Options lang={lang} onPick={(id) => { setLang(id); setOpen(false) }} /></div>}
    </div>
  )
}

// Список языков для настроек
export function LangList() {
  const lang = useLang()
  return <div className="lang-list" role="menu"><Options lang={lang} onPick={setLang} /></div>
}
