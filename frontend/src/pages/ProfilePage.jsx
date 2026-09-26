import React from 'react';

export function ProfilePage({ user, onLogout }) {
  const skills = user.skills || {};

  return (
    <div className="page-content">
      <div className="card" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            fontSize: '1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}
        >
          👤
        </div>
        <h2>{user.username}</h2>
        <p style={{ color: 'var(--text-muted)' }}>Level: {user.overallLevel || 'Beginner'}</p>
      </div>

      <div className="card">
        <h3>Skill Profile</h3>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.keys(skills).map((key) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>{key}</span>
                <span>{skills[key]}%</span>
              </div>
              <div className="progress-container" style={{ height: '8px' }}>
                <div className="progress-fill" style={{ width: `${skills[key]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-outline" style={{ color: 'var(--danger)' }} onClick={onLogout}>
        Log Out
      </button>
    </div>
  );
}
