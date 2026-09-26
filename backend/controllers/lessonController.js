const { diagnosticQuestions, lessons } = require('../data/seedData');

exports.getDiagnosticQuestions = (req, res) => {
  res.json(diagnosticQuestions);
};

exports.getLessons = (req, res) => {
  res.json(lessons);
};

exports.getLessonById = (req, res) => {
  const lesson = lessons.find(l => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Урок не найден' });
  res.json(lesson);
};
