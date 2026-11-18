import { body } from 'express-validator';
import { createContentCrud } from '../../utils/contentCrud.js';
import { Achievement } from './achievement.model.js';

const writableFields = ['title', 'institution', 'description', 'year', 'icon', 'certificate', 'order', 'status'];

const validators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('institution').optional().isString(),
  body('description').optional().isString(),
  body('year').optional().isString(),
  body('icon')
    .optional()
    .isIn(Achievement.ICONS)
    .withMessage(`icon must be one of: ${Achievement.ICONS.join(', ')}`),
  body('certificate').optional().isObject().withMessage('certificate must be an object'),
  body('certificate.url').optional().isString().withMessage('certificate.url must be a string'),
  body('certificate.publicId').optional().isString().withMessage('certificate.publicId must be a string'),
  body('order').optional().isNumeric().withMessage('order must be a number'),
  body('status').optional().isIn(['published', 'draft']).withMessage('Status must be published or draft'),
];

const { router } = createContentCrud({
  model: Achievement,
  writableFields,
  searchFields: ['title', 'institution', 'description'],
  validators,
});

export default router;
