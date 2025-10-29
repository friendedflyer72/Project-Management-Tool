// server/controllers/authController.js
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const result = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username",
      [username, email, password_hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, username: user.username });
    console.log(user);
    console.log("✅ User registered successfully");
  } catch (err) {
    console.error(err.message);
    console.error("❌ User registration failed");
    res.status(500).send('Server error during registration.');
  }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error during login.");
    }
};
// ... (imports, register, login functions)

// --- GET CURRENT USER ---
exports.getMe = async (req, res) => {
  try {
    const user = await db.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- UPDATE USER DETAILS (USERNAME/EMAIL) ---
exports.updateMe = async (req, res) => {
  const { username, email } = req.body;
  
  // Basic validation
  if (!username || !email) {
    return res.status(400).json({ msg: 'Please provide username and email' });
  }

  try {
    const updatedUser = await db.query(
      "UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email",
      [username, email, req.user.id]
    );
    res.json(updatedUser.rows[0]);
  } catch (err) {
    // Check for unique constraint violation (e.g., email already exists)
    if (err.code === '23505') {
      return res.status(400).json({ msg: 'Email is already in use.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- CHANGE PASSWORD ---
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: 'Please fill in all fields' });
  }

  try {
    // 1. Get user's current password hash
    const user = await db.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // 2. Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect current password' });
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 4. Update password in DB
    await db.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newPasswordHash, req.user.id]
    );

    res.json({ msg: 'Password updated successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};