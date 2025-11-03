// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// === MIDDLEWARE ===
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow server to accept JSON in request body

// === ROUTES ===
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/labels', require('./routes/labels'));

// Test route
app.get('/', (req, res) => {
  res.send('Trello Clone API is up and running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));