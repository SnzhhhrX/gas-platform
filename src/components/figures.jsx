// Иллюстрации уроков. Один стиль: плоские яркие формы, минимум подписей (не больше 3–4).
// Схемы лежат на тонированной плашке .qimg; «сцены» (небо, море) рисуют свой фон.
const FONT = 'Manrope, system-ui, sans-serif'
const INK = '#0f2a3d' // тёмный текст на светлых «сценах»
const C = {
  blue: '#1cb0f6', blueD: '#1899d6', green: '#58cc02', greenD: '#46a302', orange: '#ff9600',
  yellow: '#ffc800', red: '#ff4b4b', purple: '#ce82ff', brown: '#a5703f', brownD: '#8a5a30',
  sand: '#ecd29a', sky: '#dff3fd', gray: '#9aa7b0',
}
const T = ({ x, y, s = 12, c = 'var(--text)', a = 'middle', children }) => (
  <text x={x} y={y} style={{ font: `800 ${s}px ${FONT}`, fill: c, textAnchor: a }}>{children}</text>
)
const Svg = ({ label, children }) => <svg viewBox="0 0 240 150" role="img" aria-label={label}>{children}</svg>
const Sky = () => <rect x="4" y="4" width="232" height="142" rx="16" fill={C.sky} />
const Dot = ({ x, y, c }) => <circle cx={x} cy={y} r="5" fill={c} />
// мини-Земля с наклонной осью
const Mini = ({ x, y, r = 10 }) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1="0" y1={-r - 6} x2="0" y2={r + 6} stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" transform="rotate(23.5)" />
    <circle r={r} fill={C.blue} />
    <path d={`M${-r * .6} ${-r * .2} q${r * .3} ${-r * .6} ${r * .8} ${-r * .3} q${r * .2} ${r * .5} ${-r * .3} ${r * .7} q${-r * .5} ${r * .1} ${-r * .5} ${-r * .4}z`} fill={C.green} />
  </g>
)
// легенда: цветная точка + подпись
const Legend = ({ x, y, rows }) => rows.map(([c, t], i) => (
  <g key={t}><Dot x={x} y={y + i * 24} c={c} /><T x={x + 12} y={y + 4 + i * 24} a="start" s="11.5">{t}</T></g>
))

/* ── Карты и ориентирование ─────────────────────────── */
const Compass = () => (
  <Svg label="Стороны света">
    <circle cx="120" cy="75" r="46" fill={C.blue} opacity=".16" /><circle cx="120" cy="75" r="46" fill="none" stroke={C.blue} strokeWidth="4" />
    <path d="M70 75 L120 67 L170 75 L120 83Z" fill="var(--muted)" opacity=".45" />
    <path d="M120 27 L131 75 L109 75Z" fill={C.red} /><path d="M120 123 L131 75 L109 75Z" fill="var(--muted)" opacity=".7" />
    <circle cx="120" cy="75" r="5" fill="var(--card)" stroke="var(--text)" strokeWidth="2" />
    <T x="120" y="17" s="12">Север</T><T x="120" y="142" s="12">Юг</T><T x="46" y="79" s="12">Запад</T><T x="196" y="79" s="12">Восток</T>
  </Svg>
)
const Grid = () => (
  <Svg label="Широта и долгота">
    <g transform="translate(24 0)">
    <rect x="56" y="12" width="150" height="116" rx="14" fill={C.blue} opacity=".14" />
    {[93, 131, 169].map((x) => <line key={x} x1={x} y1="14" x2={x} y2="126" stroke={C.blue} strokeWidth="2" opacity=".35" />)}
    {[41, 70, 99].map((y) => <line key={y} x1="58" y1={y} x2="204" y2={y} stroke={C.blue} strokeWidth="2" opacity=".35" />)}
    <path d="M150 70 H56 M150 70 V128" stroke={C.orange} strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
    <circle cx="150" cy="70" r="9" fill={C.red} /><circle cx="150" cy="70" r="3.5" fill="#fff" />
    </g>
    <T x="76" y="74" a="end" s="11.5">широта</T><T x="174" y="146" s="11.5">долгота</T>
  </Svg>
)
const Contour = () => (
  <Svg label="Горизонтали">
    {[[1, '#bfe58a'], [.7, '#8cc84b'], [.4, '#c9a064']].map(([k, f]) => (
      <path key={k} fill={f} d="M60 82 C50 42 100 22 142 32 C192 44 202 102 160 122 C120 142 70 128 60 82Z" transform={`translate(120 78) scale(${k}) translate(-120 -78)`} />
    ))}
    <T x="166" y="110" s="11" c="#2f5d0b">100</T><T x="152" y="86" s="11" c="#2f5d0b">200</T><T x="124" y="70" s="11" c="#fff">300</T>
  </Svg>
)
const Scale = () => (
  <Svg label="Масштаб">
    {[0, 1, 2, 3].map((i) => <rect key={i} x={40 + i * 40} y="62" width="40" height="18" fill={i % 2 ? '#fff' : C.blue} stroke={C.blue} strokeWidth="2.5" />)}
    {['0', '50', '100', '150 км'].map((t, i) => <T key={t} x={40 + i * 40 + (i === 3 ? 6 : 0)} y="102" s="12">{t}</T>)}
    <path d="M40 52 V40 M200 52 V40 M40 46 H200" stroke={C.orange} strokeWidth="2.5" strokeLinecap="round" fill="none" /><T x="120" y="34" s="12" c={C.orange}>на местности</T>
  </Svg>
)

