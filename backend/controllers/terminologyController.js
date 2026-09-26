const { terminology } = require('../data/seedData');

exports.getTerms = (req, res) => {
  res.json(terminology);
};
