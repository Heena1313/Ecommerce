const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize database
require('./config/mongo');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));

// Fallback to index.html for SPA-like navigation, with 404 for missing API endpoints
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ message: 'API endpoint not found.' });
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
