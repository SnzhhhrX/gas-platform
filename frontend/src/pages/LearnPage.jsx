import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function LearnPage({ onSelectLesson, onOpenTerminology }) {
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    api.getLessons().then(setLessons);
  }, []);

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Learning Path</h2>
        <button className="btn btn-outline" style={{ width: 'auto', padding: '8px 12px' }} onClick={onOpenTerminology}>
          📖 Dictionary
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {lessons.map((lesson, idx) => (
          <div key={lesson.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                {lesson.trackTitle}
              </span>
              <h4>{lesson.title}</h4>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: 'auto', padding: '8px 16px' }}
              onClick={() => onSelectLesson(lesson.id)}
            >
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
