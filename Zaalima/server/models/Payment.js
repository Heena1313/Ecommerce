const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  paypalPaymentId: { type: String, required: true },
  payerId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['created', 'approved', 'failed'], default: 'created' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
