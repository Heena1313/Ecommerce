const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  imageUrl: { type: String },
  category: { type: String },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
