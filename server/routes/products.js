const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Get all products (Public - supports search, category, store filter)
router.get('/', async (req, res) => {
  const { search, category, storeId } = req.query;

  let query = `
    SELECT p.*, s.name as store_name 
    FROM products p
    JOIN stores s ON p.store_id = s.id
    JOIN users u ON s.vendor_id = u.id
    WHERE u.status = 'active'
  `;
  const params = [];

  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    query += ' AND p.category = ?';
    params.push(category);
  }

  if (storeId) {
    query += ' AND p.store_id = ?';
    params.push(storeId);
  }

  query += ' ORDER BY p.id DESC';

  try {
    const products = await db.allAsync(query, params);
    
    // Add average ratings to each product
    for (let product of products) {
      const ratingInfo = await db.getAsync(
        'SELECT AVG(rating) as avgRating, COUNT(id) as countReviews FROM reviews WHERE product_id = ?',
        [product.id]
      );
      product.avgRating = ratingInfo.avgRating ? parseFloat(ratingInfo.avgRating.toFixed(1)) : 0;
      product.countReviews = ratingInfo.countReviews || 0;
    }

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get product details + reviews + store info (Public)
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getAsync(`
      SELECT p.*, s.name as store_name, s.vendor_id
      FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Get reviews
    const reviews = await db.allAsync(`
      SELECT r.*, u.name as customer_name
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [product.id]);

    // Calculate avg rating
    const ratingInfo = await db.getAsync(
      'SELECT AVG(rating) as avgRating, COUNT(id) as countReviews FROM reviews WHERE product_id = ?',
      [product.id]
    );

    product.avgRating = ratingInfo.avgRating ? parseFloat(ratingInfo.avgRating.toFixed(1)) : 0;
    product.countReviews = ratingInfo.countReviews || 0;

    return res.json({ product, reviews });
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Add product (Vendor only)
router.post('/', authMiddleware, requireRole(['vendor']), async (req, res) => {
  const { name, description, price, stock, image_url, category } = req.body;

  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ message: 'Name, price, stock, and category are required.' });
  }

  if (req.user.status === 'pending_approval') {
    return res.status(403).json({ message: 'Cannot add product. Your vendor account is pending admin approval.' });
  }

  try {
    const store = await db.getAsync('SELECT id FROM stores WHERE vendor_id = ?', [req.user.id]);
    if (!store) {
      return res.status(404).json({ message: 'Store not found. Please setup store first.' });
    }

    db.run(
      'INSERT INTO products (store_id, name, description, price, stock, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [store.id, name, description, parseFloat(price), parseInt(stock), image_url, category],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to add product: ' + err.message });
        }
        return res.status(201).json({
          message: 'Product added successfully.',
          productId: this.lastID
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update product (Vendor only)
router.put('/:id', authMiddleware, requireRole(['vendor']), async (req, res) => {
  const { name, description, price, stock, image_url, category } = req.body;
  const productId = req.params.id;

  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ message: 'Name, price, stock, and category are required.' });
  }

  try {
    // Make sure store exists and vendor owns the product
    const store = await db.getAsync('SELECT id FROM stores WHERE vendor_id = ?', [req.user.id]);
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    const product = await db.getAsync('SELECT * FROM products WHERE id = ? AND store_id = ?', [productId, store.id]);
    if (!product) {
      return res.status(403).json({ message: 'Access denied or product not found. You can only manage your own products.' });
    }

    db.run(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, category = ? WHERE id = ?',
      [name, description, parseFloat(price), parseInt(stock), image_url, category, productId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to update product: ' + err.message });
        }
        return res.json({ message: 'Product updated successfully.' });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Delete product (Vendor only)
router.delete('/:id', authMiddleware, requireRole(['vendor']), async (req, res) => {
  const productId = req.params.id;

  try {
    // Make sure store exists and vendor owns the product
    const store = await db.getAsync('SELECT id FROM stores WHERE vendor_id = ?', [req.user.id]);
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    const product = await db.getAsync('SELECT * FROM products WHERE id = ? AND store_id = ?', [productId, store.id]);
    if (!product) {
      return res.status(403).json({ message: 'Access denied or product not found. You can only manage your own products.' });
    }

    db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to delete product: ' + err.message });
      }
      return res.json({ message: 'Product deleted successfully.' });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;
