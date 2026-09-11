const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  subscription: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
  amount: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'UPI / Card / NetBanking' },
  paymentStatus: { type: String, enum: ['successful', 'pending', 'failed', 'refunded'], default: 'successful' },
  transactionRef: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
