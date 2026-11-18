import mongoose from 'mongoose';
import { statusField, orderField, ownerField, withContentJson } from '../../utils/contentFields.js';
import { imageSchema } from '../../utils/imageSchema.js';

const ACHIEVEMENT_ICONS = ['certificate', 'trophy', 'globe', 'medal', 'award'];

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    institution: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    year: { type: String, default: '', trim: true },
    icon: {
      type: String,
      enum: { values: ACHIEVEMENT_ICONS, message: 'Unsupported achievement icon' },
      default: 'certificate',
    },
    certificate: { type: imageSchema, default: () => ({}) },
    order: orderField,
    status: statusField,
    owner: ownerField,
  },
  { timestamps: true }
);

achievementSchema.index({ status: 1, order: 1 });

achievementSchema.statics.ICONS = ACHIEVEMENT_ICONS;

withContentJson(achievementSchema);

export const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
