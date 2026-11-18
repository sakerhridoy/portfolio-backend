import mongoose from 'mongoose';
import { statusField, orderField, ownerField, withContentJson } from '../../utils/contentFields.js';

const PLAN_ICONS = ['bolt', 'star', 'crown', 'rocket', 'gem', 'shield'];

const planSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    icon: {
      type: String,
      enum: { values: PLAN_ICONS, message: 'Unsupported plan icon' },
      default: 'bolt',
    },
    price: { type: String, default: '', trim: true },
    period: { type: String, default: '', trim: true },
    highlight: { type: Boolean, default: false },
    features: { type: [String], default: [] },
    ctaLabel: { type: String, default: 'Get Started', trim: true },
    ctaHref: { type: String, default: '#contact', trim: true },
    order: orderField,
    status: statusField,
    owner: ownerField,
  },
  { timestamps: true }
);

planSchema.index({ status: 1, order: 1 });

planSchema.statics.ICONS = PLAN_ICONS;

withContentJson(planSchema);

export const Plan = mongoose.model('Plan', planSchema);

export default Plan;
