import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Thin wrapper that runs express-validator chains and returns a single clean
 * 400 response when validation fails.
 *
 * Usage: router.post('/', validate([body('email').isEmail()]), controller)
 */
export function validate(validations = []) {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const message = errors
      .array()
      .map((error) => error.msg)
      .join(', ');

    return next(new ApiError(400, message));
  };
}

export default validate;
