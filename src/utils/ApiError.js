/**
 * Operational error carrying an HTTP status code.
 * Anything thrown that is not an ApiError is treated as a 500 by the
 * central error handler.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
