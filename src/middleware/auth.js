import { verifyToken } from '../utils/token.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../features/auth/user.model.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

async function resolveUser(token) {
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Not authorized, token invalid or expired');
  }

  const user = await User.findById(decoded.id).select('-passwordHash');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Not authorized, user not found or inactive');
  }
  return user;
}

/**
 * Require a valid Bearer JWT. Attaches the user document to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'Not authorized, no token provided');
  req.user = await resolveUser(token);
  next();
});

/**
 * Attach req.user when a valid token is present, but never fail the request.
 * Used by public endpoints that change behaviour for admins.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
});

/**
 * Role based access control. Must run after `protect`.
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authorized'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden, insufficient permissions'));
  }
  return next();
};

/**
 * Both dashboard roles may manage content (projects, content collections, leads,
 * resume, uploads). Only `admin` may touch site settings and user accounts.
 */
export const requireStaff = requireRole('admin', 'editor');