/* ── Планета и время ─────────────────────────────────── */
const Seasons = () => (
  <Svg label="Времена года">
    <ellipse cx="120" cy="75" rx="80" ry="46" fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" opacity=".7" />
    <circle cx="120" cy="75" r="14" fill={C.yellow} />
    {Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <line key={i} x1={120 + 19 * Math.cos(a)} y1={75 + 19 * Math.sin(a)} x2={120 + 24 * Math.cos(a)} y2={75 + 24 * Math.sin(a)} stroke={C.yellow} strokeWidth="3" strokeLinecap="round" /> })}
    <Mini x={120} y={29} /><Mini x={200} y={75} /><Mini x={120} y={121} /><Mini x={40} y={75} />
    <T x="120" y="12" s="12">Лето</T><T x="200" y="102" s="12">Осень</T><T x="120" y="148" s="12">Зима</T><T x="40" y="102" s="12">Весна</T>
  </Svg>
)
const TimeZones = () => (
  <Svg label="Часовые пояса">
    {[9, 10, 11, 12, 13, 14, 15].map((h, i) => (
      <g key={h}><rect x={20 + i * 29} y="22" width="29" height="84" fill={i % 2 ? C.blue : C.blueD} opacity={i % 2 ? .85 : 1} rx={i === 0 ? 12 : i === 6 ? 12 : 0} /><T x={34.5 + i * 29} y="72" s="15" c="#fff">{h}</T></g>
    ))}
    <path d="M46 130 H190" stroke={C.orange} strokeWidth="4" strokeLinecap="round" /><path d="M182 122 L194 130 L182 138" fill="none" stroke={C.orange} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <T x="120" y="150" s="11">на восток +1 час</T>
  </Svg>
)

