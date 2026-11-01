import { FIGS, LESSON_IMG } from './figures'
// Иллюстрации к вопросам. id: 'flag:fr' или 'fig:compass'. Всё нарисовано SVG, внешних картинок нет.
const FLAGS = {
  // Europe
  fr: ['v', '#0055a4', '#ffffff', '#ef4135'], it: ['v', '#009246', '#ffffff', '#ce2b37'], be: ['v', '#000000', '#fae042', '#ed2939'],
  ie: ['v', '#169b62', '#ffffff', '#ff883e'], ro: ['v', '#002b7f', '#fcd116', '#ce1126'],
  de: ['h', '#000000', '#dd0000', '#ffce00'], ru: ['h', '#ffffff', '#0039a6', '#d52b1e'], nl: ['h', '#ae1c28', '#ffffff', '#21468b'],
  pl: ['h', '#ffffff', '#dc143c'], ua: ['h', '#0057b7', '#ffd700'], at: ['h', '#ed2939', '#ffffff', '#ed2939'],
  hu: ['h', '#cd2a3e', '#ffffff', '#436f4d'], bg: ['h', '#ffffff', '#00966e', '#d62612'], lt: ['h', '#fdb913', '#006a44', '#c1272d'],
  se: ['nordic', '#006aa7', '#fecc00'], fi: ['nordic', '#ffffff', '#003580'], dk: ['nordic', '#c8102e', '#ffffff'],
  no: ['nordic', '#ba0c2f', '#ffffff', '#00205b'], es: ['h', '#aa151b', '#f1bf00', '#aa151b'], pt: ['v', '#006600', '#ff0000'],
  gr: ['h', '#0d5eaf', '#ffffff'], cz: ['h', '#ffffff', '#d7141a'], sk: ['h', '#ffffff', '#0b4ea2', '#ee1c25'],
  hr: ['h', '#ff0000', '#ffffff', '#171796'], rs: ['h', '#c6363c', '#0c4076', '#ffffff'], si: ['h', '#ffffff', '#0000ff', '#ff0000'],
  ba: ['h', '#002395', '#fecb00'], al: ['h', '#e41e20'], mk: ['h', '#d20000', '#ffe600'],
  // Asia
  jp: ['dot', '#ffffff', '#bc002d'], ch: ['swiss', '#d52b1e', '#ffffff'], cn: ['h', '#de2910'],
  in: ['h', '#ff9933', '#ffffff', '#138808'], kr: ['h', '#ffffff', '#cd2e3a', '#0047a0'],
  tr: ['h', '#e30a17'], sa: ['h', '#006c35'], ir: ['h', '#239f40', '#ffffff', '#da0000'],
  th: ['h', '#a51931', '#f4f5f8', '#2d2a4a'], vn: ['h', '#da251d'], id: ['h', '#ff0000', '#ffffff'],
  my: ['h', '#cc0001', '#ffffff'], ph: ['h', '#0038a8', '#ce1126'], sg: ['h', '#ef3340', '#ffffff'],
  pk: ['h', '#01411c'], bd: ['h', '#006a4e'], np: ['h', '#dc143c'],
  // Americas
  us: ['h', '#b22234', '#ffffff', '#3c3b6e'], ca: ['h', '#ff0000', '#ffffff', '#ff0000'],
  mx: ['v', '#006847', '#ffffff', '#ce1126'], br: ['h', '#009c3b', '#ffdf00'],
  ar: ['h', '#74acdf', '#ffffff', '#74acdf'], cl: ['h', '#d52b1e', '#ffffff'],
  pe: ['v', '#d91023', '#ffffff', '#d91023'], co: ['h', '#fcd116', '#003893', '#ce1126'],
  ve: ['h', '#ffcc00', '#00247d', '#cf142b'],
  // Africa
  ng: ['v', '#008751', '#ffffff', '#008751'], za: ['h', '#007749', '#ffffff', '#de3831'],
  eg: ['h', '#ce1126', '#ffffff', '#000000'], ke: ['h', '#000000', '#ffffff', '#bb0000'],
  et: ['h', '#078930', '#f9d616', '#da121a'], gh: ['h', '#ce1126', '#fcd116', '#006b3f'],
  ma: ['h', '#c1272d'], sn: ['v', '#00853f', '#fdef42', '#e31c23'],
  // Oceania + misc
  au: ['h', '#00008b'], nz: ['h', '#00247d'],
  // Extra common
  lu: ['h', '#ed2939', '#ffffff', '#00a1de'], ee: ['h', '#0072ce', '#000000', '#ffffff'],
  lv: ['h', '#9e3039', '#ffffff', '#9e3039'], is: ['nordic', '#02529c', '#ffffff', '#dc1e35'],
  am: ['h', '#d90012', '#0033a0', '#f2a800'], ge: ['h', '#ffffff', '#ff0000'],
  az: ['h', '#00b5e2', '#ed2939', '#3f9c35'], kz: ['h', '#00afca'],
  uz: ['h', '#1eb53a', '#ffffff', '#0099b5'],
  ml: ['v', '#14b53a', '#fcd116', '#ce1126'], gn: ['v', '#ce1126', '#fcd116', '#009460'],
  bo: ['h', '#d52b1e', '#f9e300', '#007a33'], ye: ['h', '#ce1126', '#ffffff', '#000000'],
  sl: ['h', '#1eb53a', '#ffffff', '#0072c6'],
}
export const FLAG_IDS = Object.keys(FLAGS)

function Flag({ id }) {
  const [k, ...c] = FLAGS[id] ?? ['h', '#ccc', '#999']
  let body
  if (k === 'h') body = c.map((f, i) => <rect key={i} x="0" y={(60 / c.length) * i} width="90" height={60 / c.length + 0.5} fill={f} />)
  else if (k === 'v') body = c.map((f, i) => <rect key={i} x={(90 / c.length) * i} y="0" width={90 / c.length + 0.5} height="60" fill={f} />)
  else if (k === 'dot') body = <><rect width="90" height="60" fill={c[0]} /><circle cx="45" cy="30" r="17" fill={c[1]} /></>
  else if (k === 'swiss') body = <><rect width="90" height="60" fill={c[0]} /><rect x="39" y="12" width="12" height="36" fill={c[1]} /><rect x="27" y="24" width="36" height="12" fill={c[1]} /></>
  else if (k === 'nordic') {
    // Nordic cross: field, cross (horizontal + vertical), optional outer
    const [field, cross, outer] = c
    body = (
      <>
        <rect width="90" height="60" fill={field} />
        <rect x="0" y="24" width="90" height="12" fill={cross} />
        <rect x="24" y="0" width="12" height="60" fill={cross} />
        {outer && (
          <>
            <rect x="0" y="27" width="90" height="6" fill={outer} />
            <rect x="27" y="0" width="6" height="60" fill={outer} />
          </>
        )}
      </>
    )
  } else body = <><rect width="90" height="60" fill={c[0]} /><rect x="24" y="0" width="12" height="60" fill={c[1]} /><rect x="0" y="24" width="90" height="12" fill={c[1]} /></>
  return <svg viewBox="0 0 90 60" role="img" aria-label="Флаг">{body}<rect width="90" height="60" fill="none" stroke="rgba(0,0,0,.18)" /></svg>
}

export { LESSON_IMG }

export default function QImage({ id }) {
  const [kind, name] = String(id).includes(':') ? String(id).split(':') : ['fig', String(id)]
  const body = kind === 'flag' ? <Flag id={name} /> : (() => { const F = FIGS[name]; return F ? <F /> : null })()
  return body ? <figure className={`qimg ${kind}`}>{body}</figure> : null
}
