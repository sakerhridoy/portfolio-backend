import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from './user.controller.js';
import { protect } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// Public: Get profile and projects by username, slug, or ID
// Endpoint: /api/users/profile/:username
router.get('/profile/:username', userController.getProfileByUsername);

// Route alias: /api/users/:username
router.get('/:username', userController.getProfileByUsername);

// Authenticated: Update own profile
router.patch(
  '/profile',
  protect,
  validate([
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('profession').optional().isString().withMessage('Profession must be a string'),
    body('siteTitle').optional().isString().withMessage('siteTitle must be a string'),
    body('siteFavicon').optional().isString().withMessage('siteFavicon must be a string'),
    body('logoUrl').optional().isString().withMessage('logoUrl must be a string'),
    body('slug')
      .optional()
      .isString()
      .withMessage('Slug must be a string')
      .matches(/^[a-zA-Z0-9-]*$/)
      .withMessage('Slug may only contain letters, numbers and dashes'),
  ]),
  userController.updateProfile
);

router.put(
  '/profile',
  protect,
  validate([
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('profession').optional().isString().withMessage('Profession must be a string'),
    body('siteTitle').optional().isString().withMessage('siteTitle must be a string'),
    body('siteFavicon').optional().isString().withMessage('siteFavicon must be a string'),
    body('logoUrl').optional().isString().withMessage('logoUrl must be a string'),
    body('slug')
      .optional()
      .isString()
      .withMessage('Slug must be a string')
      .matches(/^[a-zA-Z0-9-]*$/)
      .withMessage('Slug may only contain letters, numbers and dashes'),
  ]),
  userController.updateProfile
);

export default router;
