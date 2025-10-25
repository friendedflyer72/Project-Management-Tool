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
exports.getBoardById = async (req, res) => {
  const { id } = req.params; // Board ID from URL
  const { id: userId } = req.user; // User ID from auth token

  try {
    // This query joins boards, lists, and cards.
    // We use LEFT JOIN in case a board has no lists, or a list has no cards.
    const query = `
SELECT
        b.id AS board_id, b.name AS board_name,
        l.id AS list_id, l.name AS list_name, l.position AS list_position,
        c.id AS card_id, c.title AS card_title, 
        c.description AS card_description,  -- ADD THIS
        c.created_at AS card_created_at,  -- ADD THIS
        c.position AS card_position
      FROM boards b
      LEFT JOIN lists l ON b.id = l.board_id
      LEFT JOIN cards c ON l.id = c.list_id
      WHERE b.id = $1 AND b.owner_id = $2
      ORDER BY l.position, c.position;
    `;

    const { rows } = await db.query(query, [id, userId]);

    if (rows.length === 0) {
      // This could mean the board doesn't exist OR the user doesn't own it
      return res.status(404).json({ msg: 'Board not found or access denied' });
    }

    // --- Hydration Logic ---
    // The query returns a flat array. We need to "hydrate" it into a nested object.
    const board = {
      id: rows[0].board_id,
      name: rows[0].board_name,
      lists: [],
    };

    // Use a Map to keep track of lists and avoid duplicates
    const listsMap = new Map();

    rows.forEach(row => {
      // If the list doesn't exist yet, create it
      if (row.list_id && !listsMap.has(row.list_id)) {
        listsMap.set(row.list_id, {
          id: row.list_id,
          name: row.list_name,
          position: row.list_position,
          cards: [],
        });
      }

      // If there's a card in this row, add it to its list
      if (row.card_id) {
        const list = listsMap.get(row.list_id);
        if (list) { // Ensure list exists before pushing card
          list.cards.push({
            id: row.card_id,
            title: row.card_title,
            description: row.card_description,
            createdAt: row.card_created_at,
            position: row.card_position,
          });
        }
      }
    });

    // Add the lists from the Map to the board object
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