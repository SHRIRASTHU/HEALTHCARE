const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const config = require('./config/config');
const { connectDB } = require('./config/db');
const { seedData } = require('./services/seedService');
const socketHandler = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');

// Express App setup
const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root redirect to landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Fallback for HTML pages
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
    return;
  }
  res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

// Central Error Handler
app.use(errorHandler);

// Initialize Sockets
socketHandler(io);

// Start Server
const PORT = config.port;

const startServer = async () => {
  await connectDB();
  await seedData();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 HEALTHCARE Server Running on http://localhost:${PORT}`);
    console.log(`🏥 Mode: ${config.env.toUpperCase()}`);
    console.log(`=======================================================`);
  });
};

startServer();
