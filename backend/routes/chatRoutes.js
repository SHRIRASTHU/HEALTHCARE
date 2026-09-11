const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const Message = require('../models/Message');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Get active conversations list for current user/doctor
router.get('/conversations', verifyToken, async (req, res, next) => {
  try {
    const currentId = req.user._id ? req.user._id.toString() : req.user.id;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      let contacts = [];

      if (req.user.role === 'doctor') {
        // Find doctor record
        const docRecord = store.doctors.find(d => d.name === req.user.name || (d.userId && d.userId.toString() === currentId));
        const docId = docRecord ? docRecord._id.toString() : currentId;

        // Find all patients who messaged this doctor
        const patientIds = [...new Set(store.messages
          .filter(m => m.receiverId === docId || m.senderId === docId)
          .map(m => m.senderId === docId ? m.receiverId : m.senderId))];

        contacts = patientIds.map(pId => {
          const patientUser = store.users.find(u => u._id.toString() === pId || u.id === pId) || { name: 'Patient', profileImage: '' };
          const conversationId = `${pId}_${docId}`;
          const lastMsg = store.messages.filter(m => m.conversationId === conversationId).pop() || null;
          return {
            id: pId,
            name: patientUser.name,
            photo: patientUser.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
            conversationId,
            lastMessage: lastMsg ? lastMsg.message : 'Tap to start conversation',
            lastTimestamp: lastMsg ? lastMsg.timestamp : new Date(),
            isOnline: true
          };
        });
      } else {
        // Patient user: return all doctors
        contacts = store.doctors.map(doc => {
          const conversationId = `${currentId}_${doc._id.toString()}`;
          const lastMsg = store.messages.filter(m => m.conversationId === conversationId).pop() || null;
          return {
            id: doc._id.toString(),
            name: doc.name,
            photo: doc.photo,
            specialization: doc.specialization,
            conversationId,
            lastMessage: lastMsg ? lastMsg.message : 'Tap to start conversation',
            lastTimestamp: lastMsg ? lastMsg.timestamp : new Date(),
            isOnline: doc.isOnline
          };
        });
      }

      return res.json({ success: true, count: contacts.length, conversations: contacts });
    } else {
      const doctors = await Doctor.find({ verificationStatus: 'approved' });
      const contacts = doctors.map(doc => {
        const conversationId = `${currentId}_${doc._id.toString()}`;
        return {
          id: doc._id.toString(),
          name: doc.name,
          photo: doc.photo,
          specialization: doc.specialization,
          conversationId,
          isOnline: doc.isOnline
        };
      });

      return res.json({ success: true, count: contacts.length, conversations: contacts });
    }
  } catch (err) {
    next(err);
  }
});

// Get messages for a specific conversation
router.get('/messages/:conversationId', verifyToken, async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const messages = store.messages.filter(m => m.conversationId === conversationId);
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return res.json({ success: true, count: messages.length, messages });
    } else {
      const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });
      return res.json({ success: true, count: messages.length, messages });
    }
  } catch (err) {
    next(err);
  }
});

// Send Message via HTTP API
router.post('/send', verifyToken, async (req, res, next) => {
  try {
    const { receiverId, message, conversationId, messageType = 'text', attachmentUrl } = req.body;
    const senderId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!receiverId || !message) {
      return res.status(400).json({ success: false, message: 'Receiver and message content required' });
    }

    const convId = conversationId || `${senderId}_${receiverId}`;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const newMsg = {
        _id: new mongoose.Types.ObjectId(),
        conversationId: convId,
        senderId,
        senderName: req.user.name,
        senderRole: req.user.role,
        receiverId,
        message,
        messageType,
        attachmentUrl: attachmentUrl || '',
        read: false,
        timestamp: new Date()
      };
      store.messages.push(newMsg);
      return res.status(201).json({ success: true, message: newMsg });
    } else {
      const newMsg = await Message.create({
        conversationId: convId,
        senderId,
        senderName: req.user.name,
        senderRole: req.user.role,
        receiverId,
        message,
        messageType,
        attachmentUrl: attachmentUrl || '',
        read: false
      });
      return res.status(201).json({ success: true, message: newMsg });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
