import mongoose from 'mongoose';
import { statusField, orderField, ownerField, withContentJson } from '../../utils/contentFields.js';

const EXPERIENCE_ICONS = ['briefcase', 'code', 'cpu', 'table', 'layout', 'star'];

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    duration: { type: String, default: '', trim: true },
    icon: {
      type: mongoose.Schema.Types.Mixed,
      default: 'briefcase',
    },
    order: orderField,
    status: statusField,
    owner: ownerField,
  },
  { timestamps: true }
);

experienceSchema.index({ status: 1, order: 1 });

experienceSchema.statics.ICONS = EXPERIENCE_ICONS;

withContentJson(experienceSchema);

export const Experience = mongoose.model('Experience', experienceSchema);

export default Experience;
