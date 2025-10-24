// server/routes/cards.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createCard } = require('../controllers/cardController');

// @route   POST /api/cards
// @desc    Create a new card
// @access  Private
router.post('/', auth, createCard);

module.exports = router;