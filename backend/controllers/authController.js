exports.register = (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Пожалуйста, заполните все поля.' });
  }

  // Создаем фейкового пользователя для MVP
  const user = {
    id: 'user_' + Date.now(),
    username,
    email,
    level: 1,
    xp: 0,
    streak: 1,
    hearts: 5,
    maxHearts: 5,
    dailyGoal: 20,
    dailyXp: 0,
    isOnboarded: false,
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

  res.status(201).json({ message: 'Успешная регистрация', user });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Введите e-mail и пароль.' });
  }

  const user = {
    id: 'user_12345',
    username: email.split('@')[0],
    email,
    level: 2,
    xp: 150,
    streak: 3,
    hearts: 5,
    maxHearts: 5,
    dailyGoal: 20,
    dailyXp: 10,
    isOnboarded: true,
    skills: {
      Countries: 60,
      Maps: 50,
      'Physical Geography': 40,
      Climate: 70,
      'Economic Geography': 30,
      Kazakhstan: 80,
      Reasoning: 60
    }
  };

  res.json({ message: 'Успешный вход', user });
};
