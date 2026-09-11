const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  profileImage: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' },
  dob: { type: String, default: '' },
  gender: { type: String, default: 'Prefer not to say' },
  address: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  role: { type: String, enum: ['user', 'doctor', 'admin'], default: 'user' },
  subscriptionStatus: { type: String, enum: ['none', 'active', 'expired'], default: 'none' },
  subscriptionType: { type: String, enum: ['none', 'weekly', 'monthly', 'yearly'], default: 'none' },
  subscriptionExpiry: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
