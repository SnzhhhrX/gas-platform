import { useEffect, useState } from 'react'
import { changePassword, deleteAccount, exportData, listSessions, newRecoveryCode, revokeOthers } from '../lib/auth'
import { Icon } from './Icon'
import { Sheet } from './ui'

const Pass = ({ label, value, onChange, auto = 'current-password' }) => (
  <label>{label}<input type="password" required value={value} onChange={(e) => onChange(e.target.value)} autoComplete={auto} /></label>
)

// Окна безопасности аккаунта: kind = password | code | devices | delete
export default function SecuritySheet({ kind, uid, onClose, onDeleted, notify }) {
  const [a, setA] = useState(''), [b, setB] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const [code, setCode] = useState(null), [sessions, setSessions] = useState(null)
  useEffect(() => { if (kind === 'devices') listSessions().then(setSessions).catch((e) => setErr(e.message)) }, [])

  const run = (fn, close) => async (e) => {
    e?.preventDefault(); setErr(''); setBusy(true)
    try { await fn(close) } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  const copy = async () => { try { await navigator.clipboard.writeText(code); notify('Код скопирован', 'check') } catch {} }

  return (
    <Sheet onClose={onClose}>
      {(close) => (
        <>
          {kind === 'password' && (
            <form className="form" onSubmit={run(async () => { await changePassword(a, b); notify('Пароль изменён. Другие устройства вышли из аккаунта.', 'check'); close() })}>
              <h1>Смена пароля</h1>
              <Pass label="Текущий пароль" value={a} onChange={setA} />
              <Pass label="Новый пароль (от 8 символов)" value={b} onChange={setB} auto="new-password" />
              {err && <p className="error" role="alert">{err}</p>}
              <button className="btn" disabled={busy}>Сменить пароль</button>
            </form>
          )}

          {kind === 'code' && (code ? (
            <div className="form">
              <h1>Новый код</h1>
              <p className="text">Старый код больше не действует. Сохраните новый — он показывается один раз.</p>
              <div className="code">{code}</div>
              <button className="btn ghost" onClick={copy}><Icon name="copy" size={16} /> Копировать</button>
              <button className="btn" onClick={close}>Готово</button>
            </div>
          ) : (
            <form className="form" onSubmit={run(async () => setCode(await newRecoveryCode(a)))}>
              <h1>Код восстановления</h1>
              <p className="text">С его помощью можно сбросить пароль, если вы его забудете. Выпуск нового кода отключает старый.</p>
              <Pass label="Ваш пароль" value={a} onChange={setA} />
              {err && <p className="error" role="alert">{err}</p>}
              <button className="btn ghost danger" disabled={busy}>Выпустить новый код</button>
            </form>
          ))}

          {kind === 'devices' && (
            <div className="form">
              <h1>Ваши устройства</h1>
              {err && <p className="error" role="alert">{err}</p>}
              {!sessions ? <div className="card skeleton" style={{ height: 90 }} /> : sessions.map((s) => (
                <div key={s.id} className="srow"><div><b><Icon name="monitor" size={15} /> {s.device}</b><small>Вход: {new Date(s.createdAt).toLocaleDateString('ru-RU')}{s.current ? ' · это устройство' : ''}</small></div></div>
              ))}
              {sessions?.length > 1 && <button className="btn ghost danger" disabled={busy} onClick={run(async () => { await revokeOthers(); setSessions((l) => l.filter((s) => s.current)); notify('Вы вышли на всех других устройствах', 'check') })}>Выйти на всех других устройствах</button>}
            </div>
          )}

          {kind === 'delete' && (
            <form className="form" onSubmit={run(async () => { await deleteAccount(uid, a); onDeleted() })}>
              <h1>Удалить аккаунт?</h1>
              <p className="text">Аккаунт, прогресс, друзья и рейтинг будут удалены без возможности восстановления. Сначала можно скачать свои данные в настройках.</p>
              <Pass label="Введите пароль для подтверждения" value={a} onChange={setA} />
              {err && <p className="error" role="alert">{err}</p>}
              <button className="btn danger" disabled={busy}>Удалить навсегда</button>
              <button type="button" className="btn ghost" onClick={close}>Отмена</button>
            </form>
          )}
        </>
      )}
    </Sheet>
  )
}
