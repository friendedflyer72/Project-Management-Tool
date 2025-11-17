// server/controllers/cardController.js
const db = require('../db');
const { getIO } = require('../socket');
const { checkBoardAccess, checkBoardPermission } = require('../utils/authHelpers');
const { logActivity } = require('../utils/logActivity');

exports.createCard = async (req, res) => {
  const io = getIO();
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
    const hasAccess = await checkBoardPermission(userId, board_id);
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
      "INSERT INTO cards (title, list_id, position) VALUES ($1, $2, $3) RETURNING *",
      [title, list_id, nextPosition]
    );

    logActivity(userId, board_id, `Created card: ${title}`);
    io.to(board_id.toString()).emit('BOARD_UPDATED');
    res.status(201).json(newCard.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateCard = async (req, res) => {
  const io = getIO();
  const { id } = req.params; // Card ID
  // 1. Get 'checklist' from the request body
  const { description, due_date, checklist } = req.body;
  const { id: userId } = req.user;

  try {
    // 2. Get board_id from card_id to check permissions
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

    // 3. Check permissions
    const hasAccess = await checkBoardPermission(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 4. Update the card with all new fields
    const updatedCard = await db.query(
      `UPDATE cards 
       SET 
         description = $1, 
         due_date = $2, 
         checklist = $3, 
         updated_by = $4,  
         updated_at = NOW()  
       WHERE id = $5 
       RETURNING *`,
      [description, due_date || null, JSON.stringify(checklist), userId, id]
    );

    logActivity(userId, board_id, `Updated card: ${updatedCard.rows[0].title}`);
    io.to(board_id.toString()).emit('BOARD_UPDATED');
    res.json(updatedCard.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteCard = async (req, res) => {
  const io = getIO();
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
    const hasAccess = await checkBoardPermission(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 3. Delete the card
    await db.query("DELETE FROM cards WHERE id = $1", [id]);

    logActivity(userId, board_id, 'Deleted card');
    io.to(board_id.toString()).emit('BOARD_UPDATED');
    res.json({ msg: 'Card deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.duplicateCard = async (req, res) => {
  const io = getIO();
  const { id: originalCardId } = req.params; // Card ID to duplicate
  const { id: userId } = req.user;

  const client = await db.pool.connect(); // Use a client for transaction

  try {
    // 1. Get original card data & verify ownership
    // --- THIS IS THE FIX: Use client.query ---
    const cardResult = await client.query(
      `SELECT c.title, c.description, c.list_id, c.due_date, c.checklist, l.board_id 
       FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE c.id = $1`,
      [originalCardId]
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Card not found' });
    }

    const { title, description, list_id, due_date, checklist, board_id } = cardResult.rows[0];

    // 2. Check permissions
    const hasAccess = await checkBoardPermission(userId, board_id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // --- START TRANSACTION ---
    await client.query('BEGIN');

    // 3. Find the next position in the list
    const posResult = await client.query(
      "SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM cards WHERE list_id = $1",
      [list_id]
    );
    const nextPosition = posResult.rows[0].next_pos;
    const newTitle = `${title} (Copy)`;

    // 4. Handle checklist data (this is still important)
    let checklistToInsert = [];
    if (Array.isArray(checklist)) {
      checklistToInsert = checklist;
    } else if (typeof checklist === 'string') {
      try {
        const parsed = JSON.parse(checklist);
        if (Array.isArray(parsed)) {
          checklistToInsert = parsed;
        }
      } catch (e) { /* default to [] */ }
    }

    // 5. Insert the new (duplicated) card
    const newCardResult = await client.query(
      `INSERT INTO cards (title, description, list_id, position, due_date, checklist) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      // --- FIX IS HERE ---
      // We must stringify the array, just like we do in updateCard
      [newTitle, description, list_id, nextPosition, due_date, JSON.stringify(checklistToInsert)]
    );

    const newCard = newCardResult.rows[0];
    const newCardId = newCard.id;

    // 6. Get labels from the ORIGINAL card
    const labelResult = await client.query(
      "SELECT label_id FROM card_labels WHERE card_id = $1",
      [originalCardId]
    );

    // 7. Insert those labels for the NEW card
    if (labelResult.rows.length > 0) {
      const labelValues = labelResult.rows.map(row => `(${newCardId}, ${row.label_id})`).join(',');
      await client.query(
        `INSERT INTO card_labels (card_id, label_id) VALUES ${labelValues}`
      );
    }

    // --- COMMIT TRANSACTION ---
    await client.query('COMMIT');

    // 8. Add the (now copied) label IDs to the card object
    logActivity(userId, board_id, 'Duplicated card');
    io.to(board_id.toString()).emit('BOARD_UPDATED');
    newCard.labels = labelResult.rows.map(row => row.label_id);

    res.status(201).json(newCard);

  } catch (err) {
    await client.query('ROLLBACK'); // Roll back on any error
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release(); // ALWAYS release the client
  }
};
exports.assignUserToCard = async (req, res) => {
  const { card_id, user_id_to_assign } = req.body;
  const { id: requestUserId } = req.user;

  try {
    // 1. Get board_id to check permissions
    const result = await db.query(`SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1`, [card_id]);
    const { board_id } = result.rows[0];

    // 2. Check if request user has 'editor' access
    const hasAccess = await checkBoardPermission(requestUserId, board_id, ['owner', 'editor']);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 3. Insert the assignment
    await db.query(
      "INSERT INTO card_assignees (card_id, user_id) VALUES ($1, $2)",
      [card_id, user_id_to_assign]
    );
    res.status(201).json({ msg: 'User assigned' });
  } catch (err) {
    if (err.code === '23505') return res.status(200).json({ msg: 'User already assigned.' });
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.removeUserFromCard = async (req, res) => {
  const { card_id, user_id_to_remove } = req.body;
  const { id: requestUserId } = req.user;

  try {
    // 1. Check permission
    const result = await db.query(`SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1`, [card_id]);
    const { board_id } = result.rows[0];
    const hasAccess = await checkBoardPermission(requestUserId, board_id, ['owner', 'editor']);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 2. Delete the assignment
    await db.query(
      "DELETE FROM card_assignees WHERE card_id = $1 AND user_id = $2",
      [card_id, user_id_to_remove]
    );
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};