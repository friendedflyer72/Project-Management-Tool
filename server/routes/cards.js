// server/routes/cards.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createCard, updateCard, deleteCard, duplicateCard } = require('../controllers/cardController');

// @route   POST /api/cards
// @desc    Create a new card
// @access  Private
router.post('/', auth, createCard);
router.put('/:id', auth, updateCard);
router.delete('/:id', auth, deleteCard);
router.post('/:id/duplicate', auth, duplicateCard);

module.exports = router;