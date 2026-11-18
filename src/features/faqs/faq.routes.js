import { body } from 'express-validator';
import { createContentCrud } from '../../utils/contentCrud.js';
import { Faq } from './faq.model.js';

const writableFields = ['question', 'answer', 'order', 'status'];

const validators = [
  body('question').trim().notEmpty().withMessage('Question is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required'),
  body('order').optional().isNumeric().withMessage('order must be a number'),
  body('status').optional().isIn(['published', 'draft']).withMessage('Status must be published or draft'),
];

const { router } = createContentCrud({
  model: Faq,
  writableFields,
  searchFields: ['question', 'answer'],
  validators,
});

export default router;
