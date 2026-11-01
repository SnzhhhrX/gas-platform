// Тема: 'auto' (как в системе) | 'light' | 'dark'. Хранится на устройстве и дублируется в профиле.
// В <html data-theme> всегда лежит итоговое значение 'light' | 'dark' — на него опирается весь CSS и глобус.
const KEY = 'gas-theme', COLORS = { light: '#f1f6f3', dark: '#111e1d' }
const mq = matchMedia('(prefers-color-scheme: dark)')
let timer
export const THEMES = [['auto', 'Авто', 'sparkles'], ['light', 'Светлая', 'sun'], ['dark', 'Тёмная', 'moon']]
export const getTheme = () => { const t = localStorage.getItem(KEY); return THEMES.some((x) => x[0] === t) ? t : 'auto' }

export function applyTheme(pref, animate = true) {
  const root = document.documentElement, real = pref === 'auto' ? (mq.matches ? 'dark' : 'light') : pref
  if (animate) { root.classList.add('theme-anim'); clearTimeout(timer); timer = setTimeout(() => root.classList.remove('theme-anim'), 400) }
  root.dataset.theme = real
  root.dataset.themePref = pref
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', COLORS[real])
}
export function setTheme(pref) { localStorage.setItem(KEY, pref); applyTheme(pref) }
export function initTheme() {
  applyTheme(getTheme(), false)
  mq.addEventListener('change', () => getTheme() === 'auto' && applyTheme('auto'))
}
