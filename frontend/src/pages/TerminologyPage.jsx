import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function TerminologyPage({ onBack }) {
  const [terms, setTerms] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getTerminology().then(setTerms);
  }, []);

  const filtered = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '16px' }} onClick={onBack}>
        ← Back
      </button>
      <h2>Geographic Dictionary</h2>

      <input
        type="text"
        className="option-btn"
        placeholder="Search terms..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginTop: '12px' }}
      />

      <div style={{ marginTop: '16px' }}>
        {filtered.map((item) => (
          <div key={item.id} className="card">
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
              {item.category}
            </span>
            <h3>{item.term}</h3>
            <p style={{ marginTop: '6px', color: '#444' }}>{item.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
