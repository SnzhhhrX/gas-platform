const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/leaderboard', userController.getLeaderboard);
router.post('/progress', userController.saveProgress);

module.exports = router;
