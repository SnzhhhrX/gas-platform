import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function LeaderboardPage() {
  const [list, setList] = useState([]);

  useEffect(() => {
    api.getLeaderboard().then(setList);
  }, []);

  return (
    <div className="page-content">
      <h2>Weekly Leaderboard</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        Top explorers this week.
      </p>

      <div className="card">
        {list.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: index < list.length - 1 ? '1px solid var(--border)' : 'none'
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, width: '20px' }}>{index + 1}.</span>
              <span>{item.username}</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>
              {item.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
