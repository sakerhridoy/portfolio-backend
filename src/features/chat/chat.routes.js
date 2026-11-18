import { Router } from 'express';
import { body } from 'express-validator';
import * as chatController from './chat.controller.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate } from '../../middleware/validate.js';
import { strictLimiter } from '../../middleware/rateLimit.js';

const router = Router();

router.post(
  '/',
  strictLimiter,
  resolveTenant,
  validate([body('message').trim().notEmpty().withMessage('Message is required')]),
  chatController.chat
);

export default router;
