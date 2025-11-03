// server/controllers/boardController.js
const db = require('../db');
const { checkBoardAccess } = require('../utils/authHelpers');
// Get all boards for the logged-in user
exports.getUserBoards = async (req, res) => {
  try {
    // This query gets boards the user owns AND boards they are a member of.
    // add a 'role' field so the frontend knows who is the owner.
    const query = `
      (SELECT id, name, owner_id, 'owner' as role FROM boards
       WHERE owner_id = $1)
      UNION
      (SELECT b.id, b.name, b.owner_id, 'member' as role FROM boards b
       JOIN board_members bm ON b.id = bm.board_id
       WHERE bm.user_id = $1)
    `;
    const { rows } = await db.query(query, [req.user.id]);
    res.json(rows);
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
exports.getBoardById = async (req, res) => {
  const { id : boardId } = req.params; // Board ID from URL
  const { id: userId } = req.user; // User ID from auth token

  try {
    // --- PERMISSION CHECK ---
    const hasAccess = await checkBoardAccess(userId, boardId);
    if (!hasAccess) {
      return res.status(404).json({ msg: 'Board not found or access denied' });
    }

    // --- We will run 3 queries in parallel ---

    // Query 1: Get lists and cards (as before)
    const listCardQuery = `
      SELECT
        l.id AS list_id, l.name AS list_name, l.position AS list_position,
        c.id AS card_id, c.title AS card_title, c.description AS card_description,
        c.created_at AS card_created_at, c.due_date AS card_due_date, 
        c.checklist AS card_checklist, c.position AS card_position
      FROM lists l
      LEFT JOIN cards c ON l.id = c.list_id
      WHERE l.board_id = $1
      ORDER BY l.position, c.position;
    `;
    const listCardPromise = db.query(listCardQuery, [boardId]);

    // Query 2: Get all labels for this board
    const labelQuery = "SELECT * FROM labels WHERE board_id = $1";
    const labelPromise = db.query(labelQuery, [boardId]);

    // Query 3: Get all card-label relationships for this board
    const cardLabelQuery = `
      SELECT cl.card_id, cl.label_id
      FROM card_labels cl
      JOIN cards c ON cl.card_id = c.id
      JOIN lists l ON c.list_id = l.id
      WHERE l.board_id = $1;
    `;
    const cardLabelPromise = db.query(cardLabelQuery, [boardId]);

    // Query 4: Get board details (like name)
    const boardPromise = db.query("SELECT * FROM boards WHERE id = $1", [boardId]);

    // --- Wait for all queries to finish ---
    const [listCardResult, labelResult, cardLabelResult, boardResult] =
      await Promise.all([
        listCardPromise,
        labelPromise,
        cardLabelPromise,
        boardPromise,
      ]);

    // --- Start Hydration ---
    const board = boardResult.rows[0];
    board.lists = [];
    board.labels = labelResult.rows; // Add all board labels to the response

    const listsMap = new Map();
    const cardLabelLinks = cardLabelResult.rows;

    listCardResult.rows.forEach(row => {
      // Create list if it doesn't exist
      if (row.list_id && !listsMap.has(row.list_id)) {
        listsMap.set(row.list_id, {
          id: row.list_id,
          name: row.list_name,
          position: row.list_position,
          cards: [],
        });
      }

      // Add card to list
      if (row.card_id) {
        const list = listsMap.get(row.list_id);
        if (list) {
          // Check if card is already added (to prevent duplicates from joins)
          let card = list.cards.find(c => c.id === row.card_id);
          if (!card) {
            // Find all label IDs for this card
            const labelsForThisCard = cardLabelLinks
              .filter(link => link.card_id === row.card_id)
              .map(link => link.label_id);

            card = {
              id: row.card_id,
              title: row.card_title,
              description: row.card_description,
              created_at: row.card_created_at,
              due_date: row.card_due_date,
              checklist: row.card_checklist,
              position: row.card_position,
              labels: labelsForThisCard, // Add array of label IDs
            };
            list.cards.push(card);
          }
        }
      }
    });

    board.lists = Array.from(listsMap.values());
    res.json(board);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
exports.deleteBoard = async (req, res) => {
  const { id } = req.params; // Board ID
  const { id: userId } = req.user; // User ID

  try {
    // Check if the user owns the board before deleting
    const deleteResult = await db.query(
      "DELETE FROM boards WHERE id = $1 AND owner_id = $2 RETURNING id",
      [id, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(403).json({ msg: 'Board not found or access denied' });
    }

    res.json({ msg: 'Board deleted' });
    console.log("✅ Board deleted successfully");
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateListOrder = async (req, res) => {
  const { id: boardId } = req.params; // Get boardId from URL
  const { listIds } = req.body; // Get the array of list IDs
  const { id: userId } = req.user;

  if (!listIds || !Array.isArray(listIds)) {
    return res.status(400).json({ msg: 'Invalid data' });
  }

  const client = await db.pool.connect(); // Use transaction

  try {
    // 1. Check if user owns this board
    const boardCheck = await client.query(
      "SELECT id FROM boards WHERE id = $1 AND owner_id = $2",
      [boardId, userId]
    );

    if (boardCheck.rows.length === 0) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // 2. Start transaction
    await client.query('BEGIN');

    // 3. Loop through the listIds and update the position for each
    for (let i = 0; i < listIds.length; i++) {
      const listId = listIds[i];
      const newPosition = i;

      await client.query(
        "UPDATE lists SET position = $1 WHERE id = $2 AND board_id = $3",
        [newPosition, listId, boardId]
      );
    }

    // 4. Commit transaction
    await client.query('COMMIT');

    res.json({ msg: 'List order updated' });

  } catch (err) {
    await client.query('ROLLBACK'); // Roll back on error
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release(); // Release client back to pool
  }
};
exports.inviteUser = async (req, res) => {
  const { id: boardId } = req.params;
  const { email } = req.body;
  const { id: ownerId } = req.user;

  try {
    // 1. Check if the logged-in user is the *owner* (only owners can invite)
    const board = await db.query(
      "SELECT id FROM boards WHERE id = $1 AND owner_id = $2",
      [boardId, ownerId]
    );
    if (board.rows.length === 0) {
      return res.status(403).json({ msg: 'Only the board owner can invite users.' });
    }

    // 2. Find the user to invite by their email
    const userToInvite = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userToInvite.rows.length === 0) {
      return res.status(404).json({ msg: 'User with that email not found.' });
    }
    const inviteeId = userToInvite.rows[0].id;

    // 3. Add the user to the board_members table
    await db.query(
      "INSERT INTO board_members (user_id, board_id) VALUES ($1, $2)",
      [inviteeId, boardId]
    );

    res.status(201).json({ msg: 'User added to board.' });
  } catch (err) {
    // Handle "user already in board" error
    if (err.code === '23505') {
      return res.status(400).json({ msg: 'User is already a member of this board.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};