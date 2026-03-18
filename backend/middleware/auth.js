const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const profile = await Profile.findById(decoded.id);
    if (!profile) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = profile;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(error);
  }
};

// Optional auth — doesn't fail if no token, just sets req.user to null
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await Profile.findById(decoded.id);
    }
  } catch (e) {
    // Silently ignore - optional auth
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
