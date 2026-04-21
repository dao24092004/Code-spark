// file: common-node-library/middleware/verifyToken.js
const jwt = require('jsonwebtoken');
const AppException = require('../exception/AppException');

const verifyToken = (secretKey) => {
  return (req, res, next) => {
    // Hỗ trợ cả 'authorization' và 'Authorization'
    const authHeader = req.headers.authorization || req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppException("Truy cập bị từ chối: Không tìm thấy Token hợp lệ", 401));
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, secretKey);
      
      // ĐỒNG BỘ HÓA: Mọi service dùng thư viện này đều sẽ có req.user với cấu trúc này
      req.user = {
          userId: decoded.userId || decoded.id,
          username: decoded.sub || decoded.username,
          email: decoded.email,
          roles: decoded.roles || [],
          permissions: decoded.permissions || []
      };
      
      next();
    } catch (error) {
      return next(new AppException("Truy cập bị từ chối: Token không hợp lệ hoặc đã hết hạn", 403));
    }
  };
};

module.exports = verifyToken;