// server/routes/cards.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createCard, updateCard } = require('../controllers/cardController');

// @route   POST /api/cards
// @desc    Create a new card
// @access  Private
router.post('/', auth, createCard);
router.put('/:id', auth, updateCard);

module.exports = router;