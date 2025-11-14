// server/utils/logActivity.js
const db = require('../db');

/**
 * Logs an activity to the database.
 * @param {number} boardId - The ID of the board.
 * @param {number} userId - The ID of the user who performed the action.
 * @param {string} description - The human-readable log message.
 * @param {number|null} [cardId] - (Optional) The ID of the card related to the action.
 */
const logActivity = (boardId, userId, description, cardId = null) => {
  const query = `
    INSERT INTO activity_logs (board_id, user_id, description, card_id)
    VALUES ($1, $2, $3, $4)
  `;
  // We don't 'await' this. Let it run in the background.
  db.query(query, [boardId, userId, description, cardId])
    .catch(err => console.error("Failed to log activity:", err));
};

module.exports = { logActivity };