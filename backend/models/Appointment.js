const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  doctorName: { type: String, required: true },
  doctorSpecialization: { type: String, default: 'General Physician' },
  doctorPhoto: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  appointmentType: { type: String, enum: ['chat', 'audio', 'video'], default: 'video' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'confirmed' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'refunded'], default: 'paid' },
  meetingId: { type: String, required: true },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
