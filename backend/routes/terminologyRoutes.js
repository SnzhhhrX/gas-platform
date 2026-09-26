const express = require('express');
const router = express.Router();
const terminologyController = require('../controllers/terminologyController');

router.get('/', terminologyController.getTerms);

module.exports = router;
