import React from 'react';

export function HomePage({ user, onStartLesson, onOpenReview }) {
  const goalProgress = Math.min(100, Math.round((user.dailyXp / user.dailyGoal) * 100));

  return (
    <div className="page-content">
      <h2>Good day, {user.username}! 👋</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        Level: <strong>{user.overallLevel || 'Beginner'}</strong>
      </p>

      {/* Карточка Daily Goal */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <strong>Daily Goal</strong>
          <span>
            {user.dailyXp} / {user.dailyGoal} XP
          </span>
        </div>
        <div className="progress-container">
          <div className="progress-fill" style={{ width: `${goalProgress}%` }} />
        </div>
        {goalProgress >= 100 && (
          <p style={{ color: 'var(--accent)', fontWeight: 700, marginTop: '8px', fontSize: '0.85rem' }}>
            🎉 Daily Goal Complete!
          </p>
        )}
      </div>

      {/* Карточка текущего урока */}
      <div className="card" style={{ borderLeft: '6px solid var(--primary)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
          RECOMMENDED LESSON
        </span>
        <h3 style={{ margin: '6px 0' }}>Climate Basics</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '14px' }}>
          Master atmospheric layers, temperature gradients and climate systems.
        </p>
        <button className="btn btn-accent" onClick={() => onStartLesson('climate-basics')}>
          Continue Learning
        </button>
      </div>

      {/* Повторение ошибок */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4>Review Mistakes</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Practice questions you got wrong
          </p>
        </div>
        <button className="btn btn-outline" style={{ width: 'auto' }} onClick={onOpenReview}>
          Review
        </button>
      </div>
    </div>
  );
}
