import { User } from '../features/auth/user.model.js';

// A well-formed ObjectId that never matches a real document. Used when a slug is
// supplied but no tenant exists so the request returns nothing instead of the
// legacy (owner-less) content.
const NO_MATCH_OWNER = '000000000000000000000000';

/**
 * Resolve the active tenant for the current request.
 *
 *  - A signed-in user is always their own tenant (dashboard scoping).
 *  - Otherwise `?owner=<slug>` (or the `x-tenant` header) selects the public
 *    portfolio to read from. Unknown slugs resolve to a non-matching owner.
 *  - With neither, the request falls back to the legacy root site (owner = null).
 *
 * The result is attached as `req.tenant = { ownerId, slug, found, isStaff }`.
 */
export async function resolveTenant(req, res, next) {
  try {
    if (req.user) {
      req.tenant = {
        ownerId: req.user.id,
        slug: req.user.slug || null,
        found: true,
        isStaff: true,
      };
      return next();
    }

    const slug = String(req.query.owner || req.headers['x-tenant'] || '')
      .trim()
      .toLowerCase();

    if (slug) {
      const tenant = await User.findOne({ slug, isActive: true }).select('_id name slug');
      req.tenant = {
        ownerId: tenant ? tenant.id : NO_MATCH_OWNER,
        slug: tenant ? tenant.slug : slug,
        found: Boolean(tenant),
        isStaff: false,
      };
      return next();
    }

    req.tenant = { ownerId: null, slug: null, found: true, isStaff: false };
    return next();
  } catch (error) {
    return next(error);
  }
}

export default resolveTenant;