/* ── Земля внутри и снаружи ──────────────────────────── */
const EarthLayers = () => (
  <Svg label="Строение Земли">
    <circle cx="78" cy="75" r="60" fill={C.brown} /><circle cx="78" cy="75" r="53" fill={C.orange} />
    <circle cx="78" cy="75" r="33" fill={C.yellow} /><circle cx="78" cy="75" r="15" fill={C.red} />
    <Legend x={160} y={46} rows={[[C.brown, 'Кора'], [C.orange, 'Мантия'], [C.red, 'Ядро']]} />
  </Svg>
)
const Layers = () => {
  const rows = [['Термосфера', '#8b7cf6', '#fff'], ['Мезосфера', '#5aa0f5', '#fff'], ['Стратосфера', '#8ad0fa', INK], ['Тропосфера', '#cdeefd', INK]]
  return (
    <Svg label="Слои атмосферы">
      <clipPath id="fg-at"><rect x="30" y="10" width="180" height="116" rx="16" /></clipPath>
      <g clipPath="url(#fg-at)">{rows.map(([n, f, c], i) => <g key={n}><rect x="30" y={10 + i * 29} width="180" height="29" fill={f} /><T x="46" y={30 + i * 29} a="start" c={c}>{n}</T></g>)}</g>
      <rect x="30" y="126" width="180" height="14" rx="7" fill={C.green} />
    </Svg>
  )
}
const Epicenter = () => (
  <Svg label="Очаг и эпицентр землетрясения">
    <rect x="10" y="62" width="220" height="80" rx="16" fill={C.brown} /><rect x="10" y="56" width="220" height="14" rx="7" fill={C.green} />
    <path d="M120 112 V68" stroke="#fff" strokeWidth="2.5" strokeDasharray="4 6" strokeLinecap="round" />
    {[16, 28].map((r) => <circle key={r} cx="120" cy="112" r={r} fill="none" stroke={C.red} strokeWidth="2.5" opacity={1 - r / 40} />)}
    <circle cx="120" cy="112" r="9" fill={C.red} /><circle cx="120" cy="63" r="7" fill={C.yellow} stroke={C.red} strokeWidth="3" />
    <T x="120" y="40" s="13">Эпицентр</T><T x="154" y="116" a="start" c="#fff">Очаг</T>
  </Svg>
)
const Plates = () => (
  <Svg label="Столкновение плит">
    <rect x="10" y="104" width="220" height="38" rx="14" fill={C.orange} /><T x="120" y="128" c="#fff">Мантия</T>
    <rect x="10" y="68" width="112" height="38" rx="10" fill={C.brown} /><rect x="118" y="68" width="112" height="38" rx="10" fill="#7fae3f" />
    <path d="M92 68 L120 28 L148 68Z" fill={C.brownD} /><path d="M112 40 L120 28 L128 40 L120 38Z" fill="#fff" />
    <path d="M26 54 H70 M62 46 L72 54 L62 62" fill="none" stroke="var(--text)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M214 54 H170 M178 46 L168 54 L178 62" fill="none" stroke="var(--text)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <T x="120" y="18" s="11.5">Горы</T>
  </Svg>
)
const Volcano = () => (
  <Svg label="Вулкан">
    <Sky />
    <circle cx="116" cy="22" r="9" fill="#fff" /><circle cx="130" cy="14" r="11" fill="#fff" /><circle cx="146" cy="20" r="8" fill="#fff" />
    <path d="M36 128 L102 40 H138 L204 128Z" fill={C.brown} />
    <rect x="113" y="40" width="14" height="76" rx="7" fill={C.orange} /><ellipse cx="120" cy="112" rx="26" ry="12" fill={C.orange} />
    <path d="M102 40 Q120 52 138 40" fill="none" stroke={C.red} strokeWidth="5" strokeLinecap="round" />
    <path d="M138 42 Q150 70 144 96 Q142 112 152 128 H170 Q158 100 164 80Z" fill={C.red} opacity=".9" />
    <rect x="4" y="128" width="232" height="18" rx="9" fill={C.green} />
    <T x="170" y="34" a="start" c={INK}>Кратер</T><T x="120" y="116" s="11" c="#fff">Магма</T>
  </Svg>
)
const Mountain = () => (
  <Svg label="Горы">
    <Sky />
    <path d="M10 128 L56 78 L100 128Z" fill="#8cc84b" /><path d="M140 128 L186 70 L232 128Z" fill={C.brownD} />
    <path d="M168 92 L186 70 L204 92 L195 88 L186 96 L177 88Z" fill="#fff" />
    <path d="M44 128 L112 28 L180 128Z" fill={C.brown} /><path d="M96 52 L112 28 L128 52 L119 47 L112 56 L105 47Z" fill="#fff" />
    <rect x="4" y="128" width="232" height="18" rx="9" fill={C.green} />
    <T x="136" y="30" a="start" c={INK} s="11.5">Вершина</T>
    <T x="104" y="106" c="#fff" s="11.5">Склон</T><T x="120" y="141" s="11.5" c="#10320a">Подошва</T>
  </Svg>
)
const Hypso = () => (
  <Svg label="Высоты и глубины">
    <Sky />
    <path d="M8 100 H128 V138 H8Z" fill={C.brown} />
    <path d="M8 100 L40 100 L72 54 L86 66 L104 26 L132 100Z" fill="#7fae5a" /><path d="M96 40 L104 26 L113 46 L105 42Z" fill="#fff" />
    <rect x="128" y="100" width="104" height="42" fill={C.blue} />
    <path d="M128 100 L152 114 L182 120 L192 140 L206 140 L214 118 L232 114 V142 H128Z" fill={C.brownD} />
    <path d="M4 100 H236" stroke={INK} strokeWidth="1.5" strokeDasharray="4 5" opacity=".5" />
    <T x="104" y="18" c={INK}>+8849 м</T><T x="170" y="94" s="11" c={INK}>0 м</T><T x="170" y="133" s="11" c="#fff">−11 км</T>
  </Svg>
)
const River = () => (
  <Svg label="Река">
    <rect x="8" y="10" width="188" height="130" rx="18" fill={C.green} opacity=".22" />
    <path d="M18 70 L44 30 L70 70Z" fill={C.brown} /><path d="M37 40 L44 30 L51 40 L47 38 L44 43 L41 38Z" fill="#fff" />
    <path d="M44 62 C74 70 56 98 92 98 C128 98 112 70 148 74 C182 78 176 112 214 108" fill="none" stroke={C.blue} strokeWidth="9" strokeLinecap="round" />
    <path d="M196 96 H236 V142 H190Z" fill={C.blue} opacity=".35" />
    <T x="60" y="26" a="start">Исток</T><T x="210" y="130" s="12">Устье</T>
  </Svg>
)

