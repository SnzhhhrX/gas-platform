import React, { useState } from 'react';

export function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      id: 'usr_' + Date.now(),
      username: form.username || form.email.split('@')[0] || 'Explorer',
      email: form.email,
      level: 1,
      xp: 0,
      streak: 1,
      hearts: 5,
      maxHearts: 5,
      dailyGoal: 20,
      dailyXp: 0,
      isOnboarded: false,
      completedLessons: [],
      skills: {
        Countries: 0,
        Maps: 0,
        'Physical Geography': 0,
        Climate: 0,
        'Economic Geography': 0,
        Kazakhstan: 0,
        Reasoning: 0
      }
    };
    onAuthSuccess(newUser);
  };

  return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: '40px' }}>
      <h1 style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>GAS</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
        Geography. Adventure. Skills.
      </p>

      <div className="card">
        <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              className="option-btn"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="option-btn"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="option-btn"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit" className="btn btn-primary">
            {isLogin ? 'Continue' : 'Create Account'}
          </button>
        </form>

        <button
          className="btn btn-outline"
          style={{ marginTop: '12px' }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Need an account? Sign Up' : 'Have an account? Log In'}
        </button>
      </div>
    </div>
  );
}
