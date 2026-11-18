import mongoose from "mongoose";
import { imageSchema } from "../../utils/imageSchema.js";
import { withContentJson } from "../../utils/contentFields.js";

const digitalProductSchema = new mongoose.Schema(
  {
    ownerSlug: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    bkashNumber: { type: String, default: '' },
    discountPrice: { type: Number, default: null },
    currency: { type: String, default: "BDT" },
    coverImage: { type: imageSchema, default: () => ({}) },
    pdfUrl: { type: String, default: '' },
    pdfFileName: { type: String, default: '' },
    downloadCount: { type: Number, default: 0 },
    category: String,
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DigitalProduct = mongoose.model("DigitalProduct", withContentJson(digitalProductSchema));
