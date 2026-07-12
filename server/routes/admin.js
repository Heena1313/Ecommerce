const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

//Get all vendors list (Admin only)
router.get('/vendors', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const vendors = await db.allAsync(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.status, 
        u.created_at,
        s.name as store_name,
        s.id as store_id,
        (SELECT COUNT(*) FROM products WHERE store_id = s.id) as product_count
      FROM users u
      LEFT JOIN stores s ON u.id = s.vendor_id
      WHERE u.role = 'vendor'
      ORDER BY u.created_at DESC
    `);
    return res.json(vendors);
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get all customers list (Admin only)
router.get('/customers', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const customers = await db.allAsync(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.created_at,
        (SELECT COUNT(*) FROM orders WHERE customer_id = u.id) as order_count,
        (SELECT IFNULL(SUM(total_price), 0) FROM orders WHERE customer_id = u.id) as total_spent
      FROM users u
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC
    `);
    return res.json(customers);
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update vendor status - e.g., Approve or Suspend (Admin only)
router.put('/vendors/:id/status', authMiddleware, requireRole(['admin']), async (req, res) => {
  const { status } = req.body;
  const vendorId = req.params.id;

  if (!status) {
    return res.status(400).json({ message: 'Status is required.' });
  }

  const validStatuses = ['active', 'suspended', 'pending_approval'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be active, suspended, or pending_approval.' });
  }

  try {
    // Make sure user exists and is a vendor
    const user = await db.getAsync('SELECT role FROM users WHERE id = ?', [vendorId]);
    if (!user) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }
    if (user.role !== 'vendor') {
      return res.status(400).json({ message: 'User is not a vendor.' });
    }

    db.run(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, vendorId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Failed to update vendor status: ' + err.message });
        }
        return res.json({ message: `Vendor status updated to '${status}' successfully.` });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;
