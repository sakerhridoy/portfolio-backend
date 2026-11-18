import { body } from 'express-validator';
import { createContentCrud } from '../../utils/contentCrud.js';
import { Plan } from './plan.model.js';

const writableFields = [
  'title',
  'icon',
  'price',
  'period',
  'highlight',
  'features',
  'ctaLabel',
  'ctaHref',
  'order',
  'status',
];

const validators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('icon').optional().isIn(Plan.ICONS).withMessage(`icon must be one of: ${Plan.ICONS.join(', ')}`),
  body('price').optional().isString(),
  body('period').optional().isString(),
  body('highlight').optional().isBoolean().withMessage('highlight must be a boolean'),
  body('features').optional().isArray().withMessage('features must be an array'),
  body('ctaLabel').optional().isString(),
  body('ctaHref').optional().isString(),
  body('order').optional().isNumeric().withMessage('order must be a number'),
  body('status').optional().isIn(['published', 'draft']).withMessage('Status must be published or draft'),
];

const { router } = createContentCrud({
  model: Plan,
  writableFields,
  searchFields: ['title', 'price'],
  validators,
});

export default router;
