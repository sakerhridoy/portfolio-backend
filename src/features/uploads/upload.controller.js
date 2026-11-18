import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import {
  getCloudinary,
  getFolder,
  isCloudinaryConfigured,
} from '../../config/cloudinary.js';

function resolveOwnerSlug(req) {
  // Resolve the owner slug from the user's information or the tenant context
  const directSlug =
    req.tenant?.slug ||
    req.user?.slug ||
    req.user?.username ||
    req.headers['x-tenant-slug'] ||
    req.body?.ownerSlug;

  if (directSlug) return String(directSlug).toLowerCase();

  const email = String(req.user?.email || '').toLowerCase();
  const name = String(req.user?.name || '').toLowerCase();

  // Specifically check for Sumaiya's identifier
  if (email.includes('sumaiya') || name.includes('sumaiya')) {
    return 'sumaiya';
  }

  // If no tenant is identified, return 'saker' as the default tenant
  return 'saker';
}

function assertConfigured(ownerSlug) {
  if (!isCloudinaryConfigured(ownerSlug)) {
    throw new ApiError(
      503,
      `File uploads are not configured for this tenant (${ownerSlug}). Check environment variables.`,
    );
  }
}

function resolveResourceType(mimetype = '') {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  return 'raw';
}

function uploadBuffer(buffer, resourceType, ownerSlug, isPdf = false) {
  const cloudinary = getCloudinary(ownerSlug);
  const folder = getFolder(ownerSlug);

  const options = { folder, resource_type: resourceType };
  if (isPdf) {
    options.resource_type = 'raw';
    options.format = 'pdf';
    options.use_filename = true;
    options.unique_filename = false;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export const uploadMedia = asyncHandler(async (req, res) => {
  const ownerSlug = resolveOwnerSlug(req);
  assertConfigured(ownerSlug);

  if (!req.file) {
    throw new ApiError(
      400,
      'No file uploaded. Send a multipart/form-data request with a "file" field.',
    );
  }

  const isPdf = req.file.mimetype === 'application/pdf';
  const resourceType = isPdf ? 'raw' : resolveResourceType(req.file.mimetype);
  const result = await uploadBuffer(req.file.buffer, resourceType, ownerSlug, isPdf);

  res.status(201).json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType,
      width: result.width,
      height: result.height,
      format: result.format || (isPdf ? 'pdf' : undefined),
      bytes: result.bytes,
    },
  });
});

const DELETE_RESOURCE_TYPES = ['image', 'video', 'raw'];

export const deleteMedia = asyncHandler(async (req, res) => {
  const ownerSlug = resolveOwnerSlug(req);
  assertConfigured(ownerSlug);

  const cloudinary = getCloudinary(ownerSlug);
  const publicId = req.body?.publicId;

  if (!publicId || typeof publicId !== 'string') {
    throw new ApiError(400, 'publicId is required');
  }

  for (const resourceType of DELETE_RESOURCE_TYPES) {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    if (result.result === 'ok') {
      res.status(200).json({ success: true, data: result });
      return;
    }
  }

  res
    .status(200)
    .json({ success: true, data: { result: 'not found', publicId } });
});