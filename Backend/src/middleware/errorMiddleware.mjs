import logger from '../util/logger.mjs';

export class APIError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// List of trusted error status codes that don't need detailed logging
const TRUSTED_ERROR_CODES = [
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  409, // Conflict
];

// Central error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  
  // Log error details
  if (!TRUSTED_ERROR_CODES.includes(err.statusCode)) {
    logger.error(`Unhandled error: ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Determine if we should expose error details
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Standard error response format
  const errorResponse = {
    success: false,
    error: {
      message: isProduction && err.statusCode === 500 
        ? 'Internal server error' 
        : err.message,
      code: err.statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details
      })
    }
  };

  // Send response
  res.status(err.statusCode).json(errorResponse);
};

// Express async handler to catch promise rejections
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};