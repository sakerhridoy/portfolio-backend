import mongoose from 'mongoose';

/**
 * Reusable embedded schema for a Cloudinary-hosted image.
 */
export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: '', trim: true },
    publicId: { type: String, default: '', trim: true },
  originalName: { type: String, default: '', trim: true },
  },
  { _id: false }
);

export default imageSchema;
