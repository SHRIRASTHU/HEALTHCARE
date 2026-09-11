const mongoose = require('mongoose');
const config = require('./config');

let isInMemoryMode = false;

// Global In-Memory collections for seamless fallback
const memoryStore = {
  users: [],
  doctors: [],
  appointments: [],
  transactions: [],
  messages: [],
  notifications: [],
  aiConversations: []
};

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoURI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log('MongoDB Connected successfully to:', config.mongoURI);
    isInMemoryMode = false;
  } catch (err) {
    console.warn('MongoDB connection failed/unavailable:', err.message);
    console.warn('⚡ FALLBACK MODE: Running with High-Performance Hybrid In-Memory Data Store!');
    isInMemoryMode = true;
  }
};

const getMemoryStore = () => memoryStore;
const getIsInMemoryMode = () => isInMemoryMode;

module.exports = {
  connectDB,
  getMemoryStore,
  getIsInMemoryMode
};
