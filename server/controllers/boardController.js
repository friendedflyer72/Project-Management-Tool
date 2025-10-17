// server/controllers/boardController.js
const db = require('../db');
// Get all boards for the logged-in user
exports.getUserBoards = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM boards WHERE owner_id = $1", [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create a new board
exports.createBoard = async (req, res) => {
  const { name } = req.body;
  // req.user.id is available from our authMiddleware
  const ownerId = req.user.id; 

  try {
    const result = await db.query(
      "INSERT INTO boards (name, owner_id) VALUES ($1, $2) RETURNING *",
      [name, ownerId]
    );
    res.status(201).json(result.rows[0]);
    console.log("✅ Board created successfully");
  } catch (err) {
    console.error(err.message);
    console.error("❌ Board creation failed");
    res.status(500).send('Server Error');
  }
};
// We will add createBoard, getBoardById, etc., functions here later