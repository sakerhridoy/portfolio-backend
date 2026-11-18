import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { imageSchema } from '../../utils/imageSchema.js';

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email must be a valid email address'],
    },
    // Public portfolio slug (`/saker`, `/sumaiya`). Unique across the site.
    slug: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers and dashes'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'editor'],
        message: 'Role must be either admin or editor',
      },
      default: 'editor',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profession: {
      type: String,
      default: '',
      trim: true,
    },
    siteTitle: {
      type: String,
      default: '',
      trim: true,
    },
    siteFavicon: {
      type: String,
      default: '',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: { type: imageSchema, default: () => ({}) },
    heroImage: { type: imageSchema, default: () => ({}) },
    aboutImage: { type: imageSchema, default: () => ({}) },
    avatar: { type: imageSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Sparse so accounts created before slugs existed don't collide on `null`.
userSchema.index({ slug: 1 }, { unique: true, sparse: true });

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);

export default User;
