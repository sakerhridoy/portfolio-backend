import { body } from 'express-validator';
import { createContentCrud } from '../../utils/contentCrud.js';
import { BlogPost } from './blogPost.model.js';

const writableFields = [
  'title',
  'slug',
  'category',
  'excerpt',
  'content',
  'coverImage',
  'publishedAt',
  'order',
  'status',
];

const validators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('slug').optional().isString(),
  body('category').optional().isString(),
  body('excerpt').optional().isString(),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('coverImage').optional().isObject().withMessage('coverImage must be an object'),
  body('coverImage.url').optional().isString(),
  body('coverImage.publicId').optional().isString(),
  // An empty date input is a valid "use the default" signal, not a bad value.
  body('publishedAt').optional({ values: 'falsy' }).isISO8601().withMessage('publishedAt must be a valid date'),
  body('order').optional().isNumeric().withMessage('order must be a number'),
  body('status').optional().isIn(['published', 'draft']).withMessage('Status must be published or draft'),
];

const { router } = createContentCrud({
  model: BlogPost,
  writableFields,
  searchFields: ['title', 'category', 'excerpt', 'content'],
  defaultSort: { order: 1, publishedAt: -1 },
  validators,
});

export default router;
