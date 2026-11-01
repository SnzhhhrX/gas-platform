// Цены Pro: с сервера (админка) или локальный fallback.
// Telegram Stars — для оплаты через бота / Stars.

const FALLBACK = {
  month: '1 490 ₸ / мес',
  year: '9 990 ₸ / год',
  monthStars: '',
  yearStars: '',
}

let cached = { ...FALLBACK, at: 0 }

export const PRO_PRICE = new Proxy(
  {},
  {
    get(_, key) {
      if (key === 'month' || key === 'year' || key === 'monthStars' || key === 'yearStars') return cached[key] ?? FALLBACK[key]
      return undefined
    },
  }
)

export async function loadPrices() {
  try {
    const base = import.meta.env.VITE_API_URL || ''
    const r = await fetch(`${base}/api/pricing`)
    if (!r.ok) return cached
    const d = await r.json()
    cached = {
      month: d.month || FALLBACK.month,
      year: d.year || FALLBACK.year,
      monthStars: d.monthStars || FALLBACK.monthStars,
      yearStars: d.yearStars || FALLBACK.yearStars,
      raw: d.raw,
      at: Date.now(),
    }
  } catch {
    /* offline */
  }
  return cached
}

export function getPrices() {
  return { month: cached.month, year: cached.year, monthStars: cached.monthStars, yearStars: cached.yearStars }
}
