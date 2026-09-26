import React, { useState } from 'react';
import { storage } from '../services/storage';
import { QuestionCard } from '../components/QuestionCard';

export function ReviewPage({ onBack }) {
  const [mistakes, setMistakes] = useState(storage.getMistakes());

  const handleAnswer = (isCorrect, id) => {
    if (isCorrect) {
      storage.removeMistake(id);
      setTimeout(() => {
        setMistakes(storage.getMistakes());
      }, 1000);
    }
  };

  return (
    <div className="page-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '16px' }} onClick={onBack}>
        ← Back
      </button>
      <h2>Review Mistakes</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        Questions you answered incorrectly in past lessons.
      </p>

      {mistakes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          🎉 No mistakes to review! Great job.
        </div>
      ) : (
        mistakes.map((q) => (
          <QuestionCard key={q.id} questionData={q} onAnswer={(corr) => handleAnswer(corr, q.id)} />
        ))
      )}
    </div>
  );
}
