const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'vendor', 'admin'], required: true },
  status: { type: String, enum: ['active', 'suspended', 'pending_approval'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
