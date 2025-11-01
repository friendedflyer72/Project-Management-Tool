// server/controllers/cardController.js
const db = require('../db');
const { checkBoardAccess } = require('../utils/authHelpers');

exports.createCard = async (req, res) => {
  const { title, list_id } = req.body;
  const { id: userId } = req.user;

  try {
    // 1. Get the board_id from the list_id
    const listResult = await db.query("SELECT board_id FROM lists WHERE id = $1", [list_id]);
    if (listResult.rows.length === 0) {
      return res.status(404).json({ msg: 'List not found' });
    }
    const { board_id } = listResult.rows[0]; // Now we have the board_id

    // 2. Check if user has access to this board
    const hasAccess = await checkBoardAccess(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 3. Find the next position for the card
    const positionResult = await db.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM cards WHERE list_id = $1",
      [list_id]
    );
    const nextPosition = positionResult.rows[0].next_pos;

    // 4. Insert the new card
    const newCard = await db.query(
      "INSERT INTO cards (title, list_id, position) VALUES ($1, $2, $3) RETURNING id, title, position, list_id, description, created_at",
      [title, list_id, nextPosition]
    );

    res.status(201).json(newCard.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateCard = async (req, res) => {
  const { id } = req.params; // Card ID
  const { description } = req.body;
  const { id: userId } = req.user;

  try {
    // 1. Get board_id from card_id to check permissions
    const result = await db.query(
      `SELECT l.board_id FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Card not found' });
    }
    const { board_id } = result.rows[0];

    // 2. Check permissions
    const hasAccess = await checkBoardAccess(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 3. Update the card
    const updatedCard = await db.query(
      "UPDATE cards SET description = $1 WHERE id = $2 RETURNING *",
      [description, id]
    );

    res.json(updatedCard.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteCard = async (req, res) => {
  const { id } = req.params; // Card ID
  const { id: userId } = req.user;

  try {
    // 1. Get board_id from card_id to check permissions
    const result = await db.query(
      `SELECT l.board_id FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Card not found' });
    }
    const { board_id } = result.rows[0];

    // 2. Check permissions
    const hasAccess = await checkBoardAccess(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 3. Delete the card
    await db.query("DELETE FROM cards WHERE id = $1", [id]);

    res.json({ msg: 'Card deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.duplicateCard = async (req, res) => {
  const { id } = req.params; // Card ID to duplicate
  const { id: userId } = req.user;

  try {
    // 1. Get original card data
    const cardResult = await db.query(
      `SELECT c.title, c.description, c.list_id, l.board_id FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE c.id = $1`,
      [id]
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Card not found' });
    }
    
    const { title, description, list_id, board_id } = cardResult.rows[0];

    // 2. Check permissions
    const hasAccess = await checkBoardAccess(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    const newTitle = `${title} (Copy)`;

    // 3. Find the next position in the list
    const posResult = await db.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM cards WHERE list_id = $1",
      [list_id]
    );
    const nextPosition = posResult.rows[0].next_pos;

    // 4. Insert the new (duplicated) card
    const newCard = await db.query(
      "INSERT INTO cards (title, description, list_id, position) VALUES ($1, $2, $3, $4) RETURNING *",
      [newTitle, description, list_id, nextPosition]
    );

    res.status(201).json(newCard.rows[0]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};