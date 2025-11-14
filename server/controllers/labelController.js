// server/controllers/labelController.js
const db = require('../db');
const { checkBoardAccess, checkBoardPermission } = require('../utils/authHelpers');
const { getIO } = require('../socket');
const { logActivity } = require('../utils/logActivity');

// --- Create a new label for a board ---
exports.createLabel = async (req, res) => {
  const io = getIO();
  const { name, color, board_id } = req.body;
  const { id: userId } = req.user;

  try {
    const hasAccess = await checkBoardPermission(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const newLabel = await db.query(
      "INSERT INTO labels (name, color, board_id) VALUES ($1, $2, $3) RETURNING *",
      [name, color, board_id]
    );

    logActivity(userId, board_id, `Created label: ${name}`);
    io.to(board_id).emit('label-created', newLabel.rows[0]);
    res.status(201).json(newLabel.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- Add a label to a card ---
exports.addLabelToCard = async (req, res) => {
  const io = getIO();
  const { card_id, label_id } = req.body;
  const { id: userId } = req.user;

  try {
    // 1. Check permission by getting the board_id from the card
    const result = await db.query(
      `SELECT l.board_id FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE c.id = $1`,
      [card_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Card not found' });
    }
    const { board_id } = result.rows[0];

    const hasAccess = await checkBoardPermission(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 2. Add the link
    await db.query(
      "INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)",
      [card_id, label_id]
    );

    logActivity(userId, board_id, `Added label to card: ${label_id}`);
    io.to(board_id).emit('label-added', { card_id, label_id });
    res.status(201).json({ msg: 'Label added' });
  } catch (err) {
    // Ignore "duplicate key" errors
    if (err.code === '23505') {
      return res.status(200).json({ msg: 'Label already exists on card.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// --- Remove a label from a card ---
exports.removeLabelFromCard = async (req, res) => {
  const io = getIO();
  const { card_id, label_id } = req.body;
  const { id: userId } = req.user;

  try {
    // 1. Check permission
    const result = await db.query(
      `SELECT l.board_id FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE c.id = $1`,
      [card_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Card not found' });
    }
    const { board_id } = result.rows[0];

    const hasAccess = await checkBoardPermission(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 2. Remove the link
    await db.query(
      "DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2",
      [card_id, label_id]
    );

    logActivity(userId, board_id, `Removed label from card: ${label_id}`);
    io.to(board_id).emit('label-removed', { card_id, label_id });
    res.json({ msg: 'Label removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteLabel = async (req, res) => {
  const io = getIO();
  const { id } = req.params; // Label ID to delete
  const { id: userId } = req.user;

  try {
    // 1. Get the board_id from the label
    const labelResult = await db.query(
      "SELECT board_id FROM labels WHERE id = $1",
      [id]
    );
    if (labelResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Label not found' });
    }
    const { board_id } = labelResult.rows[0];

    // 2. Check if user has access to this board
    const hasAccess = await checkBoardPermission(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 3. Check if the user is the *owner* of that board
    const boardResult = await db.query(
      "SELECT owner_id FROM boards WHERE id = $1 AND owner_id = $2",
      [board_id, userId]
    );
    if (boardResult.rows.length === 0) {
      return res.status(403).json({ msg: 'Only the board owner can delete labels.' });
    }

    // 4. Delete the label
    await db.query("DELETE FROM labels WHERE id = $1", [id]);

    // 5. Emit update to the room (this now works)
    logActivity(board_id, userId, 'deleted label');
    io.to(board_id.toString()).emit('BOARD_UPDATED');
    res.json({ msg: 'Label deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};