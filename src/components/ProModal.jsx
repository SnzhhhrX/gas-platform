import { useEffect, useState } from 'react'
import { Mascot } from './Mascot'
import { olympiadLessons } from '../data/courses'
import { PRO_CHALLENGES } from '../data/pro-content'
import { PRO_PRICE, loadPrices, getPrices } from '../lib/pro'
import { Icon, Tile } from './Icon'
import { Inf, Sheet } from './ui'
import { tr } from '../lib/i18n'
import { ProChallengeList, challengeToLesson } from './ProMedia'

const nq = olympiadLessons.reduce((a, l) => a + l.questions.length, 0)
const nCh = PRO_CHALLENGES.reduce((a, c) => a + c.questions.length, 0)

// Годовой план: цена в месяц и выгода к помесячной оплате (если цены удаётся разобрать)
const num = (s) => Number(String(s ?? '').split('/')[0].replace(/[^\d]/g, '')) || 0
function yearDeal(price) {
  const m = num(price.month), y = num(price.year)
  if (!m || !y || y >= m * 12) return null
  const cur = String(price.year).match(/[₸$€₽]/)?.[0] ?? ''
  return { perMonth: `${Math.round(y / 12).toLocaleString('ru-RU')} ${cur}`.trim(), save: Math.round((1 - y / (m * 12)) * 100) }
}

