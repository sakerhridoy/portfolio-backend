import { Router } from 'express';
import { body } from 'express-validator';
import * as resumeController from './resume.controller.js';
import { protect, requireStaff } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// Public
router.get('/', resolveTenant, resumeController.get);

// Admin
router.put(
  '/',
  protect,
  resolveTenant,
  requireStaff,
  validate([
    body('intro').optional().isString(),
    body('resumeFile').optional().isObject().withMessage('resumeFile must be an object'),
    body('resumeFile.url').optional().isString().withMessage('resumeFile.url must be a string'),
    body('resumeFile.publicId').optional().isString().withMessage('resumeFile.publicId must be a string'),
    body('experience').optional().isArray().withMessage('experience must be an array'),
    body('education').optional().isArray().withMessage('education must be an array'),
    body('stats').optional().isArray().withMessage('stats must be an array'),
  ]),
  resumeController.update
);

export default router;
