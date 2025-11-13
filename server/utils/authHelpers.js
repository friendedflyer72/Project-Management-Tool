// server/utils/authHelpers.js
const db = require('../db');

// This helper checks if a user has access to a specific board
const checkBoardAccess = async (userId, boardId) => {
  const query = `
    (SELECT 1 FROM boards WHERE id = $1 AND owner_id = $2)
    UNION
    (SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2)
  `;
  const { rows } = await db.query(query, [boardId, userId]);
  return rows.length > 0;
};

// --- NEW FUNCTION ---
// This helper checks if a user has a specific role on a board
const checkBoardPermission = async (userId, boardId, allowedRoles = ['owner', 'editor']) => {
  // 1. Check if the user is the owner
  const ownerCheck = await db.query(
    "SELECT 1 FROM boards WHERE id = $1 AND owner_id = $2",
    [boardId, userId]
  );
  if (ownerCheck.rows.length > 0 && allowedRoles.includes('owner')) {
    return true;
  }

  // 2. If not the owner, check if they are a member with an allowed role
  const memberCheck = await db.query(
    "SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2 AND role = ANY($3::varchar[])",
    [boardId, userId, allowedRoles]
  );
  
  return memberCheck.rows.length > 0;
};

module.exports = { checkBoardAccess, checkBoardPermission };