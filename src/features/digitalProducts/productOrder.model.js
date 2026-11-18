import mongoose from "mongoose";
import { withContentJson } from "../../utils/contentFields.js";

const productOrderSchema = new mongoose.Schema(
  {
    ownerSlug: { type: String, required: true, index: true },
    orderCode: { type: String, required: true, unique: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "DigitalProduct", required: true },
    productTitle: { type: String, required: true },
    amount: { type: Number, required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    senderBkashNumber: { type: String, required: true },
    bkashTrxId: { type: String, required: true },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

export const ProductOrder = mongoose.model("ProductOrder", withContentJson(productOrderSchema));
