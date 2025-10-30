const db = require('../db');

// This helper checks if a user has access to a specific board
const checkBoardAccess = async (userId, boardId) => {
  const query = `
    (SELECT id FROM boards WHERE id = $1 AND owner_id = $2)
    UNION
    (SELECT board_id FROM board_members WHERE board_id = $1 AND user_id = $2)
  `;
  const { rows } = await db.query(query, [boardId, userId]);
  return rows.length > 0; // Returns true if user has access, false otherwise
};

module.exports = { checkBoardAccess };