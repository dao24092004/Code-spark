const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const { ApiError } = require('./error');
const config = require('../config');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Access denied. No token provided.'
    ));
  }

  try {
    const decoded = jwt.verify(token, config.security.jwt.secret);
    
    // Attach user to request object
    req.user = {
      id: decoded.userId || decoded.sub,
      email: decoded.email,
      roles: Array.isArray(decoded.roles) ? decoded.roles : [],
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : []
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Token has expired',
        true
      ));
    }
    
    return next(new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Invalid token',
      true
    ));
  }
};

/**
 * Middleware to check user roles
 * @param {string[]} roles - Array of allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Authentication required'
      ));
    }

    if (roles.length && !roles.some(role => req.user.roles.includes(role))) {
      return next(new ApiError(
        StatusCodes.FORBIDDEN,
        `Required role: ${roles.join(' or ')}`
      ));
    }

    next();
  };
};

/**
 * Middleware to check user permissions
 * @param {string[]} permissions - Array of required permissions
 * @param {string} checkType - 'all' (default) requires all permissions, 'any' requires at least one
 */
const checkPermission = (permissions, checkType = 'all') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Authentication required'
      ));
    }

    // Admin has all permissions
    if (req.user.roles.includes('ADMIN')) {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    let hasPermission;
    if (checkType === 'any') {
      hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
    } else {
      hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
    }

    if (!hasPermission) {
      return next(new ApiError(
        StatusCodes.FORBIDDEN,
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      ));
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  checkPermission
};
