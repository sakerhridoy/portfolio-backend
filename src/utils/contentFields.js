/**
 * Field definitions + JSON shaping shared by every ordered content collection
 * (plans, testimonials, faqs, blog posts, experience, achievements, timeline).
 */

import mongoose from 'mongoose';

export const statusField = {
  type: String,
  enum: {
    values: ['published', 'draft'],
    message: 'Status must be either published or draft',
  },
  default: 'published',
};

export const orderField = {
  type: Number,
  default: 0,
};

/**
 * Tenant owner. Every content document belongs to exactly one user so that
 * `/saker` and `/sumaiya` stay fully separated.
 */
export const ownerField = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  index: true,
  default: null,
};

/**
 * Apply the standard id/__v cleanup used across the API responses.
 */
export function withContentJson(schema) {
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
  return schema;
}
