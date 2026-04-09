// Tự động bắt lỗi cho các hàm bất đồng bộ (async/await)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
module.exports = asyncHandler;