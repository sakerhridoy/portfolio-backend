import mongoose from 'mongoose';
import { imageSchema } from '../../utils/imageSchema.js';
import { ownerField } from '../../utils/contentFields.js';

const resumeItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '', trim: true },
    period: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const statSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', trim: true },
    value: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    // Marks one resume row per tenant (the legacy root site keeps `singleton`).
    key: {
      type: String,
      default: 'singleton',
      unique: true,
      immutable: true,
    },
    // Tenant owner — null for the legacy root site.
    owner: ownerField,
    intro: { type: String, default: '' },
    resumeFile: { type: imageSchema, default: () => ({}) },
    experience: { type: [resumeItemSchema], default: [] },
    education: { type: [resumeItemSchema], default: [] },
    stats: { type: [statSchema], default: [] },
  },
  { timestamps: true }
);

resumeSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.key;
    return ret;
  },
});

export const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
