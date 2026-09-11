const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Transaction = require('../models/Transaction');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password123!', salt);

    const initialUsers = [
      {
        _id: new mongoose.Types.ObjectId('660000000000000000000001'),
        name: 'Sarah Jenkins',
        email: 'patient@healthcare.com',
        password: defaultPassword,
        phone: '+91 9876543210',
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
        dob: '1994-06-15',
        gender: 'Female',
        address: '742 Evergreen Terrace, Tech Park, Bangalore',
        emergencyContact: '+91 9876500000',
        role: 'user',
        subscriptionStatus: 'active',
        subscriptionType: 'monthly',
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('660000000000000000000002'),
        name: 'Dr. Rajesh Sharma',
        email: 'doctor@healthcare.com',
        password: defaultPassword,
        phone: '+91 9876543211',
        profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        dob: '1982-03-20',
        gender: 'Male',
        address: 'Fortis Hospital Medical Hub, Mumbai',
        emergencyContact: '+91 9876511111',
        role: 'doctor',
        subscriptionStatus: 'none',
        subscriptionType: 'none',
        subscriptionExpiry: null,
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('660000000000000000000003'),
        name: 'System Admin',
        email: 'admin@healthcare.com',
        password: defaultPassword,
        phone: '+91 9876543212',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
        dob: '1985-11-10',
        gender: 'Male',
        address: 'HEALTHCARE Corporate HQ',
        emergencyContact: '+91 9876522222',
        role: 'admin',
        subscriptionStatus: 'none',
        subscriptionType: 'none',
        subscriptionExpiry: null,
        isActive: true,
        createdAt: new Date()
      }
    ];

    const initialDoctors = [
      {
        _id: new mongoose.Types.ObjectId('661000000000000000000001'),
        userId: initialUsers[1]._id,
        name: 'Dr. Rajesh Sharma',
        photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        qualification: 'MD, DM (Cardiology), FACC',
        specialization: 'Cardiology',
        experience: 14,
        hospital: 'Apollo Heart Institute',
        location: 'Mumbai, India',
        consultationFee: 799,
        about: 'Senior Consultant Cardiologist specializing in preventive cardiology, hypertension, and advanced heart health monitoring.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableTime: '09:00 AM - 05:00 PM',
        rating: 4.9,
        totalReviews: 238,
        verificationStatus: 'approved',
        isOnline: true,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('661000000000000000000002'),
        name: 'Dr. Ananya Roy',
        photo: 'https://images.unsplash.com/photo-1594824813566-88855ce7896c?auto=format&fit=crop&q=80&w=400',
        qualification: 'MD (Pediatrics), DCH',
        specialization: 'Pediatrics',
        experience: 10,
        hospital: 'Max Super Specialty Hospital',
        location: 'New Delhi, India',
        consultationFee: 599,
        about: 'Compassionate pediatrician focusing on child growth development, immunizations, and pediatric wellness.',
        availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        availableTime: '10:00 AM - 06:00 PM',
        rating: 4.8,
        totalReviews: 185,
        verificationStatus: 'approved',
        isOnline: true,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('661000000000000000000003'),
        name: 'Dr. Vikramaditya Rao',
        photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
        qualification: 'MD (Dermatology), FRCP',
        specialization: 'Dermatology',
        experience: 12,
        hospital: 'Skin & Laser Cosmetic Clinic',
        location: 'Bangalore, India',
        consultationFee: 650,
        about: 'Board-certified dermatologist specializing in skin disease management, acne treatment, and clinical cosmetology.',
        availableDays: ['Tuesday', 'Thursday', 'Saturday'],
        availableTime: '11:00 AM - 07:00 PM',
        rating: 4.9,
        totalReviews: 312,
        verificationStatus: 'approved',
        isOnline: false,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('661000000000000000000004'),
        name: 'Dr. Meera Nambiar',
        photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
        qualification: 'DM (Neurology), MBBS',
        specialization: 'Neurology',
        experience: 16,
        hospital: 'Manipal Hospital Brain Institute',
        location: 'Hyderabad, India',
        consultationFee: 950,
        about: 'Lead Neurologist specializing in migraine treatment, stroke recovery, and neuromuscular disorder care.',
        availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
        availableTime: '08:30 AM - 03:30 PM',
        rating: 5.0,
        totalReviews: 142,
        verificationStatus: 'approved',
        isOnline: true,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('661000000000000000000005'),
        name: 'Dr. Siddharth Mehta',
        photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
        qualification: 'MS (Orthopedics), M.Ch',
        specialization: 'Orthopedics',
        experience: 15,
        hospital: 'Fortis Bone & Joint Center',
        location: 'Chennai, India',
        consultationFee: 800,
        about: 'Senior orthopedic surgeon specializing in joint replacement, sports injury rehabilitation, and spinal health.',
        availableDays: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
        availableTime: '09:00 AM - 04:00 PM',
        rating: 4.7,
        totalReviews: 98,
        verificationStatus: 'approved',
        isOnline: true,
        createdAt: new Date()
      }
    ];

    const initialAppointments = [
      {
        _id: new mongoose.Types.ObjectId('662000000000000000000001'),
        userId: initialUsers[0]._id,
        userName: 'Sarah Jenkins',
        doctorId: initialDoctors[0]._id,
        doctorName: 'Dr. Rajesh Sharma',
        doctorSpecialization: 'Cardiology',
        doctorPhoto: initialDoctors[0].photo,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:30 AM',
        appointmentType: 'video',
        status: 'confirmed',
        paymentStatus: 'paid',
        meetingId: 'meet-cardio-99812',
        notes: 'Routine heart health consultation & blood pressure review.',
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('662000000000000000000002'),
        userId: initialUsers[0]._id,
        userName: 'Sarah Jenkins',
        doctorId: initialDoctors[1]._id,
        doctorName: 'Dr. Ananya Roy',
        doctorSpecialization: 'Pediatrics',
        doctorPhoto: initialDoctors[1].photo,
        date: '2026-09-02',
        time: '02:00 PM',
        appointmentType: 'chat',
        status: 'completed',
        paymentStatus: 'paid',
        meetingId: 'chat-pedia-11234',
        notes: 'Follow-up regarding dietary guidance.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    const initialTransactions = [
      {
        _id: new mongoose.Types.ObjectId('663000000000000000000001'),
        transactionId: 'TXN-HEALTH-994812',
        userId: initialUsers[0]._id,
        userName: 'Sarah Jenkins',
        subscription: 'monthly',
        amount: 499,
        tax: 89.82,
        paymentMethod: 'UPI / Razorpay',
        paymentStatus: 'successful',
        transactionRef: 'pay_Nzk2349182',
        invoiceNumber: 'INV-2026-001948',
        date: new Date()
      }
    ];

    const initialMessages = [
      {
        _id: new mongoose.Types.ObjectId('664000000000000000000001'),
        conversationId: `${initialUsers[0]._id}_${initialDoctors[0]._id}`,
        senderId: initialUsers[0]._id.toString(),
        senderName: 'Sarah Jenkins',
        senderRole: 'user',
        receiverId: initialDoctors[0]._id.toString(),
        message: 'Hello Dr. Sharma, I have submitted my latest ECG test results.',
        messageType: 'text',
        read: true,
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        _id: new mongoose.Types.ObjectId('664000000000000000000002'),
        conversationId: `${initialUsers[0]._id}_${initialDoctors[0]._id}`,
        senderId: initialDoctors[0]._id.toString(),
        senderName: 'Dr. Rajesh Sharma',
        senderRole: 'doctor',
        receiverId: initialUsers[0]._id.toString(),
        message: 'Thank you Sarah. I reviewed your report. Everything looks stable! We will discuss details in our video call tomorrow.',
        messageType: 'text',
        read: true,
        timestamp: new Date(Date.now() - 1800000)
      }
    ];

    const initialNotifications = [
      {
        _id: new mongoose.Types.ObjectId('665000000000000000000001'),
        userId: initialUsers[0]._id.toString(),
        title: 'Appointment Confirmed',
        message: 'Your video consultation with Dr. Rajesh Sharma is scheduled for tomorrow at 10:30 AM.',
        type: 'appointment',
        read: false,
        link: '/appointments.html',
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('665000000000000000000002'),
        userId: initialUsers[0]._id.toString(),
        title: 'Subscription Active',
        message: 'Your Monthly Care subscription is active until October 12, 2026.',
        type: 'subscription',
        read: true,
        link: '/subscriptions.html',
        createdAt: new Date(Date.now() - 86400000)
      }
    ];

    if (getIsInMemoryMode()) {
      const store = getMemoryStore();
      store.users = [...initialUsers];
      store.doctors = [...initialDoctors];
      store.appointments = [...initialAppointments];
      store.transactions = [...initialTransactions];
      store.messages = [...initialMessages];
      store.notifications = [...initialNotifications];
      console.log('InMemory Data Store populated with realistic demo seed data.');
    } else {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await User.insertMany(initialUsers);
        await Doctor.insertMany(initialDoctors);
        await Appointment.insertMany(initialAppointments);
        await Transaction.insertMany(initialTransactions);
        await Message.insertMany(initialMessages);
        await Notification.insertMany(initialNotifications);
        console.log('MongoDB database seeded with realistic demo healthcare data!');
      }
    }
  } catch (err) {
    console.error('Error seeding demo data:', err);
  }
};

module.exports = { seedData };
