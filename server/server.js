// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { createServer } = require('http');
const socket = require('./socket');

const app = express();
const httpServer = createServer(app);

// 2. Initialize the socket server
socket.init(httpServer); 

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === ROUTES ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/labels', require('./routes/labels'));
app.use('/api/ai', require('./routes/ai'));

// === START SERVER ===
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
