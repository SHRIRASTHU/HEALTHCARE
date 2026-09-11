const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const { processAIChat } = require('../services/aiService');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const AIConversation = require('../models/AIConversation');

// POST /api/ai/chat
router.post('/chat', verifyToken, async (req, res, next) => {
  try {
    const { question, history } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question cannot be empty' });
    }

    const aiResult = await processAIChat(question.trim(), history || []);

    // Store in DB / Memory Store
    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      store.aiConversations.push({
        _id: new mongoose.Types.ObjectId(),
        userId,
        userQuestion: question,
        aiResponse: aiResult.response,
        isEmergency: aiResult.isEmergency,
        timestamp: new Date()
      });
    } else {
      await AIConversation.create({
        userId: req.user._id,
        userQuestion: question,
        aiResponse: aiResult.response,
        isEmergency: aiResult.isEmergency
      });
    }

    return res.json({
      success: true,
      userQuestion: question,
      aiResponse: aiResult.response,
      isEmergency: aiResult.isEmergency
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
