// Скелетоны загрузки: повторяют реальную вёрстку, чтобы экран не «прыгал» после загрузки.
export const Sk = ({ w = '100%', h = 14, r = 8, circle, style }) => (
  <i className="sk" aria-hidden="true" style={{ width: w, height: h, borderRadius: circle ? '50%' : r, ...style }} />
)

// Строки рейтинга / списков
export function ListSkeleton({ rows = 6, podium = false }) {
  return (
    <div role="status" aria-label="Загрузка" aria-busy="true">
      {podium && (
        <div className="sk-podium">
          {[44, 60, 36].map((h, i) => (
            <div key={i}><Sk circle w={i === 1 ? 64 : 52} h={i === 1 ? 64 : 52} /><Sk w={56} h={10} /><Sk w="100%" h={h} r={10} /></div>
          ))}
        </div>
      )}
      <div className="card board sk-rows">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="sk-row" style={{ '--d': `${i * 80}ms` }}>
            <Sk w={22} h={12} /><Sk circle w={40} h={40} />
            <div className="sk-col"><Sk w={`${55 + ((i * 17) % 30)}%`} h={12} /><Sk w="30%" h={9} /></div>
            <Sk w={54} h={14} />
          </div>
        ))}
      </div>
    </div>
  )
}
