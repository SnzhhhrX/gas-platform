import React, { useState } from 'react';

export function GamesPage({ user, updateUser }) {
  const [activeGame, setActiveGame] = useState(null);
  const [score, setScore] = useState(0);

  const startQuiz = () => {
    setActiveGame('quiz');
  };

  const handleGameFinish = () => {
    updateUser({
      ...user,
      xp: user.xp + 20,
      dailyXp: user.dailyXp + 20
    });
    setActiveGame(null);
    setScore(0);
  };

  return (
    <div className="page-content">
      <h2>Arcade Games</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        Practice skills and earn bonus XP.
      </p>

      {!activeGame ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          <div className="card">
            <h3>⚡ Quick Quiz</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '8px 0' }}>
              Speed round of 3 questions.
            </p>
            <button className="btn btn-accent" onClick={startQuiz}>
              Play (+20 XP)
            </button>
          </div>
          <div className="card" style={{ opacity: 0.6 }}>
            <h3>🌍 Guess the Country (Soon)</h3>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>⚡ Quick Quiz Active</h3>
          <p style={{ margin: '16px 0' }}>Which continent contains the Amazon Rainforest?</p>
          <button className="btn btn-outline" style={{ marginBottom: '8px' }} onClick={() => setScore(score + 1)}>
            South America (Correct)
          </button>
          <button className="btn btn-accent" onClick={handleGameFinish}>
            Finish Game
          </button>
        </div>
      )}
    </div>
  );
}
