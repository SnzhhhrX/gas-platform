import { useEffect, useRef } from 'react'

const COLORS = ['#22c55e', '#16a34a', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444']

export default function Confetti({ count = 48, duration = 2800 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const pieces = []
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i')
      const size = 6 + Math.random() * 8
      p.style.cssText = `
        position:absolute; left:${Math.random() * 100}%; top:-12px;
        width:${size}px; height:${size * (0.6 + Math.random() * 0.8)}px;
        background:${COLORS[i % COLORS.length]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        opacity:0.95; pointer-events:none;
        transform:rotate(${Math.random() * 360}deg);
        animation:confetti-fall ${1.6 + Math.random() * 1.4}s cubic-bezier(.2,.7,.3,1) ${Math.random() * 0.5}s forwards;
      `
      el.appendChild(p)
      pieces.push(p)
    }
    const t = setTimeout(() => pieces.forEach((p) => p.remove()), duration)
    return () => { clearTimeout(t); pieces.forEach((p) => p.remove()) }
  }, [count, duration])

  return <div className="confetti" ref={ref} aria-hidden="true" />
}
