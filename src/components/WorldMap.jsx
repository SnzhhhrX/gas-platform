import { useEffect, useRef } from 'react'
import { geoCircle, geoContains, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { COUNTRIES, PRESETS, nameOf } from '../data/world'
import { Icon } from './Icon'

// Глобус на canvas: рисуем только по необходимости, камера — в ref (без перерисовок React).
// Жесты: перетаскивание вращает, щипок/колесо — зум. mode='find': нажмите страну → «Проверить»; mode='show': страна выделена.
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const MINK = 0.8, MAXK = 40
const GRAT = geoGraticule10()
const COLORS = {
  light: { sea: '#cfe8f5', land: '#f1f4ea', line: '#cfe0c8', sel: '#9be3b5', ok: '#22c55e', bad: '#ef4444', grat: 'rgba(30,80,110,.12)' },
  dark: { sea: '#0f2230', land: '#2c4538', line: '#1b2e24', sel: '#2f8f5c', ok: '#22c55e', bad: '#f87171', grat: 'rgba(255,255,255,.07)' },
}
const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180
// камера по стране: центр + масштаб так, чтобы страна занимала ~половину диаметра
const focusCam = (c) => [c.c[0], c.c[1], clamp(51 / c.size, 1.2, 14)]

export default function WorldMap({ mode = 'find', region = 'world', picked = null, answer, selected = null, onSelect, hinted, focusId }) {
  const show = mode === 'show'
  const done = picked != null
  const ok = picked === answer
  const target = COUNTRIES.find((c) => c.id === answer)
  const box = useRef(null), cv = useRef(null)
  const cam = useRef(show ? focusCam(target) : PRESETS.find((p) => p.key === region)?.cam ?? PRESETS[0].cam) // [λ, φ, k]
  const to = useRef(null), t0 = useRef(0), from = useRef(null)
  const fx = useRef({ start: 0 }) // время начала эффекта ответа
  const props = useRef({})
  props.current = { show, done, ok, answer, picked, selected, hinted, target }
  const draw = useRef(() => {})
  const raf = useRef(0)
  const kick = () => { if (!raf.current) raf.current = requestAnimationFrame(frame) }
  const fly = (c) => { from.current = [...cam.current]; to.current = c; t0.current = performance.now(); kick() }

  function frame(now) {
    raf.current = 0
    let busy = false
    if (to.current) {
      const k = Math.min(1, (now - t0.current) / 500), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
      const [a, b] = [from.current, to.current]
      cam.current = [wrap(a[0] + wrap(b[0] - a[0]) * e), a[1] + (b[1] - a[1]) * e, a[2] * (b[2] / a[2]) ** e]
      if (k < 1) busy = true; else to.current = null
    }
    if (now - fx.current.start < 1600) busy = true
    draw.current(now)
    if (busy) kick()
  }

  // отрисовка + размер + жесты
  useEffect(() => {
    const el = cv.current, ctx = el.getContext('2d')
    let w = 0, h = 0, proj = geoOrthographic().clipAngle(90).precision(0.6)
    const path = geoPath(proj, ctx)
    const setup = () => {
      const r = el.parentNode.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2)
      w = r.width; h = r.height
      el.width = w * dpr; el.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      kick()
    }
    const radius = () => (Math.min(w, h) / 2) * 0.92
    const place = () => { const [l, p, k] = cam.current; proj.rotate([-l, -p]).translate([w / 2, h / 2]).scale(radius() * k) }

    draw.current = (now) => {
      const P = props.current, C = COLORS[document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light']
      place()
      ctx.clearRect(0, 0, w, h)
      ctx.beginPath(); path({ type: 'Sphere' }); ctx.fillStyle = C.sea; ctx.fill()
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke()
      const zoomed = cam.current[2] > 2.2
      if (zoomed) { ctx.beginPath(); path(GRAT); ctx.strokeStyle = C.grat; ctx.lineWidth = 0.6; ctx.stroke() }
      const t = now - fx.current.start
      ctx.lineJoin = 'round'
      const special = []
      for (const c of COUNTRIES) {
        const st = P.show ? (c.id === P.answer ? 'focus' : '') : !P.done ? (c.id === P.selected ? 'sel' : '') : c.id === P.answer ? 'right' : c.id === P.picked ? 'wrong' : 'dim'
        if (st && st !== 'dim') { special.push([c, st]); continue }
        ctx.beginPath(); path(c.f)
        ctx.globalAlpha = st === 'dim' ? 0.45 : 1
        ctx.fillStyle = C.land; ctx.fill()
        ctx.strokeStyle = C.line; ctx.lineWidth = zoomed ? 1 : 0.6; ctx.stroke()
      }
      ctx.globalAlpha = 1
      for (const [c, st] of special) { // выделенные страны рисуем поверх, с лёгким свечением
        ctx.save()
        if (st === 'wrong' && t < 400) ctx.translate(Math.sin(t / 30) * 3 * (1 - t / 400), 0)
        if (st === 'right' && t < 700) { // «пружинка»: страна чуть вырастает и возвращается
          const pc = proj(c.c)
          if (pc) { const k = 1 + 0.09 * Math.sin((t / 700) * Math.PI); ctx.translate(pc[0], pc[1]); ctx.scale(k, k); ctx.translate(-pc[0], -pc[1]) }
        }
        ctx.shadowColor = st === 'wrong' ? C.bad : C.ok
        ctx.shadowBlur = st === 'sel' ? 10 : st === 'right' && t < 1400 ? 10 + 16 * Math.sin((t / 1400) * Math.PI) : 8
        ctx.beginPath(); path(c.f)
        ctx.fillStyle = st === 'sel' ? C.sel : st === 'wrong' ? C.bad : C.ok; ctx.fill()
        ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.stroke()
        ctx.restore()
      }
      const tg = P.target
      if (tg && P.hinted && !P.done && !P.show) { // подсказка: область поиска
        ctx.beginPath(); path(geoCircle().center(tg.c).radius(14)())
        ctx.fillStyle = 'rgba(34,197,94,.14)'; ctx.fill()
        ctx.setLineDash([6, 5]); ctx.strokeStyle = C.ok; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([])
      }
      if (tg && P.done && P.ok) { // две волны от верной страны
        for (const delay of [0, 280]) {
          const u = (t - delay) / 1000
          if (u < 0 || u > 1) continue
          ctx.beginPath(); path(geoCircle().center(tg.c).radius(2 + u * 24)())
          ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - u)})`; ctx.lineWidth = 3.5 - 2 * u; ctx.stroke()
        }
      }
      if (P.done && !P.show) { // подписи-«таблетки»: верный ответ и выбранная страна
        const fam = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif'
        ctx.font = `800 15px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        for (const c of COUNTRIES) {
          if (c.id !== P.answer && c.id !== P.picked) continue
          if (geoDistance(c.c, cam.current) > 1.4) continue // на обратной стороне глобуса
          const p = proj(c.c); if (!p) continue
          const ok = c.id === P.answer, label = nameOf(c.id)
          const u = Math.min(1, Math.max(0, (t - (ok ? 150 : 0)) / 320)), e = 1 - Math.pow(1 - u, 3)
          const tw = ctx.measureText(label).width + 20, th = 26, x = p[0] - tw / 2, y = p[1] - th / 2 - 4 * (1 - e)
          ctx.globalAlpha = e
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, tw, th, 13) : ctx.rect(x, y, tw, th)
          ctx.fillStyle = ok ? C.ok : C.bad; ctx.fill()
          ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke()
          ctx.fillStyle = '#fff'; ctx.fillText(label, p[0], y + th / 2 + 1)
          ctx.globalAlpha = 1
        }
      }
    }

    const ro = new ResizeObserver(setup); ro.observe(el.parentNode); setup()
    const mo = new MutationObserver(kick) // смена темы → перерисовать глобус
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const zoomBy = (f) => { to.current = null; cam.current = [cam.current[0], cam.current[1], clamp(cam.current[2] * f, MINK, MAXK)]; kick() }
    const wheel = (e) => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.0015)) }
    el.addEventListener('wheel', wheel, { passive: false })

    // жесты
    const ptrs = new Map(); let g = null
    const down = (e) => {
      el.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); to.current = null
      if (ptrs.size === 1) g = { x: e.clientX, y: e.clientY, cam: [...cam.current], moved: false }
      else { const [a, b] = [...ptrs.values()]; g = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), cam: [...cam.current], moved: true, pinch: true } }
    }
    const move = (e) => {
      if (!ptrs.has(e.pointerId) || !g) return
      ptrs.set(e.pointerId, [e.clientX, e.clientY])
      if (g.pinch && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()]
        cam.current = [g.cam[0], g.cam[1], clamp((g.cam[2] * Math.hypot(a[0] - b[0], a[1] - b[1])) / g.d, MINK, MAXK)]; kick()
      } else if (!g.pinch && ptrs.size === 1) {
        const dx = e.clientX - g.x, dy = e.clientY - g.y
        if (!g.moved && Math.hypot(dx, dy) < 6) return
        g.moved = true
        const s = 180 / Math.PI / (radius() * g.cam[2]) // пикселей → градусов
        cam.current = [wrap(g.cam[0] - dx * s), clamp(g.cam[1] + dy * s, -85, 85), g.cam[2]]; kick()
      }
    }
    const up = (e) => {
      if (!ptrs.has(e.pointerId)) return
      const tap = g && !g.moved && !g.pinch && e.type === 'pointerup'
      ptrs.delete(e.pointerId)
      if (tap && !props.current.show && !props.current.done) {
        const r = el.getBoundingClientRect(); place()
        const ll = proj.invert([e.clientX - r.left, e.clientY - r.top])
        const hit = ll && !isNaN(ll[0]) && COUNTRIES.find((c) => geoContains(c.f, ll))
        if (hit) onPick.current(hit.id)
      }
      if (!ptrs.size) g = null
    }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up)
    return () => { ro.disconnect(); mo.disconnect(); cancelAnimationFrame(raf.current); raf.current = 0; el.removeEventListener('wheel', wheel); el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up) }
  }, [])

  const onPick = useRef(); onPick.current = (id) => onSelect?.(id)
  useEffect(() => { if (done && !show) { fx.current.start = performance.now(); fly(focusCam(target)) } }, [done])
  useEffect(() => { if (hinted && !done && !show) fly([target.c[0], target.c[1], 3]) }, [hinted])
  useEffect(() => { kick() }, [picked, selected, hinted, answer])
  const first = useRef(true)
  // новый вопрос на той же карте (блиц) → вернуть общий вид; focusId → подлететь к стране (атлас)
  useEffect(() => { if (first.current) { first.current = false; return } if (!show) fly(PRESETS.find((p) => p.key === region)?.cam ?? PRESETS[0].cam) }, [answer])
  useEffect(() => { const c = COUNTRIES.find((x) => x.id === focusId); if (c) fly(focusCam(c)) }, [focusId])
  const zoom = (f) => fly([cam.current[0], cam.current[1], clamp(cam.current[2] * f, MINK, MAXK)])

  return (
    <div className="mapcard" ref={box}>
      <canvas ref={cv} className={`map ${show ? 'static' : ''}`} role="img" aria-label="Глобус" />
      <div className="mappill">{show ? 'Какая это страна?' : done ? `Верный ответ: ${nameOf(answer)}` : selected ? `${nameOf(selected)}` : 'Вращайте глобус и коснитесь страны'}</div>
      <div className="mapctl">
        <button onClick={() => zoom(1.8)} aria-label="Приблизить"><Icon name="plus" size={18} /></button>
        <button onClick={() => zoom(1 / 1.8)} aria-label="Отдалить"><Icon name="minus" size={18} /></button>
        <button onClick={() => fly(PRESETS[0].cam)} aria-label="Весь мир"><Icon name="globe" size={18} /></button>
      </div>
      {!show && <div className="presets">
        {PRESETS.slice(1).map((p) => <button key={p.label} onClick={() => fly(p.cam)}>{p.label}</button>)}
      </div>}
    </div>
  )
}
