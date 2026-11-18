import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from './auth.controller.js';
import { protect, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { strictLimiter } from '../../middleware/rateLimit.js';

const router = Router();

router.post(
  '/login',
  strictLimiter,
  validate([
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isString()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  authController.login
);

router.get('/me', protect, authController.me);

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
  authController.updateProfile
);

// Public: resolve a portfolio owner by slug (`/saker`, `/sumaiya`).
router.get('/portfolio/:slug', authController.getUserBySlug);

router.post(
  '/register',
  protect,
  requireRole('admin'),
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .isString()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'editor'])
      .withMessage('Role must be either admin or editor'),
    body('profession').optional().isString().withMessage('Profession must be a string'),
    body('siteTitle').optional().isString().withMessage('siteTitle must be a string'),
    body('siteFavicon').optional().isString().withMessage('siteFavicon must be a string'),
    body('logoUrl').optional().isString().withMessage('logoUrl must be a string'),
    body('slug')
      .optional()
      .isString()
      .withMessage('Slug must be a string')
      .matches(/^[a-zA-Z0-9-]+$/)
      .withMessage('Slug may only contain letters, numbers and dashes'),
  ]),
  authController.register
);

router.patch(
  '/password',
  protect,
  validate([
    body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isString()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ]),
  authController.updatePassword
);

// User management (admin only)
router.get('/users', protect, requireRole('admin'), authController.listUsers);

router.patch(
  '/users/:id',
  protect,
  requireRole('admin'),
  validate([
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(['admin', 'editor']).withMessage('Role must be either admin or editor'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
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
    body('password')
      .optional()
      .isString()
      .withMessage('Password must be a string')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  authController.updateUser
);

router.delete('/users/:id', protect, requireRole('admin'), authController.deleteUser);

export default router;
