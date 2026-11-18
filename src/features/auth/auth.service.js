import ApiError from '../../utils/ApiError.js';
import { signToken } from '../../utils/token.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { generateUniqueSlug, slugifyValue } from '../../utils/slug.js';
import { User } from './user.model.js';

export async function authenticate({ email, password }) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+passwordHash');

  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account is inactive');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  // Backfill a slug for accounts created before multi-tenant support existed.
  if (!user.slug) {
    user.slug = await generateUniqueSlug(User, user.name || user.email, { excludeId: user._id });
    await user.save();
  }

  const token = signToken({ id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      slug: user.slug,
      profession: user.profession || '',
      siteTitle: user.siteTitle || '',
      siteFavicon: user.siteFavicon || '',
      logoUrl: user.logoUrl || '',
    },
  };
}

export async function registerUser({
  name,
  email,
  password,
  role,
  slug,
  profession,
  siteTitle,
  siteFavicon,
  logoUrl,
}) {
  const normalizedEmail = String(email).toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const nextSlug = slug
    ? await assertSlugAvailable(slugifyValue(slug, 'user'))
    : await generateUniqueSlug(User, name || normalizedEmail, { fallback: 'user' });

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: role || 'editor',
    slug: nextSlug,
    profession: profession || '',
    siteTitle: siteTitle || '',
    siteFavicon: siteFavicon || '',
    logoUrl: logoUrl || '',
  });

  return user;
}

/**
 * Ensure a manually chosen slug is free. Throws when it is already taken.
 */
async function assertSlugAvailable(slug, excludeId = null) {
  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await User.exists(query);
  if (existing) throw new ApiError(409, 'This slug is already in use');
  return slug;
}

/**
 * Resolve a public portfolio owner from its slug. Used by the public site to
 * figure out whose content should be shown for `/<slug>`.
 */
export async function getUserBySlug(slug) {
  const user = await User.findOne({ slug: String(slug).toLowerCase(), isActive: true }).select(
    'name email slug role profession siteTitle siteFavicon logoUrl'
  );
  if (!user) throw new ApiError(404, 'Portfolio not found');
  return user;
}

export async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function changePassword(user, { currentPassword, newPassword }) {
  const doc = await User.findById(user.id).select('+passwordHash');
  if (!doc) throw new ApiError(404, 'User not found');

  const isMatch = await doc.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, 'Current password is incorrect');

  doc.passwordHash = await User.hashPassword(newPassword);
  await doc.save();

  return { message: 'Password updated successfully' };
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Guard against locking everyone out of the dashboard: never allow the last
 * usable admin account to be demoted, deactivated or deleted.
 */
async function assertAnotherActiveAdminExists(excludeUserId) {
  const remaining = await User.countDocuments({
    role: 'admin',
    isActive: true,
    _id: { $ne: excludeUserId },
  });

  if (remaining === 0) {
    throw new ApiError(400, 'At least one active admin must remain');
  }
}

export async function listUsers(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: search }, { email: search }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function updateUser(id, payload = {}, actingUserId) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  const nextRole = payload.role ?? user.role;
  const nextIsActive = payload.isActive ?? user.isActive;
  const losesAdminAccess = user.role === 'admin' && (nextRole !== 'admin' || nextIsActive === false);

  if (losesAdminAccess) {
    if (String(user.id) === String(actingUserId)) {
      throw new ApiError(400, 'You cannot remove your own admin access');
    }
    await assertAnotherActiveAdminExists(user._id);
  }

  if (payload.name !== undefined) user.name = payload.name;
  if (payload.role !== undefined) user.role = payload.role;
  if (payload.isActive !== undefined) user.isActive = payload.isActive;
  if (payload.password) user.passwordHash = await User.hashPassword(payload.password);
  if (payload.profession !== undefined) user.profession = payload.profession;
  if (payload.siteTitle !== undefined) user.siteTitle = payload.siteTitle;
  if (payload.siteFavicon !== undefined) user.siteFavicon = payload.siteFavicon;
  if (payload.logoUrl !== undefined) user.logoUrl = payload.logoUrl;

  if (payload.slug !== undefined && payload.slug !== '') {
    const nextSlug = slugifyValue(payload.slug, 'user');
    if (nextSlug !== user.slug) {
      user.slug = await assertSlugAvailable(nextSlug, user._id);
    }
  }

  await user.save();
  return user;
}

export async function updateProfile(userId, payload = {}) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (payload.name !== undefined) user.name = payload.name;
  if (payload.profession !== undefined) user.profession = payload.profession;
  if (payload.siteTitle !== undefined) user.siteTitle = payload.siteTitle;
  if (payload.siteFavicon !== undefined) user.siteFavicon = payload.siteFavicon;
  if (payload.logoUrl !== undefined) user.logoUrl = payload.logoUrl;

  if (payload.slug !== undefined && payload.slug !== '') {
    const nextSlug = slugifyValue(payload.slug, 'user');
    if (nextSlug !== user.slug) {
      user.slug = await assertSlugAvailable(nextSlug, user._id);
    }
  }

  await user.save();
  return user;
}

export async function deleteUser(id, actingUserId) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  if (String(user.id) === String(actingUserId)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  if (user.role === 'admin') await assertAnotherActiveAdminExists(user._id);

  await user.deleteOne();
  return { message: 'User deleted successfully' };
}
