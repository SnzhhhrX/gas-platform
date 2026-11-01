import { useState } from 'react'
import { INFO } from '../data/capitals'
import { Avatar, GoalPicker, FRAMES, Portal } from './ui'
import { Icon } from './Icon'
import { tr } from '../lib/i18n'
import AvatarBuilder from './AvatarBuilder'
import { avBg } from './AvatarArt'

const COUNTRIES = Object.entries(INFO).map(([id, c]) => [id, c.name]).sort((a, b) => a[1].localeCompare(b[1]))
const Select = ({ value, onChange, empty, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">{empty}</option>
    {(options || COUNTRIES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
  </select>
)

export default function EditProfile({ profile, onSave, onClose }) {
  const [f, setF] = useState({ frame: '', ...profile })
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))
  const ok = f.name.trim().length >= 2
  return (
    <Portal><div className="subpage" role="dialog" aria-label="Редактор профиля">
      <header className="subpage-bar">
        <button type="button" className="icon" onClick={onClose} aria-label="Назад"><Icon name="back" size={20} /></button>
        <h1>{tr('Редактор профиля')}</h1>
      </header>
        <form className="form edit-profile" onSubmit={(e) => {
          e.preventDefault()
          if (!ok) return
          onSave({
            ...f,
            name: f.name.trim(),
            bio: (f.bio || '').trim(),
            wish: (f.wish || '').trim(),
            frame: f.frame || '',
          })
          onClose()
        }}>
          <div className="edit-preview">
            <Avatar emoji={f.avatar} name={f.name} color={f.color} frame={f.frame} size={64} />
            <div>
              <b>{f.name.trim() || 'Ваше имя'}</b>
            </div>
          </div>

          <label>Имя
            <input
              value={f.name}
              maxLength={30}
              onChange={(e) => set('name')(e.target.value)}
              placeholder="Как вас зовут"
              autoComplete="name"
            />
          </label>
          <label>О себе
            <textarea rows={2} maxLength={160} value={f.bio || ''} onChange={(e) => set('bio')(e.target.value)} placeholder="Например: люблю карты и столицы" />
          </label>

          <label>Аватар</label>
          <AvatarBuilder value={f.avatar} onChange={(v) => setF((x) => ({ ...x, avatar: v, color: avBg(v) ?? x.color }))} />
          <label>Рамка аватара</label>
          <div className="picker frames">
            {FRAMES.map((fr) => (
              <button type="button" key={fr.id || 'none'} className={f.frame === fr.id ? 'on' : ''} onClick={() => set('frame')(fr.id)}>
                <Avatar emoji={f.avatar} name={f.name} color={f.color} frame={fr.id} size={36} />
                <small>{fr.label}</small>
              </button>
            ))}
          </div>


          <label>Страна<Select value={f.country || ''} onChange={set('country')} empty="Не указана" /></label>
          <label>Любимая страна<Select value={f.favorite || ''} onChange={set('favorite')} empty="Не выбрана" /></label>
          <label>Мечтаю посетить<input value={f.wish || ''} maxLength="40" onChange={(e) => set('wish')(e.target.value)} placeholder="Например: Исландия и Норвегия" /></label>
          <label>Дневная цель XP</label>
          <GoalPicker value={f.goal} onChange={set('goal')} />
          <div className="sticky-save">
            <button className="btn" type="submit" disabled={!ok}>{tr('Сохранить изменения')}</button>
            <button className="btn ghost" type="button" onClick={onClose}>{tr('Отмена')}</button>
          </div>
        </form>
    </div></Portal>
  )
}
