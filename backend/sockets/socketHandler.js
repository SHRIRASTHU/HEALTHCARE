const mongoose = require('mongoose');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const Message = require('../models/Message');

const socketHandler = (io) => {
  // Store connected user socket IDs: userId -> socketId
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Register user in online map
    socket.on('user-connected', (userId) => {
      if (userId) {
        onlineUsers.set(userId.toString(), socket.id);
        socket.userId = userId.toString();
        io.emit('user-status-change', { userId: userId.toString(), isOnline: true });
        console.log(`User ${userId} associated with socket ${socket.id}`);
      }
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined room ${conversationId}`);
    });

    // Real-time Chat Messaging
    socket.on('send-message', async (data) => {
      const { conversationId, senderId, senderName, senderRole, receiverId, message, messageType, attachmentUrl } = data;

      const newMsg = {
        _id: new mongoose.Types.ObjectId(),
        conversationId,
        senderId,
        senderName: senderName || 'User',
        senderRole: senderRole || 'user',
        receiverId,
        message,
        messageType: messageType || 'text',
        attachmentUrl: attachmentUrl || '',
        read: false,
        timestamp: new Date()
      };

      // Save message
      if (getIsInMemoryMode()) {
        getMemoryStore().messages.push(newMsg);
      } else {
        try {
          await Message.create(newMsg);
        } catch (e) {
          console.error('Socket message save error:', e.message);
        }
      }

      // Emit to conversation room
      io.to(conversationId).emit('receive-message', newMsg);

      // Notify recipient socket if online outside room
      const recipientSocketId = onlineUsers.get(receiverId.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('new-message-notification', newMsg);
      }
    });

    // Typing Indicators
    socket.on('typing', ({ conversationId, userName }) => {
      socket.to(conversationId).emit('user-typing', { conversationId, userName });
    });

    socket.on('stop-typing', ({ conversationId }) => {
      socket.to(conversationId).emit('user-stop-typing', { conversationId });
    });

    // =====================================
    // WebRTC Zoom-Style Call Signaling
    // =====================================
    socket.on('join-call-room', ({ roomId, userId, userName }) => {
      socket.join(roomId);
      console.log(`User ${userName} (${userId}) joined Call Room: ${roomId}`);
      socket.to(roomId).emit('user-joined-call', { socketId: socket.id, userId, userName });
    });

    socket.on('send-offer', ({ roomId, offer, targetSocketId }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('receive-offer', { offer, senderSocketId: socket.id });
      } else {
        socket.to(roomId).emit('receive-offer', { offer, senderSocketId: socket.id });
      }
    });

    socket.on('send-answer', ({ roomId, answer, targetSocketId }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('receive-answer', { answer, senderSocketId: socket.id });
      } else {
        socket.to(roomId).emit('receive-answer', { answer, senderSocketId: socket.id });
      }
    });

    socket.on('ice-candidate', ({ roomId, candidate, targetSocketId }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('ice-candidate', { candidate, senderSocketId: socket.id });
      } else {
        socket.to(roomId).emit('ice-candidate', { candidate, senderSocketId: socket.id });
      }
    });

    socket.on('end-call', ({ roomId }) => {
      io.to(roomId).emit('call-ended');
      socket.leave(roomId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user-status-change', { userId: socket.userId, isOnline: false });
      }
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