export default function ProModal({ pro, plan: current, setPro, onClose, openLesson }) {
  const [plan, setPlan] = useState(current ?? 'year')
  const [tab, setTab] = useState('about') // about | tests
  const [price, setPrice] = useState(() => getPrices())
  useEffect(() => { loadPrices().then(setPrice) }, [])
  const deal = yearDeal(price)

  const startChallenge = (c) => {
    if (!pro) return
    onClose()
    openLesson?.(challengeToLesson(c))
  }

  return (
    <Sheet onClose={onClose} tall>
      {(close) => (
        <div className="pro-modal">
          <div className="pro-scroll">
            <div className="pro-hero">
              <span className="pro-mascot"><Mascot mood="cheer" size={84} /></span>
              <h1>GAS Pro</h1>
              <p>{pro ? <span className="pro-on"><Icon name="check" size={14} />{tr('Активен')}{current ? ` · ${current === 'year' ? tr('Год') : tr('Месяц')}` : ''}</span> : tr('Подготовка к олимпиадам по географии')}</p>
            </div>

            <div className="pro-stats">
              <span><b>{olympiadLessons.length}</b>уроков олимпиады</span>
              <span><b>{nq + nCh}</b>олимпиадных вопросов</span>
              <span><b>{PRO_CHALLENGES.length}</b>тренажёра и тура</span>
            </div>

            {pro && (
              <div className="pro-tabs">
                {[['about', 'О Pro'], ['tests', 'Тренажёры']].map(([id, label]) => (
                  <button key={id} type="button" className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>
                ))}
              </div>
            )}

            {(!pro || tab === 'about') && (
              <>
                {!pro && <p className="pro-note">Основной курс остаётся бесплатным. Pro добавляет олимпиадный уровень — сложные задачи с разбором, тренажёры на время и пробные туры.</p>}

                <h3 className="pro-sub">Что внутри</h3>
                <ul className="features">
                  {[
                    { icon: 'trophy', title: 'Олимпиадные задачи', text: 'Не «столица Франции», а климатограммы, карты и расчёты с пошаговым разбором.' },
                    { icon: 'book', title: 'Теория с примерами', text: 'Перед задачами — метод решения и разобранный пример, как на кружке.' },
                    { icon: 'timer', title: 'Пробные туры', text: 'Школьный и региональный этапы с таймером и целевым баллом.' },
                    { icon: 'target', title: 'Тренажёры по темам', text: 'Климат, карта, мир и микс — короткие тесты на причинно-следственные связи.' },
                    { icon: 'compass', title: 'Практикум по расчётам', text: 'Часовые пояса, масштаб, плотность населения — типовые задачи тура.' },
                    { icon: 'heart', title: 'Безлимит сердец', text: 'Ошибаться можно сколько угодно — главное, разобраться.' },
                    { icon: 'bulb', title: '3 подсказки и второй шанс', text: 'Три подсказки в каждом уроке и одна попытка заново после ошибки.' },
                  ].map((f) => (
                    <li key={f.title}><Tile name={f.icon} color="#f59e0b" size={40} /><div><b>{f.title}</b><small>{f.text}</small></div></li>
                  ))}
                </ul>
                <h3 className="pro-sub">Бесплатно и Pro</h3>
                <div className="pro-cmp" role="table">
                  <div className="head"><span /><b>Бесплатно</b><b className="gold">Pro</b></div>
                  {[
                    ['Основной путь и темы', '✓', '✓'],
                    ['Блиц и тренировки', '✓', '✓'],
                    [`Олимпиадный модуль · ${olympiadLessons.length} уроков`, '—', '✓'],
                    ['Пробные туры олимпиады', '—', '✓'],
                    [`Челленджи на время · ${PRO_CHALLENGES.length}`, '—', '✓'],
                    ['Сердца', '5', <Inf key="inf" size={16} />],
                    ['Подсказки в уроке', '1', '3'],
                    ['Второй шанс после ошибки', '—', '✓'],
                  ].map(([t, a, b]) => (
                    <div key={t} className="row"><span>{t}</span><b>{a}</b><b className="gold">{b}</b></div>
                  ))}
                </div>

                <h3 className="pro-sub">Частые вопросы</h3>
                <div className="pro-faq">
                  <details><summary>Подойдёт, если я только начинаю?</summary><p>Да. Сначала пройдите бесплатный путь, а углублённый модуль откроет задачи, к которым уже можно готовиться.</p></details>
                  <details><summary>Для каких классов?</summary><p>Для школьников и взрослых, кто готовится к олимпиадам или хочет разобраться в географии глубже школьной программы.</p></details>
                  <details><summary>Это реальная оплата?</summary><p>Сейчас это демо-режим: деньги не списываются. Pro можно в любой момент отключить.</p></details>
                </div>

                <details className="pro-topics">
                  <summary>{tr('Темы углублённого модуля')}<small>{olympiadLessons.length}</small></summary>
                  <ul className="pro-lessons">
                    {olympiadLessons.map((l) => (
                      <li key={l.id}><Icon name="trophy" size={14} />{l.title.replace(/^Олимпиада:\s*/, '')}<small>{l.questions.length}</small></li>
                    ))}
                  </ul>
                </details>
              </>
            )}

            {pro && tab === 'tests' && (
              <ProChallengeList onStart={startChallenge} />
            )}
          </div>

          <div className="pro-foot">
            {!pro && (
              <div className="plans">
                {['month', 'year'].map((p) => (
                  <button key={p} type="button" className={plan === p ? 'on' : ''} data-badge={p === 'year' ? tr('Выгодно') : undefined} onClick={() => setPlan(p)}>
                    <small>{p === 'year' ? tr('Год') : tr('Месяц')}</small>
                    <b>{price[p]}</b>
                    {p === 'year' && deal && <em>≈ {deal.perMonth} / {tr('мес')} · −{deal.save}%</em>}
                    {plan === p && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                  </button>
                ))}
              </div>
            )}
            {pro
              ? <>
                  {tab !== 'tests' && <button type="button" className="btn gold" onClick={() => setTab('tests')}>{tr('К тренажёрам')}</button>}
                  <button type="button" className="pro-off" onClick={() => { setPro(false); close() }}>{tr('Отключить демо-Pro')}</button>
                </>
              : <>
                  <button type="button" className="btn gold" onClick={() => { setPro(true, plan); close() }}>{tr('Начать готовиться')}</button>
                  <small className="note">Демо: оплата не списывается.</small>
                </>}
          </div>
        </div>
      )}
    </Sheet>
  )
}
