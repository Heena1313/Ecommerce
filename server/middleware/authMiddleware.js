const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce_secret_key_123';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Check if account is suspended
    const db = require('../db');
    db.get('SELECT status FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error during auth check.' });
      }
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists.' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account has been suspended. Please contact admin.' });
      }
      req.user.status = user.status;
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
  JWT_SECRET
};
