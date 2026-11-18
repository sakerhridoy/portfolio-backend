import mongoose from 'mongoose';
import { ownerField } from '../../utils/contentFields.js';

const leadSchema = new mongoose.Schema(
  {
    // Tenant owner — every lead belongs to the portfolio it was submitted from.
    owner: ownerField,
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email must be a valid email address'],
    },
    message: {
      type: String,
      default: '',
    },
    budget: {
      type: String,
      default: '',
    },
    projectType: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: {
        values: ['contact', 'whatsapp'],
        message: 'Source must be either contact or whatsapp',
      },
      default: 'contact',
    },
    status: {
      type: String,
      enum: {
        values: ['new', 'read', 'replied', 'archived'],
        message: 'Status must be one of new, read, replied, archived',
      },
      default: 'new',
    },
    ip: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

leadSchema.index({ owner: 1, status: 1, createdAt: -1 });

export const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
