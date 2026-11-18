import ApiError from '../../utils/ApiError.js';
import { User } from '../auth/user.model.js';
import { Project } from '../projects/project.model.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fetch a user's profile and their associated published projects by username, slug, or ID.
 */
export async function getUserProfile(identifier) {
  const clean = String(identifier || '')
    .trim()
    .replace(/^\//, '');
  if (!clean) {
    throw new ApiError(400, 'Username or slug is required');
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(clean);

  const userQuery = {
    isActive: true,
    $or: [
      { slug: clean.toLowerCase() },
      { name: new RegExp(`^${escapeRegex(clean)}$`, 'i') },
      ...(isObjectId ? [{ _id: clean }] : []),
    ],
  };

  const user = await User.findOne(userQuery);
  if (!user) {
    throw new ApiError(404, `User profile '${clean}' not found`);
  }

  let projects = await Project.find({
    owner: user._id,
    status: 'published',
  }).sort({
    order: 1,
    createdAt: -1,
  });

  if (projects.length === 0 && user.role === 'admin') {
    const legacyProjects = await Project.find({
      owner: null,
      status: 'published',
    }).sort({
      order: 1,
      createdAt: -1,
    });
    if (legacyProjects.length > 0) {
      projects = legacyProjects;
    }
  }

  const profileData = {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    slug: user.slug,
    profession: user.profession || '',
    siteTitle: user.siteTitle || '',
    siteFavicon: user.siteFavicon || '',
    logoUrl: user.logoUrl || '',
    profileImage: user.profileImage || { url: '', publicId: '' },
    heroImage: user.heroImage || { url: '', publicId: '' },
    aboutImage: user.aboutImage || { url: '', publicId: '' },
    avatar: user.avatar || { url: '', publicId: '' },
    aboutShort: user.aboutShort || '',
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    ...profileData,
    user: profileData,
    profile: profileData,
    projects,
  };
}

/**
 * Update the profile information for a user.
 */
export async function updateUserProfile(userId, payload = {}) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (payload.name !== undefined) user.name = payload.name;
  if (payload.profession !== undefined) user.profession = payload.profession;
  if (payload.siteTitle !== undefined) user.siteTitle = payload.siteTitle;
  if (payload.siteFavicon !== undefined) user.siteFavicon = payload.siteFavicon;
  if (payload.logoUrl !== undefined) user.logoUrl = payload.logoUrl;
  if (payload.aboutShort !== undefined) user.aboutShort = payload.aboutShort;
  if (payload.aboutImage !== undefined) user.aboutImage = payload.aboutImage;
  if (payload.profileImage !== undefined) user.profileImage = payload.profileImage;
  if (payload.heroImage !== undefined) user.heroImage = payload.heroImage;
  if (payload.avatar !== undefined) user.avatar = payload.avatar;

  if (payload.slug !== undefined && payload.slug !== '') {
    const nextSlug = payload.slug.trim().toLowerCase();
    if (nextSlug !== user.slug) {
      const existing = await User.findOne({
        slug: nextSlug,
        _id: { $ne: user._id },
      });
      if (existing) throw new ApiError(409, 'This slug is already in use');
      user.slug = nextSlug;
    }
  }

  await user.save();

  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    slug: user.slug,
    profession: user.profession || '',
    siteTitle: user.siteTitle || '',
    siteFavicon: user.siteFavicon || '',
    logoUrl: user.logoUrl || '',
    profileImage: user.profileImage || { url: '', publicId: '' },
    heroImage: user.heroImage || { url: '', publicId: '' },
    aboutImage: user.aboutImage || { url: '', publicId: '' },
    avatar: user.avatar || { url: '', publicId: '' },
    aboutShort: user.aboutShort || '',
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
