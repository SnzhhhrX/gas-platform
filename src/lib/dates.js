const p = (n) => String(n).padStart(2, '0')
export const today = (d = new Date()) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
