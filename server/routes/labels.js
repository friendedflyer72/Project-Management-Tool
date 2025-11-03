// server/routes/labels.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createLabel,
  addLabelToCard,
  removeLabelFromCard,
  deleteLabel
} = require('../controllers/labelController');

// @route   POST /api/labels
// @desc    Create a new label
// @access  Private
router.post('/', auth, createLabel);

// @route   POST /api/labels/add
// @desc    Add a label to a card
// @access  Private
router.post('/add', auth, addLabelToCard);

// @route   DELETE /api/labels/remove
// @desc    Remove a label from a card
// @access  Private
router.delete('/remove', auth, removeLabelFromCard);

// @route   DELETE /api/labels/:id
// @desc    Delete a label
// @access  Private
router.delete('/:id', auth, deleteLabel);

module.exports = router;