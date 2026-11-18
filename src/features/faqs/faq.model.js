import mongoose from 'mongoose';
import { statusField, orderField, ownerField, withContentJson } from '../../utils/contentFields.js';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: [true, 'Question is required'], trim: true },
    answer: { type: String, required: [true, 'Answer is required'], trim: true },
    order: orderField,
    status: statusField,
    owner: ownerField,
  },
  { timestamps: true }
);

faqSchema.index({ status: 1, order: 1 });

withContentJson(faqSchema);

export const Faq = mongoose.model('Faq', faqSchema);

export default Faq;
