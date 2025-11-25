const express = require('express');
const router = express.Router();
const { generateDescription, parseTask } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/generate-description', authMiddleware, generateDescription);
router.post('/parse-task', authMiddleware, parseTask);

module.exports = router;
