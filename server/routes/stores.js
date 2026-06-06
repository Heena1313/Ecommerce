const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Get current vendor's store details
router.get('/my-store', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    const store = await db.getAsync('SELECT * FROM stores WHERE vendor_id = ?', [req.user.id]);
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }
    return res.json(store);
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update current vendor's store details
router.put('/my-store', authMiddleware, requireRole(['vendor']), async (req, res) => {
  const { name, description, banner_url } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Store name is required.' });
  }

  // Check if vendor's account is pending approval
  if (req.user.status === 'pending_approval') {
    return res.status(403).json({ message: 'Cannot modify store. Your account is pending admin approval.' });
  }

  try {
    // Check if another store already uses this name
    const existingStore = await db.getAsync('SELECT * FROM stores WHERE name = ? AND vendor_id != ?', [name, req.user.id]);
    if (existingStore) {
      return res.status(400).json({ message: 'Store name is already taken.' });
    }

    db.run(
      'UPDATE stores SET name = ?, description = ?, banner_url = ? WHERE vendor_id = ?',
      [name, description, banner_url, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to update store: ' + err.message });
        }
        return res.json({
          message: 'Store updated successfully.',
          store: { vendor_id: req.user.id, name, description, banner_url }
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get a specific store by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const store = await db.getAsync('SELECT * FROM stores WHERE id = ?', [req.params.id]);
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    // Get products for this store
    const products = await db.allAsync('SELECT * FROM products WHERE store_id = ?', [store.id]);
    
    // Get vendor info
    const vendor = await db.getAsync('SELECT name, email, status FROM users WHERE id = ?', [store.vendor_id]);

    return res.json({ store, products, vendor });
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;
