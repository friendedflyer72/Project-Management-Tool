// server/controllers/listController.js
const db = require('../db');

exports.createList = async (req, res) => {
  const { name, board_id } = req.body;
  const { id: userId } = req.user;

  try {
    // 1. Check if the user owns the board
    const boardCheck = await db.query(
      "SELECT owner_id FROM boards WHERE id = $1 AND owner_id = $2",
      [board_id, userId]
    );
    if (boardCheck.rows.length === 0) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 2. Find the next position for the list
    const positionResult = await db.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM lists WHERE board_id = $1",
      [board_id]
    );
    const nextPosition = positionResult.rows[0].next_pos;

    // 3. Insert the new list
    const newList = await db.query(
      "INSERT INTO lists (name, board_id, position) VALUES ($1, $2, $3) RETURNING *",
      [name, board_id, nextPosition]
    );

    // Add an empty 'cards' array to match the frontend structure
    const list = newList.rows[0];
    list.cards = [];

    res.status(201).json(list);
    console.log("✅ List created successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteList = async (req, res) => {
  const { id } = req.params; // List ID
  const { id: userId } = req.user; // User ID

  try {
    // 1. Check if user owns the board this list belongs to
    const check = await db.query(
      `SELECT b.owner_id FROM lists l
       JOIN boards b ON l.board_id = b.id
       WHERE l.id = $1 AND b.owner_id = $2`,
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ msg: 'List not found or access denied' });
    }

    // 2. Delete the list
    await db.query("DELETE FROM lists WHERE id = $1", [id]);

    res.json({ msg: 'List deleted' });
    console.log("✅ List deleted successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};