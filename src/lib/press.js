// «Вдавливание» кнопок: на pointerdown ставим data-pressed и держим минимум 110 мс, чтобы даже быстрый тап
// успел показать вдавливание и пружинный возврат (CSS-:active на коротком касании почти не виден).
const SEL = '.btn,.jp-hit,.lp-go,.mode,.jp-mc,.jp-cta,.jp-q,.chip,.pf-edit,.pf-gear,.icon-btn,.lrow,.pod,.urow .who'

export function initPress() {
  document.addEventListener('pointerdown', (e) => {
    const el = e.target instanceof Element ? e.target.closest(SEL) : null
    if (!el || el.disabled || el.hasAttribute('data-pressed')) return
    const t0 = performance.now()
    el.setAttribute('data-pressed', '')
    const off = () => {
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => el.removeEventListener(t, off))
      setTimeout(() => el.removeAttribute('data-pressed'), Math.max(0, 110 - (performance.now() - t0)))
    }
    ;['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => el.addEventListener(t, off))
  }, { passive: true })
}
