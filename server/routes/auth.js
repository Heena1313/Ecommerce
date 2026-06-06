const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/authMiddleware');

// Register Router
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (role !== 'customer' && role !== 'vendor') {
    return res.status(400).json({ message: 'Invalid role selection.' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Vendors start as pending_approval
    const status = role === 'vendor' ? 'pending_approval' : 'active';

    // Insert user
    db.run(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, status],
      async function(err) {
        if (err) {
          return res.status(500).json({ message: 'Registration failed: ' + err.message });
        }

        const userId = this.lastID;

        // If vendor, create a default unique store
        if (role === 'vendor') {
          // Generate a store name and make sure it is unique
          let storeName = `${name}'s Marketplace`;
          
          // Double check if store name is unique, append ID if needed
          const existingStore = await db.getAsync('SELECT * FROM stores WHERE name = ?', [storeName]);
          if (existingStore) {
            storeName = `${name}'s Marketplace #${userId}`;
          }

          db.run(
            'INSERT INTO stores (vendor_id, name, description, banner_url) VALUES (?, ?, ?, ?)',
            [
              userId,
              storeName,
              'Welcome to my store! Please browse our high quality products.',
              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800' // beautiful store banner placeholder
            ],
            (storeErr) => {
              if (storeErr) {
                console.error('Store creation failed:', storeErr.message);
                return res.status(500).json({ message: 'User registered, but store creation failed: ' + storeErr.message });
              }

              // Create JWT token for vendor
              const token = jwt.sign({ id: userId, email, role, name }, JWT_SECRET, { expiresIn: '24h' });
              return res.status(201).json({
                message: 'Vendor registered successfully. Account is pending admin approval.',
                token,
                user: { id: userId, name, email, role, status }
              });
            }
          );
        } else {
          // Customer registration
          const token = jwt.sign({ id: userId, email, role, name }, JWT_SECRET, { expiresIn: '24h' });
          return res.status(201).json({
            message: 'Customer registered successfully.',
            token,
            user: { id: userId, name, email, role, status }
          });
        }
      }
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Login Router
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended by the admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // If login is successful, get store info for vendor
    let storeInfo = null;
    if (user.role === 'vendor') {
      storeInfo = await db.getAsync('SELECT * FROM stores WHERE vendor_id = ?', [user.id]);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      store: storeInfo
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get Current User Profile Router
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.getAsync('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let storeInfo = null;
    if (user.role === 'vendor') {
      storeInfo = await db.getAsync('SELECT * FROM stores WHERE vendor_id = ?', [user.id]);
    }

    return res.json({
      user,
      store: storeInfo
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;
