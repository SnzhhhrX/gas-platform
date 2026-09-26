import React, { useState } from 'react';

export function QuestionCard({ questionData, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (option) => {
    if (submitted) return;
    setSelected(option);
  };

  const handleSubmit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);
    const isCorrect = selected === questionData.answer;
    onAnswer(isCorrect, selected);
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px' }}>{questionData.question}</h3>

      <div>
        {questionData.options.map((opt, idx) => {
          let btnClass = 'option-btn';
          if (selected === opt) btnClass += ' selected';
          if (submitted) {
            if (opt === questionData.answer) btnClass += ' correct';
            else if (selected === opt) btnClass += ' incorrect';
          }

          return (
            <button
              key={idx}
              className={btnClass}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          className="btn btn-accent"
          style={{ marginTop: '12px' }}
          disabled={!selected}
          onClick={handleSubmit}
        >
          Check Answer
        </button>
      ) : (
        <div style={{ marginTop: '16px' }}>
          {selected === questionData.answer ? (
            <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
              ✅ Correct! +10 XP
            </div>
          ) : (
            <div>
              <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                ❌ Incorrect
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '4px', color: '#555' }}>
                {questionData.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
