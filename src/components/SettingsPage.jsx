import { useState } from 'react'
import { viaServer } from '../lib/api'
import { deleteAccount, exportData, emailOf, usernameOf } from '../lib/auth'
import { play } from '../lib/sound'
import { THEMES, setTheme } from '../lib/theme'
import SecuritySheet from './Security'
import Skills from './Skills'
import { Icon } from './Icon'
import { Confirm, Segmented, Toggle } from './ui'
import { tr } from '../lib/i18n'
import { LangList } from './LangPick'

/**
 * Full-screen settings — opened from Profile.
 * Categories: Appearance, Sound, Privacy, Account, Learning, Data.
 */
export default function SettingsPage({
  uid,
  state,
  sync,
  updateProfile,
  openPro,
  reset,
  retake,
  onReplan,
  onRedo,
  onLogout,
  onDelete,
  notify,
  onClose,
}) {
  const { profile } = state
  const server = viaServer()
  const soundOn = profile.sound !== false
  const [sec, setSec] = useState(null)
  const [ask, setAsk] = useState(null)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [section, setSection] = useState(null) // null = list

  const pickTheme = (t) => {
    setTheme(t)
    updateProfile({ theme: t })
  }

  const toggleSound = (next) => {
    updateProfile({ sound: next })
    if (next) play('ok', true)
  }

  if (section === 'account') {
    return (
      <SettingsSection title="Аккаунт" onBack={() => setSection(null)}>
        <div className="card group menu">
          <div className="srow">
            <div>
              <b>{profile.name || 'Без имени'}</b>
              <small>{usernameOf(uid) ? `@${usernameOf(uid)}` : emailOf(uid) || 'локальный'}</small>
            </div>
          </div>
          {!state.pro && (
            <button onClick={openPro}>
              <Icon name="crown" size={18} />
              <span>
                <b>Открыть GAS Pro</b>
                <small>Безлимит и углублённый модуль</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          )}
          <button
            onClick={() =>
              setAsk({
                title: 'Выйти из аккаунта?',
                text: server
                  ? 'Прогресс сохранён на сервере. Войти снова можно с email и паролем.'
                  : 'Прогресс остаётся в этом браузере.',
                ok: 'Выйти',
                danger: true,
                mood: 'wave',
                onOk: onLogout,
              })
            }
          >
            <Icon name="out" size={18} />
            <span>
              <b>Выйти</b>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        </div>
        {ask && <Confirm {...ask} onClose={() => setAsk(null)} />}
      </SettingsSection>
    )
  }

  if (section === 'security') {
    return (
      <SettingsSection title="Безопасность" onBack={() => setSection(null)}>
        {server ? (
          <div className="card group menu">
            <button onClick={() => setSec('password')}>
              <Icon name="lock" size={18} />
              <span>
                <b>Сменить пароль</b>
              </span>
              <Icon name="chevron" size={18} />
            </button>
            <button onClick={() => setSec('code')}>
              <Icon name="key" size={18} />
              <span>
                <b>Код восстановления</b>
                <small>Если забыли пароль</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
            <button onClick={() => setSec('devices')}>
              <Icon name="monitor" size={18} />
              <span>
                <b>Устройства</b>
                <small>Где выполнен вход</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          </div>
        ) : (
          <p className="settings-hint">Войдите в аккаунт, чтобы управлять безопасностью.</p>
        )}
        {sec && (
          <SecuritySheet
            kind={sec}
            uid={uid}
            onClose={() => setSec(null)}
            onDeleted={() => {
              setSec(null)
              onDelete()
            }}
            notify={notify}
          />
        )}
      </SettingsSection>
    )
  }

  if (section === 'learning') {
    return (
      <SettingsSection title="Обучение" onBack={() => setSection(null)}>
        <div className="card group menu">
          <button
            onClick={() =>
              setAsk({
                title: 'Пройти тест уровня заново?',
                text: 'Текущая программа и результат теста будут заменены новыми — вернуть их нельзя. Пройденные уроки и XP сохранятся.',
                ok: 'Пройти заново',
                onOk: retake,
              })
            }
          >
            <Icon name="redo" size={18} />
            <span>
              <b>Пройти тест уровня снова</b>
              <small>Порядок тем может измениться</small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
          <button
            onClick={() =>
              setAsk({
                title: 'Сбросить прогресс?',
                text: 'XP, серия и пройденные уроки обнулятся. Профиль сохранится.',
                ok: 'Сбросить',
                danger: true,
                onOk: reset,
              })
            }
          >
            <Icon name="trash" size={18} />
            <span>
              <b>Сбросить прогресс</b>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        </div>
        {ask && <Confirm {...ask} onClose={() => setAsk(null)} />}
      </SettingsSection>
    )
  }

  if (section === 'data') {
    return (
      <SettingsSection title={tr('Данные')} onBack={() => setSection(null)}>
        <div className="card group menu">
          <button onClick={() => setSkillsOpen(true)}>
            <Icon name="target" size={18} />
            <span>
              <b>{tr('Навыки и программа')}</b>
              <small>{tr('Состояние тем и обновление программы')}</small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
          <button onClick={() => exportData(uid)}>
            <Icon name="download" size={18} />
            <span>
              <b>Экспорт данных</b>
              <small>Скачать прогресс JSON</small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
          <button
            className="danger"
            onClick={() =>
              server
                ? setSec('delete')
                : setAsk({
                    title: 'Удалить аккаунт?',
                    text: 'Все данные будут удалены без возможности восстановления.',
                    ok: 'Удалить',
                    danger: true,
                    onOk: () => deleteAccount(uid).then(onDelete),
                  })
            }
          >
            <Icon name="trash" size={18} />
            <span>
              <b>Удалить аккаунт</b>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        </div>
        {skillsOpen && <Skills state={state} onClose={() => setSkillsOpen(false)} onReplan={onReplan} onRetake={onRedo} />}
        {sec === 'delete' && (
          <SecuritySheet
            kind="delete"
            uid={uid}
            onClose={() => setSec(null)}
            onDeleted={() => {
              setSec(null)
              onDelete()
            }}
            notify={notify}
          />
        )}
        {ask && <Confirm {...ask} onClose={() => setAsk(null)} />}
      </SettingsSection>
    )
  }

  // Main list
  return (
    <div className="settings-page">
      <header className="sheet-head">
        <button className="icon" onClick={onClose} aria-label="Назад">
          <Icon name="back" size={20} />
        </button>
        <h2>{tr('Настройки')}</h2>
        <span style={{ width: 40 }} />
      </header>

      <div className="settings-body">
        <h3 className="settings-section">{tr('Язык')}</h3>
        <div className="card group">
          <div className="srow col">
            <b>{tr('Язык')}</b>
            <small>{tr('Язык интерфейса и уроков.')}</small>
            <LangList />
          </div>
        </div>

        <h3 className="settings-section">{tr('Оформление')}</h3>
        <div className="card group">
          <div className="srow col">
            <b>Тема</b>
            <small>Светлая, тёмная или как в системе</small>
            <Segmented value={profile.theme || 'auto'} options={THEMES} onChange={pickTheme} />
          </div>
        </div>

        <h3 className="settings-section">Звук</h3>
        <div className="card group">
          <div className="srow">
            <div>
              <b>Звуки уроков</b>
              <small>Ответы, комбо и достижения</small>
            </div>
            <Toggle on={soundOn} onChange={toggleSound} label="Звуки" />
          </div>
        </div>

        {server && (
          <>
            <h3 className="settings-section">Приватность</h3>
            <div className="card group">
              <div className="srow">
                <div>
                  <b>Показывать в рейтинге</b>
                  <small>Друзья видят вас всегда</small>
                </div>
                <Toggle
                  on={!profile.hidden}
                  onChange={(v) => updateProfile({ hidden: !v })}
                  label="Показывать в рейтинге"
                />
              </div>
            </div>
          </>
        )}

        <h3 className="settings-section">Разделы</h3>
        <div className="card group menu">
          <button onClick={() => setSection('account')}>
            <Icon name="user" size={18} />
            <span>
              <b>Аккаунт</b>
            </span>
            <Icon name="chevron" size={18} />
          </button>
          {server && (
            <button onClick={() => setSection('security')}>
              <Icon name="shield" size={18} />
              <span>
                <b>Безопасность</b>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          )}
          <button onClick={() => setSection('learning')}>
            <Icon name="grad" size={18} />
            <span>
              <b>Обучение</b>
            </span>
            <Icon name="chevron" size={18} />
          </button>
          <button onClick={() => setSection('data')}>
            <Icon name="box" size={18} />
            <span>
              <b>Данные</b>
            </span>
            <Icon name="chevron" size={18} />
          </button>
        </div>

        <h3 className="settings-section">О приложении</h3>
        <div className="card group">
          <div className="srow">
            <div>
              <b>GAS Geography</b>
              <small>Учи географию коротко и с картой</small>
            </div>
          </div>
        </div>

        <p className="settings-hint">
          Изменения сохраняются сразу. Тема синхронизируется между устройствами.
        </p>
      </div>
    </div>
  )
}

function SettingsSection({ title, onBack, children }) {
  return (
    <div className="settings-page">
      <header className="sheet-head">
        <button className="icon" onClick={onBack} aria-label="Назад">
          <Icon name="back" size={20} />
        </button>
        <h2>{title}</h2>
        <span style={{ width: 40 }} />
      </header>
      <div className="settings-body">{children}</div>
    </div>
  )
}
