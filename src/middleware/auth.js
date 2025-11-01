const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let userId;
    let token;

    // Prefer Authorization header when present
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
      userId = decoded._id;
    } else if (req.session && req.session.user && req.session.user.id) {
      userId = req.session.user.id;
    }

    if (!userId) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      if (req.session && req.session.user) {
        delete req.session.user;
      }
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;

    // Refresh session data so role changes are picked up
    if (req.session) {
      req.session.user = {
        id: user._id.toString(),
        role: user.role
      };
    }

    next();
  } catch (error) {
    if (req.session && req.session.user) {
      delete req.session.user;
    }
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Admin middleware - shorthand for authorize('admin')
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      message: 'Access denied. Admin role required.'
    });
  }
};

// Optional auth - doesn't require auth but adds user if token exists
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
      req.user = await User.findById(decoded._id).select('-password');
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

module.exports = { protect, authorize, admin, optionalAuth };
