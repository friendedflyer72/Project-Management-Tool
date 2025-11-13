// server/controllers/listController.js
const db = require('../db');
const { getIO } = require('../socket');
const { checkBoardAccess, checkBoardPermission } = require('../utils/authHelpers');
exports.createList = async (req, res) => {
  const io = getIO();
  const { name, board_id } = req.body;
  const { id: userId } = req.user;

  const hasAccess = await checkBoardPermission(userId, board_id);
  if (!hasAccess) {
    return res.status(403).json({ msg: 'Access denied' });
  }

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

    io.to(board_id.toString()).emit('BOARD_UPDATED');
    res.status(201).json(list);
    console.log("✅ List created successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateCardOrder = async (req, res) => {
  const io = getIO();
  const { id: listId } = req.params; // Get listId from URL
  const { cardIds } = req.body; // Get the array of card IDs from the body
  const { id: userId } = req.user;


  if (!cardIds || !Array.isArray(cardIds)) {
    return res.status(400).json({ msg: 'Invalid data' });
  }

  const hasAccess = await checkBoardPermission(userId, listId);
  if (!hasAccess) {
    return res.status(403).json({ msg: 'Access denied' });
  }
  const client = await db.pool.connect();

  try {
    // 1. Check if user owns this list
    const check = await client.query(
      `SELECT b.owner_id FROM lists l
       JOIN boards b ON l.board_id = b.id
       WHERE l.id = $1 AND b.owner_id = $2`,
      [listId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const boardResult = await client.query("SELECT board_id FROM lists WHERE id = $1", [listId]);
    const { board_id } = boardResult.rows[0];

    // 2. Start transaction
    await client.query('BEGIN');

    // 3. Loop through the cardIds and update the position for each
    // We use index as the new position
    for (let i = 0; i < cardIds.length; i++) {
      const cardId = cardIds[i];
      const newPosition = i;

      await client.query(
        "UPDATE cards SET position = $1, list_id = $2 WHERE id = $3",
        [newPosition, listId, cardId]
      );
    }

    // 4. Commit transaction
    await client.query('COMMIT');
    // 5. Emit event
    io.to(board_id.toString()).emit('BOARD_UPDATED');
    res.json({ msg: 'Card order updated' });

  } catch (err) {
    await client.query('ROLLBACK'); // Roll back on error
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release(); // Release client back to pool
  }
};

exports.deleteList = async (req, res) => {
  const { id } = req.params; // List ID to delete
  const { id: userId } = req.user;
  const io = getIO();

  try {
    // 1. Get the board_id from the list_id
    const listResult = await db.query(
      "SELECT board_id FROM lists WHERE id = $1",
      [id]
    );
    if (listResult.rows.length === 0) {
      return res.status(404).json({ msg: 'List not found' });
    }
    const { board_id } = listResult.rows[0]; // <-- This defines board_id

    // 2. Check if user has access to this board
    const hasAccess = await checkBoardPermission(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 3. Delete the list
    await db.query("DELETE FROM lists WHERE id = $1", [id]);

    // 4. Emit update to the room (this now works)
    io.to(board_id.toString()).emit('BOARD_UPDATED');
    res.json({ msg: 'List deleted' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};