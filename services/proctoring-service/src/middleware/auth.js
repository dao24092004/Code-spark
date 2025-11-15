const jwt = require('jsonwebtoken');
const config = require('../config/');

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

const normalizePermission = (permission = '') =>
  permission
    .toString()
    .trim()
    .toLowerCase();

const checkPermission = (permission) => {
  return (req, res, next) => {
    const user = req.user || {};
    const roles = Array.isArray(user.roles) ? user.roles : [];
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];

    const normalizedRequired = normalizePermission(permission);
    const hasExplicitPermission = permissions.some(
      (perm) => normalizePermission(perm) === normalizedRequired
    );

    const hasAdminRole = roles.some(
      (role) => role === 'ADMIN' || role === 'ROLE_ADMIN'
    );

    if (!hasExplicitPermission && !hasAdminRole) {
      console.warn(`[AUTH] ⚠️ Permission denied. Required: ${permission}`);
      console.warn('[AUTH] User roles:', roles);
      console.warn('[AUTH] User permissions:', permissions);
      return res
        .status(403)
        .json({ message: `Forbidden: Requires ${permission} permission` });
    }

    console.log(`[AUTH] ✅ Permission granted: ${permission}`);
    next();
  };
};

module.exports = {
  authenticateToken,
  checkPermission,
};
