const express = require('express');
const router = express.Router();
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const Doctor = require('../models/Doctor');
const { verifyToken, authorize } = require('../middleware/auth');

// Get doctors with search & multi-filter
router.get('/', async (req, res, next) => {
  try {
    const { search, specialization, location, minRating, maxFee } = req.query;

    if (getIsInMemoryMode()) {
      let doctors = [...getMemoryStore().doctors];

      if (search) {
        const q = search.toLowerCase();
        doctors = doctors.filter(d => 
          d.name.toLowerCase().includes(q) || 
          d.specialization.toLowerCase().includes(q) || 
          d.hospital.toLowerCase().includes(q)
        );
      }

      if (specialization && specialization !== 'All') {
        doctors = doctors.filter(d => d.specialization.toLowerCase() === specialization.toLowerCase());
      }

      if (location) {
        doctors = doctors.filter(d => d.location.toLowerCase().includes(location.toLowerCase()));
      }

      if (minRating) {
        doctors = doctors.filter(d => d.rating >= Number(minRating));
      }

      if (maxFee) {
        doctors = doctors.filter(d => d.consultationFee <= Number(maxFee));
      }

      return res.json({ success: true, count: doctors.length, doctors });
    } else {
      let query = { verificationStatus: 'approved' };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { specialization: { $regex: search, $options: 'i' } },
          { hospital: { $regex: search, $options: 'i' } }
        ];
      }

      if (specialization && specialization !== 'All') {
        query.specialization = specialization;
      }

      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }

      if (minRating) {
        query.rating = { $gte: Number(minRating) };
      }

      if (maxFee) {
        query.consultationFee = { $lte: Number(maxFee) };
      }

      const doctors = await Doctor.find(query).sort({ rating: -1 });
      return res.json({ success: true, count: doctors.length, doctors });
    }
  } catch (err) {
    next(err);
  }
});

// Get single doctor profile by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getIsInMemoryMode()) {
      const doctor = getMemoryStore().doctors.find(d => d._id.toString() === id || d.id === id);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      }
      return res.json({ success: true, doctor });
    } else {
      const doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      }
      return res.json({ success: true, doctor });
    }
  } catch (err) {
    next(err);
  }
});

// Doctor updates own availability / profile (Doctor Role Only)
router.put('/my/availability', verifyToken, authorize('doctor'), async (req, res, next) => {
  try {
    const { isOnline, availableDays, availableTime, consultationFee } = req.body;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const doctorIndex = store.doctors.findIndex(d => 
        (d.userId && d.userId.toString() === req.user._id.toString()) || d.name === req.user.name
      );

      if (doctorIndex === -1) {
        return res.status(404).json({ success: false, message: 'Doctor profile record not found' });
      }

      if (typeof isOnline !== 'undefined') store.doctors[doctorIndex].isOnline = isOnline;
      if (availableDays) store.doctors[doctorIndex].availableDays = availableDays;
      if (availableTime) store.doctors[doctorIndex].availableTime = availableTime;
      if (consultationFee) store.doctors[doctorIndex].consultationFee = Number(consultationFee);

      return res.json({ success: true, doctor: store.doctors[doctorIndex], message: 'Availability updated successfully' });
    } else {
      let doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor profile record not found' });
      }

      if (typeof isOnline !== 'undefined') doctor.isOnline = isOnline;
      if (availableDays) doctor.availableDays = availableDays;
      if (availableTime) doctor.availableTime = availableTime;
      if (consultationFee) doctor.consultationFee = Number(consultationFee);
      await doctor.save();

      return res.json({ success: true, doctor, message: 'Availability updated successfully' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
