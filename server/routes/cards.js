// server/routes/cards.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createCard, updateCard, deleteCard, duplicateCard, assignUserToCard, removeUserFromCard } = require('../controllers/cardController');

// @route   POST /api/cards
// @desc    Create a new card
// @access  Private
router.post('/', auth, createCard);
router.put('/:id', auth, updateCard);
router.delete('/:id', auth, deleteCard);
router.post('/:id/duplicate', auth, duplicateCard);
router.post('/assign', auth, assignUserToCard);
router.delete('/remove-assignee', auth, removeUserFromCard);

module.exports = router;