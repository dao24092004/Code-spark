const jwt = require('jsonwebtoken');
const AppException = require('../exception/AppException');

// Middleware kiểm tra token
const verifyToken = (secretKey) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppException("Truy cập bị từ chối: Không tìm thấy Token hợp lệ", 401));
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, secretKey);
      req.user = decoded; // Gắn thông tin người dùng vào request để các API sau sử dụng
      next();
    } catch (error) {
      next(new AppException("Truy cập bị từ chối: Token không hợp lệ hoặc đã hết hạn", 401));
    }
  };
};

module.exports = verifyToken;