import { Sheet } from './ui'
import { Icon } from './Icon'
import { SKILLS } from '../data/placement'
import { STATUS_LABEL, MIN_NEW_ANSWERS, practiceSince, replan } from '../lib/plan'
import { tr } from '../lib/i18n'

// «Мои навыки»: что известно по каждой теме и на чём это основано. Отсюда можно пересмотреть программу или пройти диагностику заново.
export default function Skills({ state, onClose, onReplan, onRetake }) {
  const preview = replan(state)
  const since = practiceSince(state)
  const enough = since >= MIN_NEW_ANSWERS
  return (
    <Sheet onClose={onClose}>
      {(close) => (
        <div className="skills-sheet">
          <h2>{tr('Мои навыки')}</h2>
          <div className="pl-skills">
            {SKILLS.map((k) => {
              const p = preview?.per[k.id]
              if (!p) return null
              return (
                <div key={k.id} className={`pl-skill st-${p.status}`} style={{ '--c': k.color }}>
                  <span className="pl-skill-label"><Icon name={k.icon} size={18} />{k.title}</span>
                  <span className="pl-skill-st">{tr(STATUS_LABEL[p.status])}</span>
                  {p.practice && <small>{`уроки: закреплено ${p.practice.solid} из ${p.practice.items}`}</small>}
                </div>
              )
            })}
          </div>
          <button type="button" className="btn" disabled={!enough || !preview} onClick={() => { onReplan(); close() }}>{tr('Обновить программу')}</button>
          {!enough && <p className="sk-note">{`Нужно ещё ответов в уроках: ${MIN_NEW_ANSWERS - since}`}</p>}
          <button type="button" className="btn ghost" onClick={() => { onRetake(); close() }}>{tr('Пройти диагностику заново')}</button>
        </div>
      )}
    </Sheet>
  )
}
