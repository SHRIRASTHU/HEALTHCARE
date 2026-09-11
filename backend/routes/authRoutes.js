const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('../config/config');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { verifyToken } = require('../middleware/auth');

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone, role = 'user', specialization, qualification, experience, hospital } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const existing = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const newUser = {
        _id: new mongoose.Types.ObjectId(),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || '',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        role,
        subscriptionStatus: 'none',
        subscriptionType: 'none',
        subscriptionExpiry: null,
        isActive: true,
        createdAt: new Date()
      };
      store.users.push(newUser);

      if (role === 'doctor') {
        store.doctors.push({
          _id: new mongoose.Types.ObjectId(),
          userId: newUser._id,
          name: `Dr. ${name}`,
          photo: newUser.profileImage,
          qualification: qualification || 'MBBS',
          specialization: specialization || 'General Physician',
          experience: Number(experience) || 5,
          hospital: hospital || 'City Care Health',
          location: 'Bangalore, India',
          consultationFee: 500,
          about: 'Dedicated healthcare specialist providing comprehensive telemedicine care.',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          availableTime: '09:00 AM - 05:00 PM',
          rating: 5.0,
          totalReviews: 1,
          verificationStatus: 'approved',
          isOnline: true,
          createdAt: new Date()
        });
      }

      const token = jwt.sign({ id: newUser._id.toString(), role: newUser.role }, config.jwtSecret, { expiresIn: '7d' });
      return res.status(201).json({
        success: true,
        token,
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, subscriptionStatus: newUser.subscriptionStatus }
      });
    } else {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || '',
        role
      });

      if (role === 'doctor') {
        await Doctor.create({
          userId: newUser._id,
          name: `Dr. ${name}`,
          photo: newUser.profileImage,
          qualification: qualification || 'MBBS',
          specialization: specialization || 'General Physician',
          experience: Number(experience) || 5,
          hospital: hospital || 'City Care Health',
          location: 'Bangalore, India',
          consultationFee: 500,
          about: 'Dedicated healthcare specialist providing comprehensive telemedicine care.'
        });
      }

      const token = jwt.sign({ id: newUser._id.toString(), role: newUser.role }, config.jwtSecret, { expiresIn: '7d' });
      return res.status(201).json({
        success: true,
        token,
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, subscriptionStatus: newUser.subscriptionStatus }
      });
    }
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id.toString(), role: user.role }, config.jwtSecret, { expiresIn: '7d' });
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionType: user.subscriptionType,
          subscriptionExpiry: user.subscriptionExpiry
        }
      });
    } else {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id.toString(), role: user.role }, config.jwtSecret, { expiresIn: '7d' });
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionType: user.subscriptionType,
          subscriptionExpiry: user.subscriptionExpiry
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

// Get Current User Profile
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    return res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
});

// Update Profile
router.put('/profile', verifyToken, async (req, res, next) => {
  try {
    const { name, phone, dob, gender, address, emergencyContact, profileImage } = req.body;

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      const user = store.users.find(u => u._id.toString() === req.user._id.toString());
      if (user) {
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (dob) user.dob = dob;
        if (gender) user.gender = gender;
        if (address) user.address = address;
        if (emergencyContact) user.emergencyContact = emergencyContact;
        if (profileImage) user.profileImage = profileImage;
      }
      return res.json({ success: true, user, message: 'Profile updated successfully' });
    } else {
      const user = await User.findById(req.user._id);
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (dob) user.dob = dob;
      if (gender) user.gender = gender;
      if (address) user.address = address;
      if (emergencyContact) user.emergencyContact = emergencyContact;
      if (profileImage) user.profileImage = profileImage;
      await user.save();

      return res.json({ success: true, user, message: 'Profile updated successfully' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
