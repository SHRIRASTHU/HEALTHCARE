const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userQuestion: { type: String, required: true },
  aiResponse: { type: String, required: true },
  isEmergency: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIConversation', aiConversationSchema);
