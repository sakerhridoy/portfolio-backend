import { DigitalProduct } from "./digitalProduct.model.js";
import { ProductOrder } from "./productOrder.model.js";
import { Setting } from "../settings/setting.model.js";
import { User } from "../auth/user.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";

const resolveId = (req) => req.params.productId || req.body?.productId || req.body?.id || '';

export const getPublicProducts = asyncHandler(async (req, res) => {
  const requestedSlug = req.query?.slug;
  if (requestedSlug !== undefined && typeof requestedSlug !== 'string') {
    throw new ApiError(400, "Invalid tenant slug");
  }
  const slug = requestedSlug?.trim().toLowerCase() || 'saker';
  const user = await User.findOne({ slug });
  const products = await DigitalProduct.find({ ownerSlug: slug, isActive: true }).sort({ order: 1, createdAt: -1 });
  const settings = user ? await Setting.findOne({ owner: user._id }) : null;
  const bkashNumber = settings?.bkashNumber || products?.[0]?.bkashNumber || '';
  res.json({ success: true, products, bkashNumber });
});

export const getPublicProduct = asyncHandler(async (req, res) => {
  const product = await DigitalProduct.findById(req.params.id);
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");
  const user = await User.findOne({ slug: product.ownerSlug });
  const settings = user ? await Setting.findOne({ owner: user._id }) : null;
  const bkashNumber = settings?.bkashNumber || product.bkashNumber || '';
  res.json({ success: true, product, bkashNumber });
});

export const updateBkash = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  const ownerSlug = req.user?.slug;
  if (!ownerId) throw new ApiError(401, "Authentication required");
  if (!ownerSlug) throw new ApiError(400, "Account is missing a portfolio slug");

  if (typeof req.body?.bkashNumber !== 'string') {
    throw new ApiError(400, "bKash number must be a string");
  }
  const bkashNumber = req.body.bkashNumber.trim();

  const existingSettings = await Setting.findOne({ owner: ownerId });
  if (existingSettings) {
    await Setting.updateOne({ _id: existingSettings._id }, { $set: { bkashNumber } });
  } else {
    await Setting.findOneAndUpdate(
      { key: `user:${ownerId}` },
      { $set: { owner: ownerId, bkashNumber } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  await DigitalProduct.updateMany({ ownerSlug }, { $set: { bkashNumber } });
  res.json({ success: true, bkashNumber });
});


export const freeDownload = asyncHandler(async (req, res) => {
  const productId = resolveId(req);
  const buyerName = String(req.body.buyerName || req.body.name || '').trim();
  const buyerEmail = String(req.body.buyerEmail || req.body.email || '').trim();
  const contactNumber = String(req.body.contactNumber || req.body.phone || '').trim();
  
  if (!productId) throw new ApiError(400, "Product ID missing");

  const product = await DigitalProduct.findByIdAndUpdate(productId, { $inc: { downloadCount: 1 } }, { new: true });
  if (!product) throw new ApiError(404, "Product not found");
  
  await ProductOrder.create({ 
    ownerSlug: product.ownerSlug, 
    productId: product._id,
    buyerName, buyerEmail, contactNumber,
    orderType: 'free', 
    orderCode: `FREE-${Date.now()}`, 
    productTitle: product.title, 
    amount: 0, 
    senderBkashNumber: 'N/A', 
    bkashTrxId: 'N/A',
    status: 'verified'
  });
  
  res.json({ success: true, pdfUrl: product.pdfUrl || '', pdfFileName: product.pdfFileName || `${product.title}.pdf` });
});

export const createOrder = asyncHandler(async (req, res) => {
  const productId = resolveId(req);
  const data = {
    buyerName: String(req.body.buyerName || req.body.name || '').trim(),
    buyerEmail: String(req.body.buyerEmail || req.body.email || '').trim(),
    senderBkashNumber: String(req.body.senderBkashNumber || req.body.bkashNumber || '').trim(),
    bkashTrxId: String(req.body.bkashTrxId || req.body.trxId || '').trim()
  };

  if (!productId) throw new ApiError(400, "Product ID missing");

  const product = await DigitalProduct.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
  
  const finalPrice = (product.discountPrice && product.discountPrice < product.price) ? product.discountPrice : product.price;
  
  const order = await ProductOrder.create({ 
    ownerSlug: product.ownerSlug,
    productId: product._id,
    ...data,
    orderCode: `ORD-${Date.now()}`, 
    productTitle: product.title, 
    amount: finalPrice 
  });
  
  res.status(201).json({ success: true, data: order });
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  const ownerSlug = req.user?.slug;
  if (!ownerId) throw new ApiError(401, "Authentication required");
  if (!ownerSlug) throw new ApiError(400, "Account is missing a portfolio slug");

  const products = await DigitalProduct.find({ ownerSlug }).sort({ createdAt: -1 });
  const settings = await Setting.findOne({ owner: ownerId });
  const bkashNumber = settings?.bkashNumber || products?.[0]?.bkashNumber || '';
  res.json({ success: true, products, data: products, bkashNumber });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await DigitalProduct.create({ ...req.body, ownerSlug: req.user.slug });
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await DigitalProduct.findOneAndUpdate({ _id: req.params.id, ownerSlug: req.user.slug }, req.body, { new: true });
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await DigitalProduct.findOneAndDelete({ _id: req.params.id, ownerSlug: req.user.slug });
  res.json({ success: true });
});

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await ProductOrder.find({ ownerSlug: req.user.slug }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await ProductOrder.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, data: order });
});
