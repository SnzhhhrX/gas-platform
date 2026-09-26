import { mockDiagnosticQuestions, mockLessons, mockTerminology } from '../data/mockData';

const BASE_URL = 'http://localhost:5000/api';

export const api = {
  async getDiagnosticQuestions() {
    try {
      const res = await fetch(`${BASE_URL}/lessons/diagnostic`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return mockDiagnosticQuestions;
    }
  },

  async getLessons() {
    try {
      const res = await fetch(`${BASE_URL}/lessons`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return mockLessons;
    }
  },

  async getTerminology() {
    try {
      const res = await fetch(`${BASE_URL}/terminology`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return mockTerminology;
    }
  },

  async getLeaderboard() {
    try {
      const res = await fetch(`${BASE_URL}/user/leaderboard`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return [
        { id: '1', username: 'Alikhan_Geo', xp: 2450, level: 8 },
        { id: '2', username: 'MapMaster_99', xp: 1890, level: 6 },
        { id: '3', username: 'Dana_Explorer', xp: 1340, level: 5 }
      ];
    }
  }
};
