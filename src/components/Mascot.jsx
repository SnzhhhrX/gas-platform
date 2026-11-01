import { useId } from 'react'
import { Icon } from './Icon'

// Гас — глобус-проводник платформы. Плоская графика в языке сайта: чистые формы, «толстая» нижняя кромка как у кнопок.
// Взрослый, спокойный характер: небольшие тёмные глаза, выразительные брови и рот, без румянца и ботинок.
// Настроения: happy, cheer, wow, think, wave (приветствие), oops (поддержка при ошибке), proud (праздник), sleep (пауза).
// anim=false отключает моргание и вход (мелкие аватары в списках).
const OCEAN = '#2f8fe5', OCEAN_D = '#1f6fbf', LAND = '#35b26a', LAND_D = '#27965a', LEAF = '#6fd08c', INK = '#10283f'

export function Mascot({ mood = 'happy', size = 96, className = '', anim = true }) {
  const uid = useId().replace(/:/g, '')
  const up = mood === 'cheer' || mood === 'proud'
  const wave = mood === 'wave', oops = mood === 'oops', think = mood === 'think', wow = mood === 'wow'
  const shut = mood === 'proud' || mood === 'sleep'
  const ex = think ? 2.5 : 0, ey = think ? -3 : oops ? 2 : 0, er = wow ? 7.4 : 6.4
  const smile = (d, w = 3.4) => <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" />
  const mouth = {
    happy: smile('M50 70 Q60 79 70 70'),
    wave: smile('M50 70 Q60 79 70 70'),
    cheer: <><path d="M47 67 Q60 86 73 67 Z" fill={INK} /><path d="M52 76 Q60 71 68 76 Q60 82 52 76Z" fill="#ff8aa1" /></>,
    proud: <><path d="M47 67 Q60 86 73 67 Z" fill={INK} /><path d="M52 76 Q60 71 68 76 Q60 82 52 76Z" fill="#ff8aa1" /></>,
    wow: <ellipse cx="60" cy="74" rx="4.6" ry="6" fill={INK} />,
    think: smile('M52 73 Q60 70 69 71'),
    oops: smile('M52 76 Q60 71 68 76'),
    sleep: <ellipse cx="60" cy="74" rx="3.6" ry="2.8" fill={INK} />,
  }[mood] || smile('M50 70 Q60 79 70 70')
  const arm = (d, key) => <path key={key} d={d} fill="none" stroke={OCEAN_D} strokeWidth="9" strokeLinecap="round" />
  return (
    <svg className={`mascot m-${mood}${anim ? ' anim' : ''} ${className}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Глобус Гас">
      <ellipse className="m-shadow" cx="60" cy="113" rx="28" ry="4" fill="#000" opacity=".12" />
      <g className="m-body">
      {/* руки: короткие округлые штрихи */}
      {up ? <>{arm('M17 62 Q5 52 9 38')}{arm('M103 62 Q115 52 111 38')}</>
        : <>{arm('M16 70 Q8 78 12 88')}{wave ? <g className="m-arm">{arm('M104 62 Q116 52 112 38')}</g> : arm('M104 70 Q112 78 108 88')}</>}
      {/* корпус: нижняя кромка + шар */}
      <circle cx="60" cy="64" r="46" fill={OCEAN_D} />
      <clipPath id={`mc-${uid}`}><circle cx="60" cy="60" r="46" /></clipPath>
      <circle cx="60" cy="60" r="46" fill={OCEAN} />
      <g clipPath={`url(#mc-${uid})`}>
        <path d="M8 46 Q60 40 112 46 M8 78 Q60 86 112 78 M60 14 Q40 60 60 106" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".2" />
        <g fill={LAND_D} transform="translate(0 3)"><path d="M14 52 C16 32 36 22 52 30 C60 36 52 48 42 52 C34 60 28 70 20 66 C14 64 13 58 14 52Z" /><path d="M76 74 C88 66 108 72 106 88 C104 100 84 104 74 96 C68 90 68 80 76 74Z" /></g>
        <g fill={LAND}><path d="M14 52 C16 32 36 22 52 30 C60 36 52 48 42 52 C34 60 28 70 20 66 C14 64 13 58 14 52Z" /><path d="M76 74 C88 66 108 72 106 88 C104 100 84 104 74 96 C68 90 68 80 76 74Z" /><path d="M84 28 C94 24 104 32 98 40 C92 46 78 38 84 28Z" /></g>
        <path d="M18 92 Q62 126 112 86 L116 124 L2 124Z" fill={OCEAN_D} opacity=".28" />
        <path d="M24 36 C29 24 40 17 53 15" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity=".38" />
      </g>
      {/* росток */}
      <g className="m-sprout">
        <path d="M60 15 V6" stroke={LAND_D} strokeWidth="3" strokeLinecap="round" />
        <path d="M60 8 C50 -1 42 7 51 12 C55 13 59 11 60 8Z" fill={LEAF} /><path d="M60 8 C70 -1 78 7 69 12 C65 13 61 11 60 8Z" fill={LAND} />
      </g>
      {/* лицо */}
      {shut
        ? smile(mood === 'proud' ? 'M37 57 Q46 47 55 57 M65 57 Q74 47 83 57' : 'M37 54 Q46 61 55 54 M65 54 Q74 61 83 54', 3.8)
        : <g className="m-eyes">
            <ellipse cx={46 + ex} cy={55 + ey} rx="5.4" ry={er} fill={INK} /><ellipse cx={74 + ex} cy={55 + ey} rx="5.4" ry={er} fill={INK} />
            <circle cx={47.8 + ex} cy={52.4 + ey} r="2" fill="#fff" /><circle cx={75.8 + ex} cy={52.4 + ey} r="2" fill="#fff" />
          </g>}
      {think ? smile('M64 38 L82 33', 3.2)
        : oops ? smile('M37 42 Q46 38 55 34 M65 34 Q74 38 83 42', 3)
        : shut ? null
        : smile(wow ? 'M37 36 Q46 30 55 34 M65 34 Q74 30 83 36' : 'M37 39 Q46 34 55 38 M65 38 Q74 34 83 39', 3)}
      {mouth}
      {up && <g fill="#ffc800" className="m-spark"><path d="M103 14 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2 -5 -5 -2.2 5 -2.2z" /><path d="M15 16 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4 -1.8 4 -1.8z" /></g>}
      {mood === 'sleep' && <g fill="none" stroke="#7a8b99" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="m-z"><path d="M96 20 h10 l-10 11 h10" /><path d="M108 6 h7 l-7 8 h7" strokeWidth="2.4" /></g>}
      </g>
    </svg>
  )
}

// Плашка-сцена для уроков без схемы: персонаж + стикер темы урока в цвете модуля
export function LessonArt({ icon, color = 'var(--green)', mood = 'happy' }) {
  return (
    <div className="lart" style={{ '--c': color }} aria-hidden="true">
      <i className="lart-dot" style={{ left: '8%', top: '18%', width: 22, height: 22 }} />
      <i className="lart-dot" style={{ left: '20%', bottom: '14%', width: 12, height: 12 }} />
      <i className="lart-dot" style={{ right: '10%', top: '14%', width: 14, height: 14 }} />
      <i className="lart-dot" style={{ right: '22%', bottom: '16%', width: 24, height: 24 }} />
      <span className="lart-stk lart-l"><Icon name={icon} size={30} /></span>
      <Mascot mood={mood} size={128} />
      <span className="lart-stk lart-r"><Icon name="sparkles" size={26} /></span>
    </div>
  )
}

// Реплика Гаса: персонаж + облачко. note необязателен.
export function GasSays({ mood = 'happy', size = 56, head, note, className = '', anim = true }) {
  return (
    <div className={`gas-says ${className}`}>
      <Mascot mood={mood} size={size} anim={anim} />
      <div className="bubble"><b>{head}</b>{note && <small>{note}</small>}</div>
    </div>
  )
}
