import { body } from 'express-validator';
import { createContentCrud } from '../../utils/contentCrud.js';
import { Experience } from './experience.model.js';

const writableFields = ['title', 'description', 'duration', 'icon', 'order', 'status'];

const validators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('duration').optional().isString(),
  body('icon').optional(), // Accept any value (string or object)
  body('order').optional().isNumeric().withMessage('order must be a number'),
  body('status').optional().isIn(['published', 'draft']).withMessage('Status must be published or draft'),
];

const { router } = createContentCrud({
  model: Experience,
  writableFields,
  searchFields: ['title', 'description'],
  validators,
});

export default router;
