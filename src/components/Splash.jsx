import { Mascot } from './Mascot'
import { Wordmark } from './Wordmark'

// Экран загрузки: Гас, название и три пульсирующие точки. Без полосы прогресса — загрузка короткая и неизмеримая.
export default function Splash() {
  return (
    <div className="app splash" role="status" aria-live="polite" aria-label="Загрузка">
      <div className="sp-stage"><Mascot mood="wave" size={150} /></div>
      <div className="splash-title"><Wordmark height={44} /></div>
      <p className="sp-sub">География за 5 минут в день</p>
      <div className="sp-dots" aria-hidden="true"><i /><i /><i /></div>
    </div>
  )
}
