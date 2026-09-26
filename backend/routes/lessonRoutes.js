const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');

router.get('/diagnostic', lessonController.getDiagnosticQuestions);
router.get('/', lessonController.getLessons);
router.get('/:id', lessonController.getLessonById);

module.exports = router;