/* ── Вода, климат, экология ──────────────────────────── */
const WaterCycle = () => (
  <Svg label="Круговорот воды">
    <Sky />
    <circle cx="206" cy="30" r="13" fill={C.yellow} />
    <path d="M92 142 V112 Q130 64 172 84 Q202 96 236 74 V142Z" fill={C.green} /><rect x="8" y="104" width="86" height="38" fill={C.blue} />
    <path d="M8 104 q11 -7 22 0 t22 0 t22 0 t20 0" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
    <g fill="#fff"><circle cx="106" cy="38" r="12" /><circle cx="124" cy="30" r="15" /><circle cx="143" cy="38" r="12" /><rect x="106" y="38" width="37" height="12" /></g>
    <path d="M52 96 C54 76 66 62 86 52" fill="none" stroke={C.blueD} strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
    <path d="M80 50 L90 51 L84 60" fill="none" stroke={C.blueD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {[112, 126, 140].map((x) => <path key={x} d={`M${x} 58 l-4 12`} stroke={C.blue} strokeWidth="3" strokeLinecap="round" />)}
    <path d="M168 88 Q140 108 100 116" fill="none" stroke={C.blue} strokeWidth="4" strokeLinecap="round" />
    <T x="8" y="30" a="start" c={INK} s="11.5">Испарение</T><T x="158" y="62" a="start" c={INK} s="11.5">Осадки</T><T x="150" y="132" c="#10320a" s="11.5">Сток</T>
  </Svg>
)
const Greenhouse = () => (
  <Svg label="Парниковый эффект">
    <ellipse cx="120" cy="178" rx="140" ry="62" fill={C.green} /><ellipse cx="120" cy="178" rx="140" ry="62" fill="none" stroke={C.blue} strokeWidth="6" opacity=".5" />
    <path d="M14 104 Q120 56 226 104" fill="none" stroke={C.purple} strokeWidth="12" strokeLinecap="round" opacity=".5" />
    <circle cx="30" cy="26" r="13" fill={C.yellow} />
    {[[52, 38, 88, 112], [70, 30, 112, 104]].map(([a, b, c, d], i) => <path key={i} d={`M${a} ${b} L${c} ${d}`} stroke={C.yellow} strokeWidth="4" strokeLinecap="round" />)}
    <path d="M158 118 V94" stroke={C.red} strokeWidth="4" strokeLinecap="round" /><path d="M150 100 L158 91 L166 100" fill="none" stroke={C.red} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M186 90 L196 112" stroke={C.red} strokeWidth="4" strokeLinecap="round" /><path d="M188 104 L196 114 L202 104" fill="none" stroke={C.red} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <T x="150" y="38" s="12">Парниковые газы</T>
  </Svg>
)
const ClimateBelts = () => {
  const bands = [[14, '#cfeefd'], [22, '#8fd14f'], [14, '#ffc800'], [12, '#ff9600'], [14, '#ffc800'], [22, '#8fd14f'], [14, '#cfeefd']]
  let y = 21
  return (
    <Svg label="Климатические пояса">
      <clipPath id="fg-cl"><circle cx="62" cy="75" r="54" /></clipPath>
      <g clipPath="url(#fg-cl)">{bands.map(([h, f], i) => { const r = <rect key={i} x="6" y={y} width="112" height={h + 1} fill={f} />; y += h; return r })}</g>
      <Legend x={132} y={44} rows={[['#cfeefd', 'Полярный'], ['#8fd14f', 'Умеренный'], ['#ffc800', 'Тропический'], ['#ff9600', 'Экватор']]} />
    </Svg>
  )
}
const WindFig = () => (
  <Svg label="Ветер">
    <circle cx="52" cy="66" r="30" fill={C.blue} /><T x="52" y="76" s="28" c="#fff">+</T>
    <circle cx="188" cy="66" r="30" fill={C.orange} /><T x="188" y="76" s="30" c="#fff">−</T>
    <path d="M92 66 H140 M130 54 L144 66 L130 78" fill="none" stroke="var(--text)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <T x="52" y="118" s="11.5">высокое</T><T x="52" y="132" s="11.5">давление</T><T x="188" y="118" s="11.5">низкое</T><T x="188" y="132" s="11.5">давление</T><T x="118" y="48" s="12">ветер</T>
  </Svg>
)

/* ── Новые уроки ─────────────────────────────────────── */
const arm = (k) => {
  const pts = []
  for (let r = 14; r <= 54; r += 4) { const t = (k * 2 * Math.PI) / 3 + r * 0.085; pts.push(`${(84 + r * Math.cos(t)).toFixed(1)} ${(75 + r * Math.sin(t)).toFixed(1)}`) }
  return `M${pts.join(' L')}`
}
const Cyclone = () => (
  <Svg label="Тропический циклон">
    <circle cx="84" cy="75" r="58" fill={C.blue} />
    {[0, 1, 2].map((k) => <path key={k} d={arm(k)} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity=".88" />)}
    <circle cx="84" cy="75" r="15" fill="#fff" /><circle cx="84" cy="75" r="6" fill={C.blue} />
    <path d="M91 71 L148 54" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" /><T x="152" y="54" a="start">Глаз бури</T>
  </Svg>
)
const Tsunami = () => (
  <Svg label="Цунами">
    <clipPath id="fg-ts"><rect x="8" y="10" width="224" height="130" rx="18" /></clipPath>
    <g clipPath="url(#fg-ts)">
      <rect x="8" y="10" width="224" height="130" fill={C.sky} /><rect x="8" y="76" width="224" height="70" fill={C.blue} />
      <path d="M8 76 q12 -5 24 0 t24 0 t24 0 q22 -30 48 0 q22 -52 50 0 L232 76 V146 H8Z" fill={C.blue} stroke="#fff" strokeWidth="3" />
      <path d="M8 130 H110 L190 112 L232 96 V146 H8Z" fill={C.brownD} /><path d="M206 100 L232 94 V70 H214Z" fill={C.sand} />
    </g>
    <path d="M44 122 l6 -12 l6 12 M50 110 v-22" stroke={C.yellow} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <T x="50" y="138" s="11.5" c="#fff">Очаг</T><T x="204" y="62" s="11.5" c={INK}>Берег</T>
  </Svg>
)
const BANDS = [['Арктические пустыни', '#f1f5f9', INK], ['Тундра', '#b7d3c6', INK], ['Тайга', '#2f7a55', '#fff'], ['Смешанные леса', '#7fbf6a', '#10321a'], ['Степи', '#dccb6a', '#3b3200'], ['Пустыни', '#ebc283', '#4a2f05'], ['Саванны', '#c8b24c', '#3b3200'], ['Экваториальные леса', '#17753f', '#fff']]
const Biomes = () => (
  <Svg label="Природные зоны">
    <clipPath id="fg-bi"><rect x="12" y="8" width="216" height="134" rx="16" /></clipPath>
    <g clipPath="url(#fg-bi)">{BANDS.map(([n, f, c], i) => <g key={n}><rect x="12" y={8 + i * 16.75} width="216" height="17" fill={f} /><T x="24" y={20.5 + i * 16.75} a="start" s="11" c={c}>{n}</T></g>)}</g>
  </Svg>
)
const Energy = () => {
  const G = '#16a34a', N = '#64748b'
  return (
    <Svg label="Источники энергии">
      <g transform="translate(36 0)">
        <circle cx="0" cy="48" r="12" fill={C.yellow} />{Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <line key={i} x1={17 * Math.cos(a)} y1={48 + 17 * Math.sin(a)} x2={23 * Math.cos(a)} y2={48 + 23 * Math.sin(a)} stroke={C.yellow} strokeWidth="3" strokeLinecap="round" /> })}
        <path d="M-20 100 L-12 76 H12 L20 100Z" fill={C.blue} /><T x="0" y="126" s="11.5">Солнце</T>
      </g>
      <g transform="translate(96 0)">
        <path d="M0 100 V58" stroke={G} strokeWidth="4" strokeLinecap="round" /><circle cx="0" cy="56" r="4" fill={G} />
        {[-90, 30, 150].map((d) => <line key={d} x1="0" y1="56" x2={26 * Math.cos((d * Math.PI) / 180)} y2={56 + 26 * Math.sin((d * Math.PI) / 180)} stroke={G} strokeWidth="4" strokeLinecap="round" />)}
        <T x="0" y="126" s="11.5">Ветер</T>
      </g>
      <g transform="translate(156 0)">
        <path d="M-16 66 H8 V100 H-16Z" fill="#94a3b8" /><rect x="-28" y="74" width="12" height="26" fill="#60a5fa" />
        <path d="M8 84 q6 -4 12 0 t12 0 M8 94 q6 -4 12 0 t12 0" fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round" /><T x="0" y="126" s="11.5">Вода</T>
      </g>
      <g transform="translate(212 0)">
        <rect x="-18" y="76" width="30" height="24" fill={N} rx="3" /><rect x="-12" y="58" width="7" height="20" fill={N} /><rect x="0" y="64" width="7" height="14" fill={N} />
        <circle cx="-8" cy="50" r="5" fill="#94a3b8" opacity=".7" /><circle cx="1" cy="42" r="6" fill="#94a3b8" opacity=".5" /><T x="-3" y="126" s="11.5">Нефть</T>
      </g>
    </Svg>
  )
}
const Pyramid = () => {
  const grow = [34, 32, 28, 24, 19, 14, 9, 5], old = [14, 21, 26, 26, 24, 20, 16, 14]
  const P = ({ cx, w, title }) => (
    <g>
      <T x={cx} y="18" s="13">{title}</T>
      {w.map((v, i) => <g key={i}><rect x={cx - v} y={30 + i * 14} width={v} height="11.5" rx="3" fill={C.blue} /><rect x={cx} y={30 + i * 14} width={v} height="11.5" rx="3" fill="#f472b6" /></g>)}
    </g>
  )
  return <Svg label="Возрастные пирамиды"><P cx={64} w={[...grow].reverse()} title="Растущее" /><P cx={176} w={[...old].reverse()} title="Стареющее" /></Svg>
}
const Hemis = () => {
  const cx = 62, cy = 76, r = 54, y = (d) => cy - r * Math.sin((d * Math.PI) / 180)
  const half = (yy) => Math.sqrt(r * r - (yy - cy) ** 2)
  return (
    <Svg label="Главные параллели">
      <clipPath id="fg-gl"><circle cx={cx} cy={cy} r={r} /></clipPath>
      <g clipPath="url(#fg-gl)">
        <rect x="0" y="0" width="240" height="150" fill="#cfeefd" />
        <rect x="0" y={y(66.5)} width="240" height={y(-66.5) - y(66.5)} fill="#a8e07a" />
        <rect x="0" y={y(23.5)} width="240" height={y(-23.5) - y(23.5)} fill="#ffc86b" />
      </g>
      {[66.5, 23.5, 0, -23.5, -66.5].map((d) => <line key={d} x1={cx - half(y(d))} x2={cx + half(y(d))} y1={y(d)} y2={y(d)} stroke={d === 0 ? C.red : '#fff'} strokeWidth={d === 0 ? 3 : 2} strokeDasharray={d === 0 ? '' : '5 4'} />)}
      {[[66.5, 'Полярный · 66,5°'], [23.5, 'Тропик · 23,5°'], [0, 'Экватор · 0°']].map(([d, n]) => (
        <g key={d}><path d={`M${cx + half(y(d)) + 4} ${y(d)} H124`} stroke="var(--line)" strokeWidth="2" /><T x="128" y={y(d) + 4} a="start" s="11" c={d === 0 ? C.red : 'var(--text)'}>{n}</T></g>
      ))}
    </Svg>
  )
}
const Puff = ({ x, y, k = 1 }) => <g fill="#fff"><circle cx={x} cy={y} r={11 * k} /><circle cx={x + 13 * k} cy={y - 7 * k} r={14 * k} /><circle cx={x + 27 * k} cy={y} r={11 * k} /><rect x={x} y={y} width={27 * k} height={11 * k} /></g>
const Clouds = () => (
  <Svg label="Виды облаков">
    <Sky />
    <g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"><path d="M16 26 q22 -10 44 0" /><path d="M24 38 q20 -8 40 0" /></g>
    <T x="40" y="58" c={INK} s="11">Перистые</T>
    <Puff x={80} y={96} /><T x="94" y="124" c={INK} s="11">Кучевые</T>
    <rect x="12" y="102" width="56" height="10" rx="5" fill="#cbd5e1" /><rect x="20" y="115" width="48" height="8" rx="4" fill="#dbe3ec" /><T x="40" y="138" c={INK} s="11">Слоистые</T>
    <Puff x={170} y={104} k={1.05} /><Puff x={176} y={78} k={1.1} /><Puff x={182} y={54} k={.95} />
    <ellipse cx="192" cy="42" rx="30" ry="8" fill="#fff" /><rect x="160" y="106" width="64" height="9" rx="4" fill="#64748b" />
    <path d="M172 120 l-4 14 M186 120 l-4 14 M200 120 l-4 14 M214 120 l-4 14" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
    <T x="176" y="24" c={INK} s="11">Кучево-дождевые</T>
  </Svg>
)


