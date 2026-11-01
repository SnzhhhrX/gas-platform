// Простые звуки через Web Audio API — без внешних файлов.
// Звук можно отключить в профиле (profile.sound === false).

let ctx = null
const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, dur, type = 'sine', gain = 0.08, when = 0) {
  try {
    const c = getCtx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(gain, c.currentTime + when)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + dur)
    o.connect(g)
    g.connect(c.destination)
    o.start(c.currentTime + when)
    o.stop(c.currentTime + when + dur + 0.05)
  } catch {}
}

export const play = (kind, enabled = true) => {
  if (!enabled) return
  // Браузер запрещает звук до первого жеста пользователя — не создаём AudioContext раньше
  if (typeof navigator !== 'undefined' && navigator.userActivation && !navigator.userActivation.hasBeenActive) return
  if (kind === 'ok') {
    tone(523, 0.08, 'sine', 0.07)
    tone(659, 0.12, 'sine', 0.07, 0.08)
  } else if (kind === 'bad') {
    tone(220, 0.18, 'triangle', 0.06)
  } else if (kind === 'combo') {
    tone(523, 0.06)
    tone(659, 0.06, 'sine', 0.07, 0.06)
    tone(784, 0.14, 'sine', 0.08, 0.12)
  } else if (kind === 'finish') {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, 'sine', 0.07, i * 0.1))
  } else if (kind === 'click') {
    tone(400, 0.04, 'sine', 0.04)
  } else if (kind === 'achieve') {
    tone(440, 0.1)
    tone(554, 0.1, 'sine', 0.07, 0.1)
    tone(659, 0.2, 'sine', 0.08, 0.2)
  }
}
