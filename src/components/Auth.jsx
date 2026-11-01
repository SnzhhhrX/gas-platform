import { useEffect, useState } from 'react'
import { isOnline } from '../lib/api'
import { checkUsername, hasLocalAccounts, login, recover, register } from '../lib/auth'
import { getTheme, setTheme } from '../lib/theme'
import { randomAv } from './AvatarArt'
import { Mascot } from './Mascot'
import { Wordmark } from './Wordmark'
import { LangPick } from './LangPick'
import { Icon, Tile } from './Icon'

const NEXT = { auto: 'light', light: 'dark', dark: 'auto' }, ICON = { auto: 'sparkles', light: 'sun', dark: 'moon' }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, NAME = /^[a-zA-Z0-9_]{3,20}$/
const LABELS = ['Слишком короткий', 'Слабый', 'Средний', 'Хороший', 'Отличный']
const strength = (p) => (p.length < 8 ? 0 : Math.min(4, 1 + (p.length >= 12) + (/[a-zа-я]/.test(p) && /[A-ZА-Я]/.test(p)) + (/\d/.test(p) && /[^\wа-яА-Я\s]|_/.test(p))))

const Password = ({ label, value, onChange, autoComplete, meter, placeholder = 'Минимум 8 символов' }) => {
  const [show, setShow] = useState(false), s = strength(value)
  return (
    <label>{label}
      <span className="pass">
        <input type={show ? 'text' : 'password'} required value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} />
        <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}><Icon name={show ? 'eyeoff' : 'eye'} size={18} /></button>
      </span>
      {meter && value && <span className={`meter s${s}`}><span>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= s ? 'on' : ''} />)}</span><small>{LABELS[s]}</small></span>}
    </label>
  )
}

// Код восстановления: показывается один раз; без него пароль не вернуть (почты в проекте нет)
function RecoveryCode({ code, onDone }) {
  const [saved, setSaved] = useState(false), [copied, setCopied] = useState(false)
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }
  const download = () => {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([`GAS — код восстановления доступа\n\n${code}\n\nХраните в надёжном месте. Код одноразовый: после использования выдаётся новый.\n`], { type: 'text/plain' })), download: 'gas-recovery-code.txt' })
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  return (
    <div className="app auth">
      <div className="logo"><Tile name="key" color="#f59e0b" size={80} /></div>
      <h1>Сохраните код восстановления</h1>
      <p className="text">Если забудете пароль, только этот код вернёт доступ к аккаунту. Мы не храним его в открытом виде и больше не покажем.</p>
      <div className="code" aria-label="Код восстановления">{code}</div>
      <div className="duo">
        <button className="btn ghost" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={16} /> {copied ? 'Скопировано' : 'Копировать'}</button>
        <button className="btn ghost" onClick={download}><Icon name="download" size={16} /> Скачать</button>
      </div>
      <label className="check"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> Я сохранил(а) код в надёжном месте</label>
      <button className="btn" disabled={!saved} onClick={onDone}>Продолжить</button>
    </div>
  )
}

