const USER_KEY = 'gas_user_profile';
const MISTAKES_KEY = 'gas_user_mistakes';

export const storage = {
  getUser: () => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  saveUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearUser: () => {
    localStorage.removeItem(USER_KEY);
  },
  getMistakes: () => {
    const data = localStorage.getItem(MISTAKES_KEY);
    return data ? JSON.parse(data) : [];
  },
  addMistake: (question) => {
    const list = storage.getMistakes();
    if (!list.find((q) => q.id === question.id)) {
      list.push(question);
      localStorage.setItem(MISTAKES_KEY, JSON.stringify(list));
    }
  },
  removeMistake: (id) => {
    const list = storage.getMistakes().filter((q) => q.id !== id);
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(list));
  }
};
