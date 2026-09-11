const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

// Create Appointment
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { doctorId, date, time, appointmentType = 'video', notes } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ success: false, message: 'Please specify doctor, date, and time slot' });
    }

    const meetingId = `meet-${appointmentType}-${Math.random().toString(36).substring(2, 9)}`;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const doctor = store.doctors.find(d => d._id.toString() === doctorId || d.id === doctorId);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Selected doctor not found' });
      }

      // Check double booking
      const existingConflict = store.appointments.find(a => 
        a.doctorId.toString() === doctorId && 
        a.date === date && 
        a.time === time && 
        a.status !== 'cancelled'
      );

      if (existingConflict) {
        return res.status(400).json({ 
          success: false, 
          message: 'This time slot is already booked for this doctor. Please choose a different date or time.' 
        });
      }

      const newAppointment = {
        _id: new mongoose.Types.ObjectId(),
        userId: req.user._id,
        userName: req.user.name,
        doctorId: doctor._id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorPhoto: doctor.photo,
        date,
        time,
        appointmentType,
        status: 'confirmed',
        paymentStatus: 'paid',
        meetingId,
        notes: notes || '',
        createdAt: new Date()
      };

      store.appointments.push(newAppointment);

      // Create Notification for user
      store.notifications.push({
        _id: new mongoose.Types.ObjectId(),
        userId: req.user._id.toString(),
        title: 'Appointment Booked! 📅',
        message: `Your ${appointmentType} consultation with ${doctor.name} on ${date} at ${time} is confirmed.`,
        type: 'appointment',
        read: false,
        createdAt: new Date()
      });

      return res.status(201).json({ success: true, appointment: newAppointment, message: 'Appointment booked successfully!' });
    } else {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Selected doctor not found' });
      }

      // Prevent double booking
      const conflict = await Appointment.findOne({
        doctorId,
        date,
        time,
        status: { $ne: 'cancelled' }
      });

      if (conflict) {
        return res.status(400).json({ 
          success: false, 
          message: 'This time slot is already booked for this doctor. Please choose another slot.' 
        });
      }

      const appointment = await Appointment.create({
        userId: req.user._id,
        userName: req.user.name,
        doctorId: doctor._id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorPhoto: doctor.photo,
        date,
        time,
        appointmentType,
        status: 'confirmed',
        paymentStatus: 'paid',
        meetingId,
        notes: notes || ''
      });

      await Notification.create({
        userId: req.user._id,
        title: 'Appointment Booked! 📅',
        message: `Your ${appointmentType} consultation with ${doctor.name} on ${date} at ${time} is confirmed.`,
        type: 'appointment'
      });

      return res.status(201).json({ success: true, appointment, message: 'Appointment booked successfully!' });
    }
  } catch (err) {
    next(err);
  }
});

// Get user or doctor appointments
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const { status } = req.query;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      let list = [];

      if (req.user.role === 'doctor') {
        const doctorRecord = store.doctors.find(d => d.name === req.user.name || (d.userId && d.userId.toString() === req.user._id.toString()));
        const docId = doctorRecord ? doctorRecord._id.toString() : '';
        list = store.appointments.filter(a => a.doctorId.toString() === docId || a.doctorName === req.user.name);
      } else {
        list = store.appointments.filter(a => a.userId.toString() === req.user._id.toString() || a.userName === req.user.name);
      }

      if (status && status !== 'all') {
        list = list.filter(a => a.status === status);
      }

      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.json({ success: true, count: list.length, appointments: list });
    } else {
      let query = {};
      if (req.user.role === 'doctor') {
        const doctorRecord = await Doctor.findOne({ userId: req.user._id });
        query.doctorId = doctorRecord ? doctorRecord._id : req.user._id;
      } else {
        query.userId = req.user._id;
      }

      if (status && status !== 'all') {
        query.status = status;
      }

      const appointments = await Appointment.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: appointments.length, appointments });
    }
  } catch (err) {
    next(err);
  }
});

// Cancel or update appointment status
router.put('/:id/status', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed', 'completed', 'cancelled'

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const appt = store.appointments.find(a => a._id.toString() === id || a.id === id);
      if (!appt) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      appt.status = status;

      return res.json({ success: true, appointment: appt, message: `Appointment status updated to ${status}` });
    } else {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      appointment.status = status;
      await appointment.save();

      return res.json({ success: true, appointment, message: `Appointment status updated to ${status}` });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
