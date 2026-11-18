import { body } from 'express-validator';
import { createContentCrud } from '../../utils/contentCrud.js';
import { Service } from './service.model.js';

const writableFields = ['title', 'desc', 'icon', 'order', 'status'];

const validators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('desc').optional().isString(),
  body('icon').optional(),
  body('order').optional().isNumeric().withMessage('order must be a number'),
  body('status').optional().isIn(['published', 'draft']).withMessage('Status must be published or draft'),
];

const { router } = createContentCrud({
  model: Service,
  writableFields,
  searchFields: ['title', 'desc'],
  validators,
});

export default router;