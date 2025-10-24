// server/routes/lists.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createList, deleteList } = require('../controllers/listController');

// @route   POST /api/lists
// @desc    Create a new list
// @access  Private
router.post('/', auth, createList);
router.delete('/:id', auth, deleteList);
module.exports = router;