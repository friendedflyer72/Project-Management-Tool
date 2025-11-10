// server/socket.js
const { Server } = require('socket.io');

let io; // This will hold the server instance

module.exports = {
  // This function initializes the socket server
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:5173", // Your React client
        methods: ["GET", "POST", "PUT", "DELETE"]
      }
    });

    // All your connection logic lives here now
    io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      socket.on('joinBoard', (boardId) => {
        socket.join(boardId.toString());
        console.log(`User ${socket.id} joined room: ${boardId}`);
      });

      socket.on('leaveBoard', (boardId) => {
        socket.leave(boardId.toString());
        console.log(`User ${socket.id} left room: ${boardId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔥 User disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  // This function lets your controllers get the io instance
  getIO: () => {
    if (!io) {
      throw new Error("Socket.IO not initialized!");
    }
    return io;
  }
};