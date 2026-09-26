import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';

export function LessonPage({ lessonId, user, updateUser, onFinish }) {
  const [lesson, setLesson] = useState(null);
  const [step, setStep] = useState(0);
  const [xpGained, setXpGained] = useState(0);

  useEffect(() => {
    api.getLessons().then((list) => {
      const found = list.find((l) => l.id === lessonId) || list[0];
      setLesson(found);
    });
  }, [lessonId]);

  if (!lesson) return <div className="page-content">Loading Lesson...</div>;

  const currentQ = lesson.questions[step];

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setXpGained((prev) => prev + 10);
    } else {
      // Сохраняем ошибку в список повторения
      storage.addMistake(currentQ);
      // Уменьшаем жизни
      if (user.hearts > 0) {
        updateUser({ ...user, hearts: user.hearts - 1 });
      }
    }

    setTimeout(() => {
      if (step + 1 < lesson.questions.length) {
        setStep(step + 1);
      } else {
        // Завершение урока
        const totalXp = xpGained + 30; // 30 bonus XP за финиш
        updateUser({
          ...user,
          xp: user.xp + totalXp,
          dailyXp: user.dailyXp + totalXp,
          completedLessons: [...(user.completedLessons || []), lesson.id]
        });
        onFinish();
      }
    }, 1500);
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '16px' }}>
        <h2>{lesson.title}</h2>
        <ProgressBar current={step + 1} total={lesson.questions.length} />
      </div>

      <QuestionCard key={currentQ.id} questionData={currentQ} onAnswer={handleAnswer} />
    </div>
  );
}
