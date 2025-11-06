const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware để xác thực JWT token từ identity-service
 * Token phải được gửi trong header: Authorization: Bearer <token>
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Lấy token sau "Bearer "

  if (!token) {
    console.warn('[AUTH] ❌ No token provided.');
    return res.status(401).json({ 
      success: false,
      message: 'Unauthorized: No token provided' 
    });
  }

  console.log('[AUTH] 🔑 Received token:', token.substring(0, 20) + '...');
  
  // JWT secret phải giống với identity-service
  const jwtSecret = config.server.jwtSecret || 'mySecretKey12345678901234567890123456789012345678901234567890';
  
  console.log('[AUTH] 🧩 Secret loaded:', config.server.jwtSecret ? '✅ From config' : '⚠️ Using default');
  console.log('[AUTH] 🔐 Secret length:', jwtSecret.length);
  console.log('[AUTH] 🔐 Secret preview:', jwtSecret.substring(0, 20) + '...');

  // Thử decode token không verify để xem thông tin
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (decoded) {
      console.log('[AUTH] 📋 Token header:', JSON.stringify(decoded.header, null, 2));
      console.log('[AUTH] 📋 Token payload (decoded):', JSON.stringify(decoded.payload, null, 2));
    }
  } catch (decodeErr) {
    console.warn('[AUTH] ⚠️ Could not decode token:', decodeErr.message);
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('[AUTH] ❌ JWT verification failed!');
      console.error('│ Error type:', err.name);
      console.error('│ Error message:', err.message);
      console.error('│ Secret loaded:', !!config.server.jwtSecret);
      console.error('│ Secret from config:', config.server.jwtSecret ? 'YES' : 'NO (using default)');
      console.error('│ Secret value:', jwtSecret.substring(0, 20) + '...');
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized: Token has expired' 
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          success: false,
          message: `Forbidden: Invalid token - ${err.message}` 
        });
      }
      
      return res.status(403).json({ 
        success: false,
        message: `Forbidden: Invalid token - ${err.name}: ${err.message}` 
      });
    }

    console.log('[AUTH] ✅ Token verified successfully.');
    console.log('[AUTH] 👤 User:', user.username || user.sub);
    console.log('[AUTH] 🎭 Roles:', user.roles || []);
    console.log('[AUTH] 🔐 Permissions:', user.permissions || []);
    
    // Lưu thông tin user vào request để sử dụng trong controller
    req.user = user;
    req.userId = user.userId || user.sub || user.id;
    req.username = user.username || user.sub;
    req.roles = user.roles || [];
    req.permissions = user.permissions || [];
    
    next();
  });
};

/**
 * Middleware để kiểm tra quyền (permission)
 * @param {string|string[]} requiredPermission - Permission hoặc mảng permissions cần có
 */
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: User not authenticated' 
      });
    }

    const userPermissions = req.permissions || [];
    const requiredPermissions = Array.isArray(requiredPermission) 
      ? requiredPermission 
      : [requiredPermission];

    const hasPermission = requiredPermissions.some(perm => 
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      console.warn(`[AUTH] ⚠️ Permission denied. Required: ${requiredPermissions.join(' or ')}`);
      console.warn('[AUTH] User permissions:', userPermissions);
      return res.status(403).json({ 
        success: false,
        message: `Forbidden: Requires ${requiredPermissions.join(' or ')} permission` 
      });
    }

    console.log(`[AUTH] ✅ Permission granted: ${requiredPermissions.join(' or ')}`);
    next();
  };
};

/**
 * Middleware để kiểm tra role
 * @param {string|string[]} requiredRole - Role hoặc mảng roles cần có
 */
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: User not authenticated' 
      });
    }

    const userRoles = req.roles || [];
    const requiredRoles = Array.isArray(requiredRole) 
      ? requiredRole 
      : [requiredRole];

    const hasRole = requiredRoles.some(role => 
      userRoles.includes(role)
    );

    if (!hasRole) {
      console.warn(`[AUTH] ⚠️ Role denied. Required: ${requiredRoles.join(' or ')}`);
      console.warn('[AUTH] User roles:', userRoles);
      return res.status(403).json({ 
        success: false,
        message: `Forbidden: Requires ${requiredRoles.join(' or ')} role` 
      });
    }

    console.log(`[AUTH] ✅ Role granted: ${requiredRoles.join(' or ')}`);
    next();
  };
};

/**
 * Middleware tùy chọn - không bắt buộc token
 * Nếu có token thì verify, nếu không có thì vẫn cho qua
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Không có token, vẫn cho qua nhưng không set req.user
    return next();
  }

  const jwtSecret = config.server.jwtSecret || 'mySecretKey12345678901234567890123456789012345678901234567890';

  jwt.verify(token, jwtSecret, (err, user) => {
    if (!err && user) {
      req.user = user;
      req.userId = user.userId || user.sub || user.id;
      req.username = user.username || user.sub;
      req.roles = user.roles || [];
      req.permissions = user.permissions || [];
    }
    // Dù verify thành công hay thất bại, vẫn cho qua
    next();
  });
};

module.exports = {
  authenticateToken,
  checkPermission,
  checkRole,
  optionalAuth,
};

