import mongoose from 'mongoose';
import { statusField, orderField, ownerField, withContentJson } from '../../utils/contentFields.js';

const timelineSchema = new mongoose.Schema(
  {
    year: { type: String, required: [true, 'Year is required'], trim: true },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    order: orderField,
    status: statusField,
    owner: ownerField,
  },
  { timestamps: true }
);

timelineSchema.index({ status: 1, order: 1 });

withContentJson(timelineSchema);

export const Timeline = mongoose.model('Timeline', timelineSchema);

export default Timeline;
