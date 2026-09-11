const express = require('express');
const router = express.Router();
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Transaction = require('../models/Transaction');
const { verifyToken, authorize } = require('../middleware/auth');

// Get overall platform stats for Admin Dashboard
router.get('/stats', verifyToken, authorize('admin'), async (req, res, next) => {
  try {
    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const totalUsers = store.users.filter(u => u.role === 'user').length;
      const totalDoctors = store.doctors.length;
      const activeSubscriptions = store.users.filter(u => u.subscriptionStatus === 'active').length;
      const totalAppointments = store.appointments.length;
      const totalRevenue = store.transactions
        .filter(t => t.paymentStatus === 'successful')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      return res.json({
        success: true,
        stats: {
          totalUsers,
          totalDoctors,
          activeSubscriptions,
          totalAppointments,
          totalRevenue,
          successfulTransactions: store.transactions.filter(t => t.paymentStatus === 'successful').length
        }
      });
    } else {
      const totalUsers = await User.countDocuments({ role: 'user' });
      const totalDoctors = await Doctor.countDocuments();
      const activeSubscriptions = await User.countDocuments({ subscriptionStatus: 'active' });
      const totalAppointments = await Appointment.countDocuments();
      const transactions = await Transaction.find({ paymentStatus: 'successful' });
      const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

      return res.json({
        success: true,
        stats: {
          totalUsers,
          totalDoctors,
          activeSubscriptions,
          totalAppointments,
          totalRevenue,
          successfulTransactions: transactions.length
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

// Admin view all users
router.get('/users', verifyToken, authorize('admin'), async (req, res, next) => {
  try {
    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const users = store.users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionType: u.subscriptionType,
        isActive: u.isActive,
        createdAt: u.createdAt
      }));
      return res.json({ success: true, count: users.length, users });
    } else {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return res.json({ success: true, count: users.length, users });
    }
  } catch (err) {
    next(err);
  }
});

// Admin toggle user account status (Activate/Deactivate)
router.put('/users/:id/toggle', verifyToken, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const user = store.users.find(u => u._id.toString() === id || u.id === id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.isActive = !user.isActive;
      return res.json({ success: true, user, message: `User status changed to ${user.isActive ? 'Active' : 'Deactivated'}` });
    } else {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.isActive = !user.isActive;
      await user.save();
      return res.json({ success: true, user, message: `User status changed to ${user.isActive ? 'Active' : 'Deactivated'}` });
    }
  } catch (err) {
    next(err);
  }
});

// Admin view all doctors
router.get('/doctors', verifyToken, authorize('admin'), async (req, res, next) => {
  try {
    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      return res.json({ success: true, count: store.doctors.length, doctors: store.doctors });
    } else {
      const doctors = await Doctor.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: doctors.length, doctors });
    }
  } catch (err) {
    next(err);
  }
});

// Admin approve or reject doctor verification status
router.put('/doctors/:id/status', verifyToken, authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body; // 'approved' or 'rejected'

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const doctor = store.doctors.find(d => d._id.toString() === id || d.id === id);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor record not found' });
      }
      doctor.verificationStatus = verificationStatus;
      return res.json({ success: true, doctor, message: `Doctor verification updated to ${verificationStatus}` });
    } else {
      const doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor record not found' });
      }
      doctor.verificationStatus = verificationStatus;
      await doctor.save();
      return res.json({ success: true, doctor, message: `Doctor verification updated to ${verificationStatus}` });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