/* ── Казахстан ───────────────────────────────────────── */
const gx = (lon) => 26 + (lon - 46.5) * 5, gy = (lat) => 22 + (55.4 - lat) * 7.6
const P = (pts) => pts.map(([a, b]) => `${gx(a).toFixed(1)} ${gy(b).toFixed(1)}`).join(' L')
const KZ_OUT = [[46.6, 49.9], [47.6, 51.0], [50.0, 51.6], [52.3, 51.7], [54.7, 50.9], [57.0, 51.0], [59.5, 50.6], [61.2, 50.8], [61.0, 52.3], [61.7, 53.3], [64.5, 54.2], [67.0, 54.8], [69.5, 55.3], [72.5, 54.5], [74.8, 53.5], [76.5, 53.0], [77.7, 51.8], [80.8, 50.9], [83.5, 51.2], [85.2, 49.5], [87.3, 49.2], [86.0, 47.6], [85.5, 47.0], [83.0, 47.2], [82.2, 45.5], [81.0, 43.2], [80.2, 42.2], [79.0, 42.6], [77.0, 43.0], [75.0, 42.9], [73.5, 42.5], [71.5, 42.8], [70.8, 41.2], [69.0, 41.4], [68.2, 40.8], [67.0, 41.8], [65.5, 42.8], [63.0, 43.6], [61.0, 44.3], [58.5, 45.5], [56.0, 45.0], [55.9, 43.0], [55.0, 41.4], [53.0, 42.0], [52.7, 42.4], [51.3, 43.2], [50.3, 44.6], [50.8, 45.4], [49.0, 46.4], [47.2, 46.9], [46.6, 48.5]]
const KZ = `M${P(KZ_OUT)}Z`
const CASPIAN = `M${P([[49.0, 46.4], [50.8, 45.4], [50.3, 44.6], [51.3, 43.2], [52.7, 42.4], [53.1, 41.0], [53.0, 40.4], [46.5, 40.4], [46.5, 46.9]])}Z`
const City = ({ lon, lat, label, dx = 0, dy = -9, star }) => (
  <g>{star ? <path d={`M${gx(lon)} ${gy(lat) - 7} l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7z`} fill={C.red} /> : <circle cx={gx(lon)} cy={gy(lat)} r="4.5" fill={C.red} stroke="#fff" strokeWidth="1.5" />}
    <T x={gx(lon) + dx} y={gy(lat) + dy} s="11">{label}</T></g>
)
const Country = ({ fill = C.green, op = 0.3 }) => <><path d={KZ} fill={fill} opacity={op} /><path d={KZ} fill="none" stroke={C.greenD} strokeWidth="2.5" strokeLinejoin="round" /></>

