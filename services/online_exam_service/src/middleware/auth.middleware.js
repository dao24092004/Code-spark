// file: src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');

// JWT secret key - MUST match với identity-service
// Trong production, nên lấy từ config service hoặc environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'mySecretKey12345678901234567890123456789012345678901234567890';

/**
 * Middleware để verify JWT token và extract userId
 * Sau khi verify thành công, userId sẽ được gắn vào req.userId
 */
function authenticateToken(req, res, next) {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Token hợp lệ - extract userId
      // Identity service đặt userId trong claim 'userId'
      req.userId = decoded.userId || decoded.sub || decoded.id;
      req.username = decoded.sub; // 'sub' chứa username
      
      // Log để debug
      console.log(`✅ Authenticated user: ${req.username} (ID: ${req.userId})`);
      
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
}

/**
 * Middleware tùy chọn - không bắt buộc phải có token
 * Nếu có token hợp lệ thì extract userId, không thì bỏ qua
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Không có token - cho phép tiếp tục nhưng không có userId
      req.userId = null;
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Token invalid - cho phép tiếp tục nhưng không có userId
        req.userId = null;
      } else {
        // Token hợp lệ - extract userId
        req.userId = decoded.userId || decoded.sub || decoded.id;
        req.username = decoded.sub;
      }
      next();
    });
  } catch (error) {
    // Có lỗi - cho phép tiếp tục nhưng không có userId
    req.userId = null;
    next();
  }
}

module.exports = {
  authenticateToken,
  optionalAuth
};

