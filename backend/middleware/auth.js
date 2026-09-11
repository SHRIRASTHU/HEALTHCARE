const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { getIsInMemoryMode, getMemoryStore } = require('../config/db');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    if (getIsInMemoryMode()) {
      const user = getMemoryStore().users.find(u => u._id.toString() === decoded.id || u.id === decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found or token invalid' });
      }
      req.user = user;
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User session expired or not found' });
      }
      req.user = user;
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token', error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Role '${req.user.role}' is not authorized for this route.` 
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorize };
