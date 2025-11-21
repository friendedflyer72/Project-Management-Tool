const express = require('express');
const router = express.Router();
const { generateDescription } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/generate-description', authMiddleware, generateDescription);

module.exports = router;