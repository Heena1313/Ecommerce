const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Customer Checkout (Customer only)
router.post('/', authMiddleware, requireRole(['customer']), async (req, res) => {
  const { shipping_address, payment_method, items } = req.body;

  if (!shipping_address || !payment_method || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Shipping address, payment method, and product items are required.' });
  }

  try {
    // We will verify and process each item
    const verifiedItems = [];
    let totalPrice = 0;

    for (const item of items) {
      const product = await db.getAsync('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      verifiedItems.push({
        product,
        quantity: item.quantity,
        price: product.price
      });

      totalPrice += product.price * item.quantity;
    }

    // Process order in serialized transaction-like sequence
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(
        'INSERT INTO orders (customer_id, total_price, status, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, totalPrice, 'pending', shipping_address, payment_method],
        function(orderErr) {
          if (orderErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Failed to create order: ' + orderErr.message });
          }

          const orderId = this.lastID;
          let itemsProcessed = 0;
          let executionError = null;

          for (const item of verifiedItems) {
            // Decrement Stock
            db.run(
              'UPDATE products SET stock = stock - ? WHERE id = ?',
              [item.quantity, item.product.id],
              (stockErr) => {
                if (stockErr && !executionError) {
                  executionError = stockErr;
                }
              }
            );

            // Insert Order Item
            db.run(
              'INSERT INTO order_items (order_id, product_id, price, quantity) VALUES (?, ?, ?, ?)',
              [orderId, item.product.id, item.price, item.quantity],
              (itemErr) => {
                if (itemErr && !executionError) {
                  executionError = itemErr;
                }

                itemsProcessed++;
                if (itemsProcessed === verifiedItems.length) {
                  if (executionError) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Failed to insert order items: ' + executionError.message });
                  } else {
                    db.run('COMMIT');
                    return res.status(201).json({
                      message: 'Order placed successfully.',
                      orderId,
                      totalPrice
                    });
                  }
                }
              }
            );
          }
        }
      );
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get customer's order history (Customer only)
router.get('/customer', authMiddleware, requireRole(['customer']), async (req, res) => {
  try {
    const orders = await db.allAsync(
      'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Get order items for each order
    for (let order of orders) {
      order.items = await db.allAsync(`
        SELECT oi.*, p.name as product_name, p.image_url, s.name as store_name
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE oi.order_id = ?
      `, [order.id]);
    }

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get vendor's incoming orders (Vendor only)
router.get('/vendor', authMiddleware, requireRole(['vendor']), async (req, res) => {
  try {
    // Find all items ordered from this vendor's store
    const store = await db.getAsync('SELECT id FROM stores WHERE vendor_id = ?', [req.user.id]);
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    const items = await db.allAsync(`
      SELECT 
        oi.id as order_item_id,
        oi.price,
        oi.quantity,
        o.id as order_id,
        o.status as order_status,
        o.created_at,
        o.shipping_address,
        p.name as product_name,
        p.image_url,
        u.name as customer_name,
        u.email as customer_email
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON o.customer_id = u.id
      WHERE p.store_id = ?
      ORDER BY o.created_at DESC
    `, [store.id]);

    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update order status (Vendor only, updates status of parent order)
// Note: In simple multi-vendor setup, changing order status changes the overall order status.
router.put('/:id/status', authMiddleware, requireRole(['vendor']), async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  try {
    // Ensure vendor actually has items in this order
    const store = await db.getAsync('SELECT id FROM stores WHERE vendor_id = ?', [req.user.id]);
    if (!store) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    const itemCheck = await db.getAsync(`
      SELECT oi.id 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ? AND p.store_id = ?
    `, [orderId, store.id]);

    if (!itemCheck) {
      return res.status(403).json({ message: 'Access denied. You cannot modify orders that do not contain your products.' });
    }

    db.run(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to update order status: ' + err.message });
        }
        return res.json({ message: `Order status updated to '${status}'.` });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;
