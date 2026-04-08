const ApiResponse = require('../dto/ApiResponse');
const AppException = require('./AppException');

function globalExceptionHandler(err, req, res, next) {
  if (err instanceof AppException) {
    return res.status(err.status).json(ApiResponse.error(err.message));
  }

  console.error("Lỗi hệ thống:", err);
  return res.status(500).json(
    ApiResponse.error("Lỗi máy chủ nội bộ", err.message)
  );
}
module.exports = globalExceptionHandler;