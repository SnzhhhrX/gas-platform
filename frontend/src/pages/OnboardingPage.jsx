import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProgressBar } from '../components/ProgressBar';

export function OnboardingPage({ user, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    api.getDiagnosticQuestions().then(setQuestions);
  }, []);

  if (questions.length === 0) {
    return <div className="page-content">Loading Diagnostic Test...</div>;
  }

  const currentQ = questions[currentIndex];

  const handleNext = () => {
    if (!selected) return;
    const isCorrect = selected === currentQ.answer;
    const skill = currentQ.skill;

    setScores((prev) => ({
      ...prev,
      [skill]: (prev[skill] || 0) + (isCorrect ? 1 : 0)
    }));

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    // Подсчет процентного показателя по категориям
    const totalBySkill = {};
    questions.forEach((q) => {
      totalBySkill[q.skill] = (totalBySkill[q.skill] || 0) + 1;
    });

    const calculatedSkills = {};
    Object.keys(totalBySkill).forEach((s) => {
      const correct = scores[s] || 0;
      calculatedSkills[s] = Math.round((correct / totalBySkill[s]) * 100);
    });

    const totalCorrect = Object.values(scores).reduce((a, b) => a + b, 0);
    const overallRatio = totalCorrect / questions.length;

    let overallLevel = 'Beginner';
    if (overallRatio > 0.8) overallLevel = 'Olympiad';
    else if (overallRatio > 0.6) overallLevel = 'Advanced';
    else if (overallRatio > 0.3) overallLevel = 'Intermediate';

    const updatedUser = {
      ...user,
      isOnboarded: true,
      overallLevel,
      skills: calculatedSkills,
      recommendedPath: ['Climate Basics', 'World Climate Zones', 'Geography of Kazakhstan']
    };

    setFinished(true);
    setTimeout(() => onComplete(updatedUser), 2500);
  };

  if (finished) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: '40px' }}>
        <h2>🎉 Diagnostic Completed!</h2>
        <p style={{ margin: '16px 0', color: 'var(--text-muted)' }}>
          Generating your personal geography learning path...
        </p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
        Diagnostic Assessment
      </p>
      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <div className="card" style={{ marginTop: '20px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          SKILL: {currentQ.skill}
        </span>
        <h3 style={{ margin: '12px 0' }}>{currentQ.question}</h3>

        {currentQ.options.map((opt, idx) => (
          <button
            key={idx}
            className={`option-btn ${selected === opt ? 'selected' : ''}`}
            onClick={() => setSelected(opt)}
          >
            {opt}
          </button>
        ))}

        <button
          className="btn btn-accent"
          style={{ marginTop: '12px' }}
          disabled={!selected}
          onClick={handleNext}
        >
          {currentIndex + 1 === questions.length ? 'Finish Test' : 'Next Question'}
        </button>
      </div>
    </div>
  );
}
