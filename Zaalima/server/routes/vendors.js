// routes/vendors.js
const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Store = require('../models/Store');

// GET /api/vendors - list all vendors with their store details
router.get('/', async (req, res) => {
  try {
    // Find users with role 'vendor'
    const vendors = await User.find({ role: 'vendor' }).lean();
    // Populate each vendor's store and its products grouped by category
    const result = await Promise.all(
      vendors.map(async (vendor) => {
        const store = await Store.findOne({ vendor: vendor._id }).lean();
        // Fetch products for this store and group by category
        let productsByCategory = {};
        if (store) {
          const products = await require('../models/Product').find({ store: store._id }).lean();
          productsByCategory = products.reduce((acc, p) => {
            const cat = p.category || 'Uncategorized';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push({
              _id: p._id,
              name: p.name,
              price: p.price,
              stock: p.stock,
              images: p.images,
            });
            return acc;
          }, {});
        }
        return {
          _id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          store: store ? { _id: store._id, name: store.name, description: store.description, bannerUrl: store.bannerUrl } : null,
          products: productsByCategory,
        };
      })
    );
    res.json(result);
  } catch (err) {
    console.error('Vendor fetch error:', err);
    res.status(500).json({ message: 'Server error while fetching vendors' });
  }
});

module.exports = router;
