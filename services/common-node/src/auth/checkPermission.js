// file: common-node-library/middleware/checkPermission.js
const AppException = require('../exception/AppException');

const checkPermission = (permission) => {
    return (req, res, next) => {
        // Kiểm tra xem req.user đã tồn tại chưa và có chứa quyền yêu cầu không
        if (!req.user || !req.user.permissions || !req.user.permissions.includes(permission)) {
            return next(new AppException(`Cấm truy cập: Yêu cầu quyền [${permission}]`, 403));
        }
        next();
    };
};

module.exports = checkPermission;