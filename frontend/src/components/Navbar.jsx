import React from 'react';

export function Navbar({ activeTab, setActiveTab }) {
  const items = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'learn', label: 'Learn', icon: '🗺' },
    { id: 'games', label: 'Games', icon: '🎮' },
    { id: 'leaderboard', label: 'Rank', icon: '🏆' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <nav className="navbar">
      {items.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
