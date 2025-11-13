const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';
  
  // Log the error
  logger.error({
    message: err.message,
    status: statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {},
    request: {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body,
      user: req.user || {}
    }
  });

  // Don't leak error details in production
  const errorResponse = {
    error: {
      code: statusCode,
      message: message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details
      })
    },
    requestId: req.id
  };

  res.status(statusCode).json(errorResponse);
};

const notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    error: {
      code: StatusCodes.NOT_FOUND,
      message: 'Resource not found'
    },
    requestId: req.id
  });
};

module.exports = {
  ApiError,
  errorHandler,
  notFound
};
