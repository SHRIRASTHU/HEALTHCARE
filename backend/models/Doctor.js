const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  photo: { type: String, default: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400' },
  qualification: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  hospital: { type: String, required: true },
  location: { type: String, required: true },
  consultationFee: { type: Number, required: true },
  about: { type: String, default: 'Experienced healthcare specialist committed to compassionate patient care.' },
  availableDays: [{ type: String }],
  availableTime: { type: String, default: '09:00 AM - 05:00 PM' },
  rating: { type: Number, default: 4.8 },
  totalReviews: { type: Number, default: 124 },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  isOnline: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);
