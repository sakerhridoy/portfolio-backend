import { Router } from 'express';
import { body } from 'express-validator';
import { z } from 'zod';
import * as leadController from './lead.controller.js';
import { protect, requireStaff } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { validate as expressValidate } from '../../middleware/validate.js';
import { strictLimiter } from '../../middleware/rateLimit.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('A valid email is required'),
  message: z.string().optional(),
  budget: z.string().optional(),
  projectType: z.string().optional(),
  source: z.enum(['contact', 'whatsapp']).optional(),
});

const zodValidator = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, errors: result.error.errors });
  }
  req.body = result.data;
  next();
};

router.post(
  '/',
  strictLimiter,
  resolveTenant,
  zodValidator(contactSchema),
  leadController.create
);

// Admin
router.get('/', protect, resolveTenant, requireStaff, leadController.list);
router.get('/stats/summary', protect, resolveTenant, requireStaff, leadController.stats);
router.get('/:id', protect, resolveTenant, requireStaff, leadController.getOne);
router.patch(
  '/:id',
  protect,
  resolveTenant,
  requireStaff,
  expressValidate([
    body('status')
      .isIn(['new', 'read', 'replied', 'archived'])
      .withMessage('Status must be one of new, read, replied, archived'),
  ]),
  leadController.update
);
router.delete('/:id', protect, resolveTenant, requireStaff, leadController.remove);

export default router;
