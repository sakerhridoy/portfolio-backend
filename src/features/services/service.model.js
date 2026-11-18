import mongoose from 'mongoose';
import { statusField, orderField, ownerField, withContentJson } from '../../utils/contentFields.js';

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    desc: { type: String, default: '', trim: true },
    icon: {
      type: mongoose.Schema.Types.Mixed,
      default: 'code',
    },
    order: orderField,
    status: statusField,
    owner: ownerField,
  },
  { timestamps: true }
);

withContentJson(serviceSchema);

export const Service = mongoose.model('Service', serviceSchema);
export default Service;