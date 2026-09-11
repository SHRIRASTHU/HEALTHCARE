const config = require('../config/config');
const mongoose = require('mongoose');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const PLANS = {
  weekly: { name: 'Weekly Plan', price: 199, durationDays: 7 },
  monthly: { name: 'Monthly Plan', price: 499, durationDays: 30 },
  yearly: { name: 'Yearly Plan', price: 3999, durationDays: 365 }
};

const createOrder = async (subscriptionType) => {
  const plan = PLANS[subscriptionType];
  if (!plan) {
    throw new Error('Invalid subscription plan selected');
  }

  const orderId = `ORD-HEALTH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const tax = Math.round(plan.price * 0.18 * 100) / 100;
  const totalAmount = plan.price + tax;

  return {
    orderId,
    subscriptionType,
    planName: plan.name,
    basePrice: plan.price,
    tax,
    totalAmount,
    currency: 'INR',
    keyId: config.paymentKeyId
  };
};

const verifyAndProcessPayment = async ({ userId, subscriptionType, paymentMethod = 'UPI / Razorpay' }) => {
  const plan = PLANS[subscriptionType];
  if (!plan) {
    throw new Error('Invalid subscription plan');
  }

  const transactionId = `TXN-HEALTH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const transactionRef = `pay_${Math.random().toString(36).substring(2, 12)}`;
  const invoiceNumber = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const tax = Math.round(plan.price * 0.18 * 100) / 100;
  const expiryDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

  if (getIsInMemoryMode()) {
    const store = getMemoryStore();
    const userIndex = store.users.findIndex(u => u._id.toString() === userId || u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    store.users[userIndex].subscriptionStatus = 'active';
    store.users[userIndex].subscriptionType = subscriptionType;
    store.users[userIndex].subscriptionExpiry = expiryDate;

    const newTx = {
      _id: new mongoose.Types.ObjectId(),
      transactionId,
      userId,
      userName: store.users[userIndex].name,
      subscription: subscriptionType,
      amount: plan.price,
      tax,
      paymentMethod,
      paymentStatus: 'successful',
      transactionRef,
      invoiceNumber,
      date: new Date()
    };
    store.transactions.push(newTx);

    // Create notification
    store.notifications.push({
      _id: new mongoose.Types.ObjectId(),
      userId,
      title: 'Subscription Activated 🎉',
      message: `Your ${plan.name} is now active until ${expiryDate.toLocaleDateString()}.`,
      type: 'subscription',
      read: false,
      createdAt: new Date()
    });

    return {
      success: true,
      transaction: newTx,
      user: store.users[userIndex]
    };
  } else {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.subscriptionStatus = 'active';
    user.subscriptionType = subscriptionType;
    user.subscriptionExpiry = expiryDate;
    await user.save();

    const transaction = await Transaction.create({
      transactionId,
      userId: user._id,
      userName: user.name,
      subscription: subscriptionType,
      amount: plan.price,
      tax,
      paymentMethod,
      paymentStatus: 'successful',
      transactionRef,
      invoiceNumber,
      date: new Date()
    });

    return {
      success: true,
      transaction,
      user
    };
  }
};

module.exports = {
  PLANS,
  createOrder,
  verifyAndProcessPayment
};
