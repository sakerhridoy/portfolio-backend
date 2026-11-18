/**
 * Wraps an async express route handler so rejected promises are forwarded
 * to the central error middleware instead of hanging the request.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
