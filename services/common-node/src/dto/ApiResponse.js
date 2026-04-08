class ApiResponse {
  constructor({ success, message, data, error }) {
    this.success = success;
    if (message !== undefined) this.message = message;
    if (data !== undefined) this.data = data;
    if (error !== undefined) this.error = error;
  }

  static success(dataOrMessage, data = null) {
    if (typeof dataOrMessage === 'string') {
      return new ApiResponse({ success: true, message: dataOrMessage, data });
    }
    return new ApiResponse({ success: true, data: dataOrMessage });
  }

  static error(message, error = null) {
    return new ApiResponse({ success: false, message, error });
  }
}

module.exports = ApiResponse;