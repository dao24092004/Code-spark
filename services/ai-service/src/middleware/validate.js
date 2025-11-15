const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const { ApiError } = require('./error');

/**
 * Middleware to validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }
  
  // Format errors for response
  const formattedErrors = errors.array().map(error => ({
    param: error.param,
    message: error.msg,
    location: error.location,
    value: error.value
  }));
  
  throw new ApiError(
    StatusCodes.BAD_REQUEST,
    'Validation failed',
    true,
    { errors: formattedErrors }
  );
};

module.exports = {
  validate
};
