// scripts/seedData.js
// Run with: node scripts/seedData.js
// Requires @faker-js/faker and the Mongoose models.

require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Import models (relative to this script location)
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Review = require('../models/Review');

// Connect to MongoDB (uses same config as server)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zaalimadb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once('open', async () => {
  console.log('✅ Connected to MongoDB – seeding data');

  try {
    // Clean existing data (optional)
    await Promise.all([
      User.deleteMany({ role: 'vendor' }),
      Store.deleteMany({}),
      Product.deleteMany({}),
      Review.deleteMany({}),
    ]);

    const vendorCount = 5; // number of random vendors
    const productsPerVendor = 8; // initial products per vendor
    const vendors = [];

    // 1️⃣ Create random vendors and their stores
    for (let i = 0; i < vendorCount; i++) {
      const vendor = new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(), // will be hashed by pre‑save hook if any
        role: 'vendor',
      });
      await vendor.save();

      const store = new Store({
        vendor: vendor._id,
        name: `${faker.company.name()} Store`,
        description: faker.lorem.sentence(),
        bannerUrl: faker.image.url({ width: 800, height: 200 }),
      });
      await store.save();

      vendors.push({ vendor, store });
    }

    // 2️⃣ Create products for each store
    const allProducts = [];
    for (const { store } of vendors) {
      for (let p = 0; p < productsPerVendor; p++) {
        const product = new Product({
          store: store._id,
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: parseFloat(faker.commerce.price({ min: 5, max: 200 })),
          stock: faker.number.int({ min: 10, max: 100 }),
          views: faker.number.int({ min: 0, max: 500 }),
          imageUrl: faker.image.url({ width: 400, height: 400 }),
          category: faker.commerce.department(),
        });
        await product.save();
        allProducts.push(product);
      }
    }

    // 3️⃣ Create random reviews for each product
    for (const product of allProducts) {
      const reviewCount = faker.number.int({ min: 2, max: 8 });
      for (let r = 0; r < reviewCount; r++) {
        // Ensure a customer exists
        let customer = await User.findOne({ role: { $ne: 'vendor' } });
        if (!customer) {
          customer = await new User({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            role: 'customer',
          }).save();
        }
        const review = new Review({
          product: product._id,
          user: customer._id,
          rating: faker.number.int({ min: 1, max: 5 }),
          comment: faker.lorem.sentences({ count: { min: 1, max: 3 } }),
        });
        await review.save();
      }
    }

    console.log('✅ Seeding complete –', vendorCount, 'vendors,', allProducts.length, 'products, reviews generated.');

    // 4️⃣ Real‑time generator: add a new product every 30 seconds for a random vendor
    setInterval(async () => {
      const randomVendor = faker.helpers.arrayElement(vendors);
      const newProduct = new Product({
        store: randomVendor.store._id,
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 5, max: 200 })),
        stock: faker.number.int({ min: 10, max: 100 }),
        views: 0,
        imageUrl: faker.image.url({ width: 400, height: 400 }),
        category: faker.commerce.department(),
      });
      await newProduct.save();

      // Add a few random reviews immediately
      const revCount = faker.number.int({ min: 1, max: 4 });
      for (let i = 0; i < revCount; i++) {
        let reviewer = await User.findOne({ role: { $ne: 'vendor' } });
        if (!reviewer) {
          reviewer = await new User({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            role: 'customer',
          }).save();
        }
        const rev = new Review({
          product: newProduct._id,
          user: reviewer._id,
          rating: faker.number.int({ min: 1, max: 5 }),
          comment: faker.lorem.sentences({ count: { min: 1, max: 2 } }),
        });
        await rev.save();
      }

      console.log(`🆕 New product "${newProduct.name}" added for vendor "${randomVendor.vendor.name}" with ${revCount} initial reviews`);
    }, 30 * 1000); // every 30 seconds

  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
});