export default function Auth({ onAuth }) {
  const server = isOnline()
  const [mode, setMode] = useState('register') // register | login | recover
  const [step, setStep] = useState(1)
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', code: '', avatar: randomAv(), goal: 30 })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [theme, setT] = useState(getTheme)
  const [avail, setAvail] = useState(null) // { ok, text }
  const [done, setDone] = useState(null) // { id, code } — показать код восстановления
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))
  const field = (k) => ({ value: f[k], onChange: (e) => set(k)(e.target.value) })
  const signup = mode === 'register'
  const cycle = () => { const t = NEXT[theme]; setTheme(t); setT(t) }
  const go = (m) => { setMode(m); setStep(1); setError('') }

  // проверка логина «на лету»
  useEffect(() => {
    const u = f.username.trim()
    if (!server || !signup || !u) return setAvail(null)
    if (!NAME.test(u)) return setAvail({ ok: false, text: '3–20 символов: латиница, цифры, «_»' })
    setAvail({ ok: null, text: 'Проверяем…' })
    const t = setTimeout(() => checkUsername(u.toLowerCase()).then((r) => setAvail({ ok: r.available, text: r.available ? 'Логин свободен' : r.reason })).catch(() => setAvail(null)), 400)
    return () => clearTimeout(t)
  }, [f.username, mode])

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (signup) {
      if (f.name.trim().length < 2) return setError('Введите имя — минимум 2 символа.')
      if (!EMAIL.test(f.email.trim())) return setError('Введите корректный email.')
      if (server && !avail?.ok) return setError(avail?.text || 'Придумайте логин.')
      if (strength(f.password) === 0) return setError('Пароль должен быть не короче 8 символов.')
    }
    setBusy(true)
    try {
      if (signup) {
        const r = await register({ ...f, theme })
        onAuth(r.id)
      } else if (mode === 'recover') {
        const r = await recover(f.email, f.code, f.password)
        setDone({ id: r.id, code: r.recoveryCode })
      } else onAuth(await login(f.email, f.password))
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  if (done) return <RecoveryCode code={done.code} onDone={() => onAuth(done.id)} />
  const idLabel = signup || !server ? 'Email' : 'Email или логин'

  return (
    <div className="app auth">
      <LangPick className="corner-l" />
      <button className="icon corner" onClick={cycle} aria-label={`Тема: ${theme}`}><Icon name={ICON[theme]} size={18} /></button>
      <div className="logo"><Mascot mood={mode === 'recover' ? 'think' : 'wave'} size={128} /></div>
      <h1 className="wordmark"><Wordmark height={40} /></h1>
      <p className="text">{mode === 'recover' ? 'Введите код восстановления. Его можно создать в профиле: Безопасность → Код восстановления.' : 'География за 5 минут в день: уроки, игры на глобусе и друзья.'}</p>

      {mode !== 'recover' && (
        <div className="tabs">
          <button className={signup ? 'on' : ''} onClick={() => go('register')}>Регистрация</button>
          <button className={mode === 'login' ? 'on' : ''} onClick={() => go('login')}>Вход</button>
        </div>
      )}

      <form onSubmit={submit} className="form">
        {(
          <>
            {signup && <label>Имя<input {...field('name')} autoComplete="name" maxLength="30" placeholder="Как вас зовут?" /></label>}
            <label>{idLabel}<input type={signup || !server ? 'email' : 'text'} required {...field('email')} autoComplete={signup ? 'email' : 'username'} autoCapitalize="none" placeholder={signup ? 'name@mail.com' : server ? 'name@mail.com или логин' : 'name@mail.com'} /></label>
            {signup && server && (
              <label>Логин
                <input {...field('username')} autoComplete="username" autoCapitalize="none" maxLength="20" placeholder="geo_fan — по нему вас найдут друзья" />
                {avail && <small className={`hintline ${avail.ok === true ? 'ok' : avail.ok === false ? 'bad' : ''}`}>{avail.text}</small>}
              </label>
            )}
            {mode === 'recover' && <label>Код восстановления<input {...field('code')} autoCapitalize="characters" autoComplete="off" placeholder="XXXX-XXXX-XXXX" /></label>}
            <Password label={mode === 'recover' ? 'Новый пароль' : 'Пароль'} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} meter={mode !== 'login'} placeholder={mode === 'login' ? 'Ваш пароль' : undefined} />
          </>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Подождите…' : signup ? 'Создать аккаунт' : mode === 'recover' ? 'Сменить пароль и войти' : 'Войти'}</button>
        {mode === 'login' && server && <button type="button" className="link" onClick={() => go('recover')}>Забыли пароль?</button>}
        {mode === 'recover' && <button type="button" className="link" onClick={() => go('login')}>← Назад ко входу</button>}
      </form>

      {signup && server && <p className="info">Пароль забудете — не страшно: код восстановления можно создать позже в профиле.</p>}
      {server && hasLocalAccounts() && signup && <p className="info">Раньше пользовались без сервера? Зарегистрируйтесь с тем же email — прогресс перенесётся.</p>}
      <small className="note">{server ? <><Icon name="shield" size={13} /> Пароль хранится в зашифрованном виде, прогресс — на сервере: заходите с любого устройства.</> : 'Сервер не найден — демо-режим: аккаунт хранится только в этом браузере (друзей нет). Запустите npm run dev.'}</small>
    </div>
  )
}
