const express = require('express');
const router = express.Router();
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// Get user notifications
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const list = store.notifications.filter(n => n.userId.toString() === userId || n.userId === 'all');
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const unreadCount = list.filter(n => !n.read).length;
      return res.json({ success: true, count: list.length, unreadCount, notifications: list });
    } else {
      const notifications = await Notification.find({ 
        $or: [{ userId: req.user._id }, { userId: 'all' }] 
      }).sort({ createdAt: -1 });

      const unreadCount = notifications.filter(n => !n.read).length;
      return res.json({ success: true, count: notifications.length, unreadCount, notifications });
    }
  } catch (err) {
    next(err);
  }
});

// Mark all as read
router.put('/read-all', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      store.notifications.forEach(n => {
        if (n.userId.toString() === userId) n.read = true;
      });
      return res.json({ success: true, message: 'All notifications marked as read' });
    } else {
      await Notification.updateMany(
        { userId: req.user._id, read: false },
        { $set: { read: true } }
      );
      return res.json({ success: true, message: 'All notifications marked as read' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
