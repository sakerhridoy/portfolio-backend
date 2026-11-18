import mongoose from 'mongoose';
import slugify from 'slugify';
import { imageSchema } from '../../utils/imageSchema.js';
import { statusField, orderField, ownerField, withContentJson } from '../../utils/contentFields.js';

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    slug: { type: String, unique: true, index: true, lowercase: true, trim: true },
    category: { type: String, default: '', trim: true },
    excerpt: { type: String, default: '', trim: true },
    content: { type: String, required: [true, 'Content is required'] },
    coverImage: { type: imageSchema, default: () => ({}) },
    publishedAt: { type: Date, default: Date.now },
    order: orderField,
    status: statusField,
    owner: ownerField,
  },
  { timestamps: true }
);

blogPostSchema.index({ status: 1, order: 1 });

// Derive a URL-safe, collision-free slug from the title.
blogPostSchema.pre('validate', async function ensureSlug() {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true }) || 'post';
  }
  if (!this.slug) return;

  const Model = this.constructor;
  const base = this.slug;
  let candidate = base;
  let counter = 1;

  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Model.exists({ slug: candidate, _id: { $ne: this._id } });
    if (!existing) break;
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  this.slug = candidate;
});

withContentJson(blogPostSchema);

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;
