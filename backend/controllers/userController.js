const { leaderboard } = require('../data/seedData');

exports.getLeaderboard = (req, res) => {
  res.json(leaderboard);
};

exports.saveProgress = (req, res) => {
  const { user } = req.body;
  // В MVP сохранение подтверждается сервером
  res.json({ status: 'success', user });
};
