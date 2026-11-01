import { api, viaServer } from './api'
import { listUserIds, sessionId } from './auth'
import { lastDays, level, loadState } from './store'

// С сервером: рейтинг считает backend (scope: all | friends | country, period: week | month | all, metric: xp | blitz).
// Без сервера: аккаунты на этом устройстве.
export async function fetchLeaderboard({ scope = 'all', period = 'week', metric = 'xp' } = {}) {
  if (viaServer()) return api(`/leaderboard?scope=${scope}&period=${period}&metric=${metric}`)
  const week = lastDays(7).map((d) => d.date), me = sessionId()
  const rows = listUserIds().map((id) => {
    const s = loadState(id), w = week.reduce((a, d) => a + (s.activity[d] ?? 0), 0)
    return { id, username: '', name: s.profile.name, avatar: s.profile.avatar, color: s.profile.color, pro: s.pro, level: level(s.xp), streak: s.streak, relation: id === me ? 'self' : 'none',
      score: metric === 'blitz' ? s.records.blitz : period === 'all' ? s.xp : w }
  }).sort((a, b) => b.score - a.score)
  rows.forEach((r, i) => { r.rank = i > 0 && rows[i - 1].score === r.score ? rows[i - 1].rank : i + 1 })
  const mine = rows.find((r) => r.id === me)
  return { rows, me: mine && { rank: mine.rank, score: mine.score, total: rows.length }, resetsIn: null, hasCountry: false }
}
