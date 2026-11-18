import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from './testimonial.controller.js';
import { createContentCrud } from '../../utils/contentCrud.js';
import { Testimonial } from './testimonial.model.js';

const router = Router();

// Public submission
router.post('/public', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('quote').trim().notEmpty(),
  body('ownerSlug').trim().notEmpty()
], controller.submitPublic);

// Admin-specific routes
router.get('/admin', controller.getAdminList);
import { protect, requireStaff } from '../../middleware/auth.js';

router.patch('/:id/status', protect, requireStaff, [
  body('status').isIn(['pending', 'approved', 'draft', 'published', 'rejected'])
], controller.updateStatus);

router.patch('/:id/status', [
  body('status').isIn(['pending', 'approved', 'draft', 'published', 'rejected'])
], controller.updateStatus);

// Existing CRUD
const { router: crudRouter } = createContentCrud({
  model: Testimonial,
  writableFields: ['name', 'role', 'review', 'avatar', 'rating', 'order', 'status', 'email'],
  searchFields: ['name', 'role', 'review'],
  validators: [
    body('name').trim().notEmpty(),
    body('review').trim().notEmpty(),
    body('status').optional().isIn(['pending', 'approved', 'rejected'])
  ],
});

router.use('/', crudRouter);

export default router;
