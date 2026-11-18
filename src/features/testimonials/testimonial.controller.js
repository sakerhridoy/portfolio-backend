import { Testimonial } from './testimonial.model.js';
import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import { User } from '../auth/user.model.js';

export const submitPublic = asyncHandler(async (req, res) => {
  const { name, email, role, rating, quote, review, ownerSlug, tenant } =
    req.body;
  const text = quote || review;
  const targetSlug = (
    ownerSlug ||
    tenant ||
    req.headers['x-site-slug'] ||
    'root'
  ).toLowerCase();

  if (!name || !email || !rating || !text) {
    throw new ApiError(400, 'Name, email, rating, and review are required');
  }

  let owner = null;
  if (targetSlug && targetSlug !== 'root' && targetSlug !== 'saker') {
    owner = await User.findOne({ slug: targetSlug });
  }
  if (!owner) {
    owner = await User.findOne({ role: 'admin' });
  }

  const newTestimonial = await Testimonial.create({
    name,
    email,
    role: role || '',
    rating: Number(rating) || 5,
    review: text,
    quote: text,
    owner: owner?._id,
    ownerSlug: targetSlug,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: newTestimonial });
});

export const getAdminList = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id || req.tenant?.ownerId;
  const query = ownerId ? { owner: ownerId } : {};
  const testimonials = await Testimonial.find(query).sort({
    status: 1,
    createdAt: -1,
  });
  res.status(200).json({ success: true, data: testimonials });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const testimonial = await Testimonial.findById(id);
  if (!testimonial) throw new ApiError(404, 'Testimonial not found');
  testimonial.status = status;
  await testimonial.save();
  res.status(200).json({ success: true, data: testimonial });
});
