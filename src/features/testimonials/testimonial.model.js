import mongoose from 'mongoose';
import { imageSchema } from '../../utils/imageSchema.js';
import { orderField, ownerField, withContentJson } from '../../utils/contentFields.js';

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    role: { type: String, default: '', trim: true },
    review: { type: String, required: [true, 'Review is required'], trim: true },
    avatar: { type: imageSchema, default: () => ({}) },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    order: orderField,
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'draft' , 'published' , 'rejected'], 
      default: 'approved' 
    },
    owner: ownerField,
  },
  { timestamps: true }
);

testimonialSchema.index({ status: 1, order: 1, owner: 1 });

withContentJson(testimonialSchema);

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;
