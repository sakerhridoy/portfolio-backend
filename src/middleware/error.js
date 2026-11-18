import config from '../config/env.js';
import ApiError from '../utils/ApiError.js';

/**
 * 404 handler for unmatched routes.
 */
export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Normalises mongoose / JWT errors into clean JSON
 * and hides internal details (stack) in production.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for '${err.path}': ${err.value}`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    message = fields.length
      ? `Duplicate value for field(s): ${fields.join(', ')}`
      : 'Duplicate key error';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized, token invalid';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, token expired';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large (maximum 5MB)'
        : `Upload error: ${err.message}`;
  }

  if (statusCode >= 500 && !config.isProd && !config.isTest) {
    console.error(err.stack || err);
  }

  res.status(statusCode).json({ success: false, message });
}
