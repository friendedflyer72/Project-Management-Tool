// server/routes/boards.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
// Import the new controller function
const { getUserBoards, createBoard, getBoardById } = require('../controllers/boardController');

// GET all boards for the logged-in user
router.get('/', auth, getUserBoards);

// ADD THIS NEW ROUTE
// @route   POST /api/boards
// @desc    Create a new board
// @access  Private
router.post('/', auth, createBoard);
router.get('/:id', auth, getBoardById);
module.exports = router;