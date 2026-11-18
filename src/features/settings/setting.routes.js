import { Router } from 'express';
import { body } from 'express-validator';
import * as settingController from './setting.controller.js';
import { protect, requireStaff } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

const socialValidators = ['github', 'linkedin', 'twitter', 'facebook', 'instagram'].map((key) =>
  body(`socials.${key}`).optional().isString().withMessage(`socials.${key} must be a string`)
);

// Public
router.get('/', resolveTenant, settingController.get);

// Admin — settings are per-tenant, so any signed-in user may edit their own.
router.put(
  '/',
  protect,
  resolveTenant,
  requireStaff,
  validate([
    body('heroTitle').optional().isString(),
    body('heroSubtitle').optional().isString(),
    body('profession').optional().isString(),
    body('siteTitle').optional().isString(),
    body('aboutShort').optional().isString(),
    body('contactSubtitle').optional().isString(),
    body('email').optional().isString(),
    body('phone').optional().isString(),
    body('whatsapp').optional().isString(),
    body('location').optional().isString(),
    body('resumeUrl').optional().isString(),
    body('siteName').optional().isString(),
    body('footerText').optional().isString(),
    body('seoTitle').optional().isString(),
    body('seoDescription').optional().isString(),
    body('tabTitle').optional().isString(),
    body('logoUrl').optional().isString(),
    body('logo').optional().isObject().withMessage('logo must be an object'),
    body('logo.url').optional().isString(),
    body('logo.publicId').optional().isString(),
    body('favicon').optional().isObject().withMessage('favicon must be an object'),
    body('favicon.url').optional().isString(),
    body('favicon.publicId').optional().isString(),
    body('ogImage').optional().isObject().withMessage('ogImage must be an object'),
    body('ogImage.url').optional().isString(),
    body('ogImage.publicId').optional().isString(),
    body('profileImage').optional().isObject().withMessage('profileImage must be an object'),
    body('profileImage.url').optional().isString(),
    body('profileImage.publicId').optional().isString(),
    body('bubbleIcons').optional().isArray().withMessage('bubbleIcons must be an array'),
    body('bubbleIcons.*.url').optional().isString(),
    body('bubbleIcons.*.publicId').optional().isString(),
    ...socialValidators,
  ]),
  settingController.update
);

router.patch(
  '/',
  protect,
  resolveTenant,
  requireStaff,
  settingController.update
);


export default router;
