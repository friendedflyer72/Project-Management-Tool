// server/controllers/cardController.js
const db = require('../db');

exports.createCard = async (req, res) => {
  const { title, list_id } = req.body;
  const { id: userId } = req.user;

  try {
    // 1. Check if the user has access to this list (by checking board ownership)
    const listCheck = await db.query(
      `SELECT l.id FROM lists l JOIN boards b ON l.board_id = b.id
       WHERE l.id = $1 AND b.owner_id = $2`,
      [list_id, userId]
    );
    if (listCheck.rows.length === 0) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 2. Find the next position for the card
    const positionResult = await db.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM cards WHERE list_id = $1",
      [list_id]
    );
    const nextPosition = positionResult.rows[0].next_pos;

    // 3. Insert the new card
    const newCard = await db.query(
      "INSERT INTO cards (title, list_id, position) VALUES ($1, $2, $3) RETURNING id, title, position, list_id",
      [title, list_id, nextPosition]
    );

    res.status(201).json(newCard.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};