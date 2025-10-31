const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('[AUTH] ❌ No token provided.');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  console.log('[AUTH] 🔑 Received token:', token.substring(0, 10) + '...');
  console.log('[AUTH] 🧩 Using secret:', config.security.jwt.secret ? '✅ Loaded' : '❌ Missing');

  jwt.verify(token, config.security.jwt.secret, (err, user) => {
    if (err) {
      console.error('[AUTH] ❌ JWT verification failed!');
      console.error('│ Error type:', err.name);
      console.error('│ Error message:', err.message);
      console.error('│ Secret loaded:', !!config.security.jwt.secret);
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }

    console.log('[AUTH] ✅ Token verified successfully.');
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
    console.log(`[AUTH] ✅ Permission granted: ${permission}`);
    next();
  };
};

module.exports = {
  authenticateToken,
  checkPermission,
};
