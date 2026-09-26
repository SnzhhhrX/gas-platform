import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';

import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { LessonPage } from './pages/LessonPage';
import { ReviewPage } from './pages/ReviewPage';
import { TerminologyPage } from './pages/TerminologyPage';
import { GamesPage } from './pages/GamesPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [view, setView] = useState('main'); // main | lesson | review | terminology

  useEffect(() => {
    const saved = storage.getUser();
    if (saved) setUser(saved);
  }, []);

  const updateUser = (updated) => {
    setUser(updated);
    storage.saveUser(updated);
  };

  const handleLogout = () => {
    storage.clearUser();
    setUser(null);
  };

  if (!user) {
    return (
      <div className="app-container">
        <AuthPage onAuthSuccess={(u) => updateUser(u)} />
      </div>
    );
  }

  if (!user.isOnboarded) {
    return (
      <div className="app-container">
        <OnboardingPage user={user} onComplete={(u) => updateUser(u)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header user={user} />

      {view === 'lesson' && (
        <LessonPage
          lessonId={currentLessonId}
          user={user}
          updateUser={updateUser}
          onFinish={() => setView('main')}
        />
      )}

      {view === 'review' && <ReviewPage onBack={() => setView('main')} />}

      {view === 'terminology' && <TerminologyPage onBack={() => setView('main')} />}

      {view === 'main' && (
        <>
          {activeTab === 'home' && (
            <HomePage
              user={user}
              onStartLesson={(id) => {
                setCurrentLessonId(id);
                setView('lesson');
              }}
              onOpenReview={() => setView('review')}
            />
          )}

          {activeTab === 'learn' && (
            <LearnPage
              onSelectLesson={(id) => {
                setCurrentLessonId(id);
                setView('lesson');
              }}
              onOpenTerminology={() => setView('terminology')}
            />
          )}

          {activeTab === 'games' && <GamesPage user={user} updateUser={updateUser} />}

          {activeTab === 'leaderboard' && <LeaderboardPage />}

          {activeTab === 'profile' && <ProfilePage user={user} onLogout={handleLogout} />}

          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}
    </div>
  );
}
