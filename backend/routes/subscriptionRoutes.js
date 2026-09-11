const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

// Get available subscription plans
router.get('/plans', (req, res) => {
  return res.json({
    success: true,
    plans: [
      {
        id: 'weekly',
        name: 'Weekly Pass',
        price: 199,
        period: 'week',
        features: [
          'Doctor Instant Chat',
          'Appointment Booking',
          'Basic Consultation Access',
          'Digital Health Records'
        ],
        isPopular: false
      },
      {
        id: 'monthly',
        name: 'Monthly Care',
        price: 499,
        period: 'month',
        features: [
          'Unlimited Doctor Chat',
          'Appointment Booking',
          'Audio Consultation',
          'HD Video Consultation',
          'Digital Health Records',
          'Priority Care Support'
        ],
        isPopular: true
      },
      {
        id: 'yearly',
        name: 'Yearly Family Plan',
        price: 3999,
        period: 'year',
        features: [
          'Unlimited Doctor Communication',
          'Priority Appointment Booking',
          'Audio & HD Video Consultations',
          'Full Family Health Records',
          '24/7 VIP Concierge Support',
          'Best Overall Value (Save 35%)'
        ],
        isPopular: false
      }
    ]
  });
});

// Create subscription order
router.post('/create-order', verifyToken, async (req, res, next) => {
  try {
    const { subscriptionType } = req.body;
    const orderDetails = await paymentService.createOrder(subscriptionType);
    return res.json({ success: true, order: orderDetails });
  } catch (err) {
    next(err);
  }
});

// Verify & process subscription payment
router.post('/process-payment', verifyToken, async (req, res, next) => {
  try {
    const { subscriptionType, paymentMethod } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    const result = await paymentService.verifyAndProcessPayment({
      userId,
      subscriptionType,
      paymentMethod
    });

    return res.json({
      success: true,
      message: 'Subscription payment successful & access unlocked!',
      transaction: result.transaction,
      user: result.user
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