const KzMap = () => (
  <Svg label="Казахстан на карте">
    <path d={CASPIAN} fill={C.blue} opacity=".75" /><Country />
    <City lon={71.4} lat={51.2} label="Астана" star dy={-11} />
    <T x="130" y="14" s="11.5">Россия</T><T x="232" y="120" s="11.5" a="end">Китай</T><T x="112" y="146" s="11.5">Узбекистан</T><T x="46" y="143" s="11">Каспий</T>
  </Svg>
)
const KzWater = () => (
  <Svg label="Воды Казахстана">
    <Country fill="var(--muted)" op={0.14} />
    <path d={CASPIAN} fill={C.blue} opacity=".8" />
    <path d={`M${P([[73.6, 46.6], [74.8, 46.9], [76.5, 46.7], [78.0, 46.2], [79.6, 45.9], [78.0, 45.6], [76.0, 46.0], [74.5, 46.2]])}Z`} fill={C.blue} />
    <path d={`M${P([[59.8, 46.6], [61.2, 46.8], [61.6, 45.6], [60.0, 45.0], [59.2, 45.8]])}Z`} fill={C.blue} />
    {[[[86.2, 47.3], [83.5, 47.8], [81.5, 49.0], [79.0, 50.4], [76.8, 52.3], [75.5, 53.5]], [[70.5, 41.0], [68.5, 41.8], [66.0, 43.2], [63.5, 44.7], [61.2, 46.0]], [[56.5, 51.0], [51.4, 51.2], [50.5, 49.5], [51.9, 47.1]], [[80.0, 43.8], [76.5, 44.2], [75.0, 45.5], [74.7, 46.3]]].map((r, i) => <path key={i} d={`M${P(r)}`} fill="none" stroke={C.blue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
    <path d={KZ} fill="none" stroke="var(--muted)" strokeWidth="2" opacity=".6" />
    <T x="46" y="143" s="11">Каспий</T><T x="88" y="86" s="11" a="end">Арал</T><T x="170" y="94" s="11">Балхаш</T><T x="196" y="30" s="11">Иртыш</T>
  </Svg>
)
const KzCities = () => (
  <Svg label="Города Казахстана">
    <Country fill="var(--muted)" op={0.14} />
    <City lon={71.4} lat={51.2} label="Астана" star dy={-11} /><City lon={76.9} lat={43.25} label="Алматы" dy={-9} dx={6} /><City lon={69.6} lat={42.3} label="Шымкент" dy={18} /><City lon={51.2} lat={43.65} label="Актау" dx={14} dy={16} />
  </Svg>
)
const KzNature = () => (
  <Svg label="Природные зоны Казахстана">
    <clipPath id="fg-kz"><path d={KZ} /></clipPath>
    <g clipPath="url(#fg-kz)">
      <rect x="0" y="0" width="240" height="63" fill="#9fd45a" /><rect x="0" y="63" width="240" height="24" fill="#d9d36a" /><rect x="0" y="87" width="240" height="60" fill="#ecc27a" />
      {[[79.2, 44.0, 16], [81.4, 45.3, 11], [84.3, 49.6, 13], [82.0, 50.3, 10]].map(([lo, la, h], i) => <g key={i}><path d={`M${gx(lo) - h} ${gy(la) + h * .7} L${gx(lo)} ${gy(la) - h * .7} L${gx(lo) + h} ${gy(la) + h * .7}Z`} fill={C.brown} /><path d={`M${gx(lo) - h * .35} ${gy(la) - h * .2} L${gx(lo)} ${gy(la) - h * .7} L${gx(lo) + h * .35} ${gy(la) - h * .2}Z`} fill="#fff" /></g>)}
    </g>
    <path d={KZ} fill="none" stroke={C.greenD} strokeWidth="2.5" strokeLinejoin="round" />
    <Dot x={34} y={144} c="#9fd45a" /><T x="44" y="148" a="start" s="11">Степь</T><Dot x={98} y={144} c="#ecc27a" /><T x="108" y="148" a="start" s="11">Пустыня</T><Dot x={176} y={144} c={C.brown} /><T x="186" y="148" a="start" s="11">Горы</T>
  </Svg>
)
const KzRes = () => (
  <Svg label="Ресурсы Казахстана">
    <g transform="translate(36 0)"><path d="M0 34 C-18 62 -22 82 0 94 C22 82 18 62 0 34Z" fill="#334155" /><path d="M-8 62 C-10 72 -6 80 -1 83" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".45" /><T x="0" y="126" s="11.5">Нефть</T></g>
    <g transform="translate(96 0)">{[0, 60, 120].map((r) => <ellipse key={r} cx="0" cy="64" rx="26" ry="10" fill="none" stroke={C.green} strokeWidth="3" transform={`rotate(${r} 0 64)`} />)}<circle cx="0" cy="64" r="8" fill={C.red} /><T x="0" y="126" s="11.5">Уран</T></g>
    <g transform="translate(156 0)"><path d="M0 98 V46" stroke={C.brown} strokeWidth="3" strokeLinecap="round" />{[[-9, 54, -25], [9, 54, 25], [-10, 68, -25], [10, 68, 25], [-10, 82, -25], [10, 82, 25]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="4.5" ry="9" fill={C.yellow} transform={`rotate(${r} ${x} ${y})`} />)}<ellipse cx="0" cy="42" rx="4.5" ry="9" fill={C.yellow} /><T x="0" y="126" s="11.5">Зерно</T></g>
    <g transform="translate(212 0)"><path d="M-22 98 L-14 70 L2 64 L14 76 L22 98Z" fill="#1e293b" /><path d="M-8 98 L-4 80 L8 78 L14 98Z" fill="#334155" /><path d="M-10 74 L-2 68" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".4" /><T x="0" y="126" s="11.5">Уголь</T></g>
  </Svg>
)
const KzSpace = () => (
  <Svg label="Байконур">
    <clipPath id="fg-sp"><rect x="8" y="8" width="224" height="134" rx="18" /></clipPath>
    <g clipPath="url(#fg-sp)">
      <rect x="8" y="8" width="224" height="134" fill="#1b2a4a" />
      {[[30, 30], [60, 70], [190, 36], [212, 80], [150, 22], [40, 104], [200, 112]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.4} fill="#fff" opacity=".85" />)}
      <path d="M120 112 L106 112 Q120 148 134 112Z" fill={C.orange} /><path d="M120 112 L112 112 Q120 134 128 112Z" fill={C.yellow} />
      <path d="M120 22 Q138 44 138 76 V108 H102 V76 Q102 44 120 22Z" fill="#f1f5f9" /><path d="M120 22 Q130 34 134 46 H106 Q110 34 120 22Z" fill={C.red} />
      <circle cx="120" cy="66" r="9" fill={C.blue} stroke="#cbd5e1" strokeWidth="3" />
      <path d="M102 82 L88 110 H102Z M138 82 L152 110 H138Z" fill={C.orange} />
      <rect x="8" y="124" width="224" height="22" fill={C.green} />
    </g>
    <T x="120" y="139" s="11.5" c="#10320a">Байконур</T>
  </Svg>
)
const KzYurt = () => (
  <Svg label="Юрта">
    <rect x="14" y="116" width="212" height="20" rx="10" fill={C.green} />
    <path d="M46 116 V84 H194 V116Z" fill="#f8efd8" /><path d="M46 90 H194" stroke={C.blue} strokeWidth="6" />
    {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${62 + i * 15} 87 l5 -4 l5 4 l-5 4z`} fill={C.orange} />)}
    <path d="M36 84 Q120 -4 204 84Z" fill="#fffaf0" /><path d="M36 84 Q120 -4 204 84" fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" />
    <circle cx="120" cy="38" r="9" fill="none" stroke={C.brownD} strokeWidth="3" /><path d="M120 29 V47 M111 38 H129" stroke={C.brownD} strokeWidth="2.5" />
    <path d="M104 116 V96 Q120 84 136 96 V116Z" fill={C.brown} />
    <T x="120" y="148" s="11.5">Юрта</T>
  </Svg>
)

export const FIGS = {
  compass: Compass, grid: Grid, contour: Contour, scale: Scale, seasons: Seasons, tzones: TimeZones,
  earth: EarthLayers, layers: Layers, epicenter: Epicenter, plates: Plates, volcano: Volcano, mountain: Mountain, hypso: Hypso, river: River,
  watercycle: WaterCycle, greenhouse: Greenhouse, climate: ClimateBelts, wind: WindFig,
  cyclone: Cyclone, tsunami: Tsunami, biomes: Biomes, energy: Energy, pyramid: Pyramid, hemis: Hemis, clouds: Clouds,
  kzmap: KzMap, kzwater: KzWater, kzcities: KzCities, kznature: KzNature, kzres: KzRes, kzspace: KzSpace, kzyurt: KzYurt,
}

// id урока → рисунок
export const LESSON_IMG = {
  'globe-2': 'seasons', 'globe-b1': 'seasons', 'read-globe-planet': 'seasons', 'globe-4': 'tzones', 'globe-5': 'tzones', 'read-globe-time': 'tzones', 'pro-olympiad-13': 'tzones',
  'globe-3': 'grid', 'read-globe-coords': 'grid', 'cart-2': 'scale', 'read-cart-scale': 'scale', 'pro-olympiad-14': 'scale', 'cart-3': 'compass', 'read-cart-orient': 'compass', 'read-cart-relief': 'contour',
  'hazards-1': 'epicenter', 'hazards-2': 'volcano', 'read-relief-earth': 'earth', 'read-relief-forms': 'mountain', 'relief-2': 'plates',
  'read-water-land': 'river', 'eco-1': 'greenhouse', 'eco-2': 'watercycle', 'read-climate-air': 'layers', 'read-climate-zones': 'climate', 'read-climate-wind': 'wind',
  'hazards-5': 'cyclone', 'hazards-6': 'tsunami', 'biomes-5': 'biomes', 'relief-5': 'hypso', 'eco-5': 'energy', 'people-6': 'pyramid', 'globe-7': 'hemis', 'climate-19': 'clouds',
  'kazakhstan-1': 'kzmap', 'kazakhstan-2': 'kzwater', 'kazakhstan-3': 'kzcities', 'kazakhstan-4': 'kznature', 'kazakhstan-5': 'kzmap', 'kazakhstan-6': 'kzres',
  'kazakhstan-7': 'kzmap', 'kazakhstan-8': 'kzwater', 'kazakhstan-9': 'kzcities', 'kazakhstan-10': 'kznature', 'kazakhstan-11': 'kzres', 'kazakhstan-12': 'kzspace',
  'hazards-3': 'cyclone', 'hazards-4': 'tsunami', 'biomes-2': 'biomes', 'nature-6': 'biomes', 'eco-4': 'energy', 'relief-4': 'plates', 'climate-12': 'layers',
}
