const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { optionalVerifyToken } = require('../middleware/auth');
const { processAIChat } = require('../services/aiService');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const AIConversation = require('../models/AIConversation');

const handleAIChat = async (req, res, next) => {
  try {
    const question = req.body.question || req.body.message || req.body.prompt;
    const history = req.body.history || [];
    const userId = req.user ? (req.user._id ? req.user._id.toString() : req.user.id) : null;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question or message content cannot be empty' });
    }

    const aiResult = await processAIChat(question.trim(), history);

    // Store in DB / Memory Store if user is logged in
    if (userId) {
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
    }

    return res.json({
      success: true,
      userQuestion: question,
      aiResponse: aiResult.response,
      message: aiResult.response,
      response: aiResult.response,
      isEmergency: aiResult.isEmergency
    });
  } catch (err) {
    next(err);
  }
};

// Route handlers for POST /api/ai/chat and POST /api/ai
router.post('/chat', optionalVerifyToken, handleAIChat);
router.post('/', optionalVerifyToken, handleAIChat);

module.exports = router;
