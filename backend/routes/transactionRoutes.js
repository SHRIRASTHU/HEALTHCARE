const express = require('express');
const router = express.Router();
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const Transaction = require('../models/Transaction');
const { verifyToken, authorize } = require('../middleware/auth');

// Get user transaction history
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const transactions = store.transactions.filter(t => t.userId.toString() === userId || t.userName === req.user.name);
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json({ success: true, count: transactions.length, transactions });
    } else {
      const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });
      return res.json({ success: true, count: transactions.length, transactions });
    }
  } catch (err) {
    next(err);
  }
});

// Admin get all transactions
router.get('/all', verifyToken, authorize('admin'), async (req, res, next) => {
  try {
    if (getIsInMemoryMode()) {
      const transactions = [...getMemoryStore().transactions];
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json({ success: true, count: transactions.length, transactions });
    } else {
      const transactions = await Transaction.find().sort({ date: -1 });
      return res.json({ success: true, count: transactions.length, transactions });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
