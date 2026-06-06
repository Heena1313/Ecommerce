const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String },
  banner_url: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Store', storeSchema);
