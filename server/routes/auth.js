// server/routes/auth.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { register, login, getMe, updateMe, changePassword } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', register);
router.get('/me', auth, getMe);
// @route   POST /api/auth/login
// @desc    Login a user and get token
router.post('/login', login);
router.put('/me', auth, updateMe);
router.post('/change-password', auth, changePassword);

module.exports = router;