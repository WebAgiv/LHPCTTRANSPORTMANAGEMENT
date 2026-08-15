'use strict';
const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

/** Verify JWT access token */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, message: msg });
  }
}

/** Role-based access guard factory */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied: user ${req.user.username} (${req.user.role}) tried ${req.method} ${req.originalUrl}`);
      return res.status(403).json({ success: false, message: `Access denied. Required: ${roles.join(' or ')}` });
    }
    next();
  };
}

// Role groups
const ADMIN_ROLES     = ['superadmin', 'principal', 'director'];
const TRANSPORT_ROLES = ['superadmin', 'transport', 'principal', 'director'];
const FINANCE_ROLES   = ['superadmin', 'finance', 'accountant', 'principal'];
const STAFF_ROLES     = ['superadmin', 'transport', 'finance', 'accountant', 'principal', 'director', 'security', 'driver'];

module.exports = { authenticate, authorize, ADMIN_ROLES, TRANSPORT_ROLES, FINANCE_ROLES, STAFF_ROLES };
