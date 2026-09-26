import React from 'react';

export function Header({ user }) {
  if (!user) return null;

  return (
    <header className="header">
      <div className="stat-item" style={{ color: '#ff9600' }}>
        🔥 {user.streak}d
      </div>
      <div className="stat-item" style={{ color: '#ffc800' }}>
        ⭐ {user.xp} XP
      </div>
      <div className="stat-item" style={{ color: '#ff4b4b' }}>
        ❤️ {user.hearts}/{user.maxHearts || 5}
      </div>
    </header>
  );
}
