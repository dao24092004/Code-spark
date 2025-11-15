const jwt = require('jsonwebtoken');
const config = require('../config/config');

const isDebugEnabled = process.env.LOG_LEVEL === 'debug';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('[AUTH] ❌ No token provided.');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  if (!config.security.jwt.secret) {
    console.error('[AUTH] ❌ JWT secret is missing.');
    return res.status(500).json({ message: 'Authentication misconfigured.' });
  }

  if (isDebugEnabled) {
    console.debug('[AUTH] 🔑 Received token prefix:', token.substring(0, 10));
  }

  jwt.verify(token, config.security.jwt.secret, (err, user) => {
    if (err) {
      console.error('[AUTH] ❌ JWT verification failed!');
      console.error('│ Error type:', err.name);
      console.error('│ Error message:', err.message);
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }

    req.user = user;
    next();
  });
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions || !req.user.permissions.includes(permission)) {
      console.warn(`[AUTH] ⚠️ Permission denied. Required: ${permission}`);
      console.warn('[AUTH] User permissions:', req.user?.permissions);
      return res.status(403).json({ message: `Forbidden: Requires ${permission} permission` });
    }
    if (isDebugEnabled) {
      console.debug(`[AUTH] ✅ Permission granted: ${permission}`);
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  checkPermission,
};
