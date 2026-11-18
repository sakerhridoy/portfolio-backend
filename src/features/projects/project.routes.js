import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from './project.controller.js';
import { protect, requireStaff, optionalAuth } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const projectValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status')
    .optional()
    .isIn(['published', 'draft'])
    .withMessage('Status must be either published or draft'),
  body('featured').optional().isBoolean().withMessage('featured must be a boolean'),
  body('order').optional().isNumeric().withMessage('order must be a number'),
  body('techStack').optional().isArray().withMessage('techStack must be an array'),
  body('images').optional().isArray().withMessage('images must be an array'),
  body('video').optional().isObject().withMessage('video must be an object'),
  body('video.url').optional().isString().withMessage('video.url must be a string'),
  body('video.publicId').optional().isString().withMessage('video.publicId must be a string'),
  body('videoUrl').optional().isString().withMessage('videoUrl must be a string'),
  body('liveUrl').optional().isString().withMessage('liveUrl must be a string'),
  body('repoUrl').optional().isString().withMessage('repoUrl must be a string'),
  body('githubLink').optional().isString().withMessage('githubLink must be a string'),
  body('liveLink').optional().isString().withMessage('liveLink must be a string'),
  body('youtubeLink').optional().isString().withMessage('youtubeLink must be a string'),
  body('facebookLink').optional().isString().withMessage('facebookLink must be a string'),
  body('customLinks').optional().isArray().withMessage('customLinks must be an array'),
  body('customLinks.*.label').optional().isString().withMessage('customLink label must be a string'),
  body('customLinks.*.url').optional().isString().withMessage('customLink url must be a string'),
];

// Public
router.get('/', optionalAuth, resolveTenant, projectController.list);
router.get('/:idOrSlug', optionalAuth, resolveTenant, projectController.getOne);

// Admin
router.patch(
  '/reorder',
  protect,
  resolveTenant,
  requireStaff,
  validate([
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.id').notEmpty().withMessage('Each item must have an id'),
    body('items.*.order').isNumeric().withMessage('Each item must have a numeric order'),
  ]),
  projectController.reorder
);

router.post(
  '/',
  protect,
  resolveTenant,
  requireStaff,
  validate(projectValidators),
  projectController.create
);

router.put(
  '/:id',
  protect,
  resolveTenant,
  requireStaff,
  validate(projectValidators),
  projectController.update
);

router.delete('/:id', protect, resolveTenant, requireStaff, projectController.remove);

export default router;
