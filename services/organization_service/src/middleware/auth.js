const jwt = require('jsonwebtoken');
const config = require('../config'); // Import từ config/index.js

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('[AUTH] ❌ No token provided.');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, config.security.jwt.secret, (err, user) => {
    if (err) {
      console.error('[AUTH] ❌ JWT verification failed!', err.message);
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }

    // console.log('[AUTH] ✅ Token verified successfully.'); // Ghi chú: có thể tắt dòng này
    req.user = user;
    next();
  });
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions || !req.user.permissions.includes(permission)) {
      console.warn(`[AUTH] ⚠️ Permission denied. Required: ${permission}`);
      return res.status(403).json({ message: `Forbidden: Requires ${permission} permission` });
    }
    // console.log(`[AUTH] ✅ Permission granted: ${permission}`); // Ghi chú: có thể tắt dòng này
    next();
  };
};

module.exports = {
  authenticateToken,
  checkPermission,
};