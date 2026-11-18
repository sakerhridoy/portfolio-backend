import { body } from 'express-validator';
import { createContentCrud } from '../../utils/contentCrud.js';
import { Timeline } from './timeline.model.js';

const writableFields = ['year', 'title', 'description', 'order', 'status'];

const validators = [
  body('year').trim().notEmpty().withMessage('Year is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('order').optional().isNumeric().withMessage('order must be a number'),
  body('status').optional().isIn(['published', 'draft']).withMessage('Status must be published or draft'),
];

const { router } = createContentCrud({
  model: Timeline,
  writableFields,
  searchFields: ['year', 'title', 'description'],
  validators,
});

export default router;
