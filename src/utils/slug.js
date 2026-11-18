/**
 * Slug helpers shared by every multi-tenant lookup (users today, projects too).
 */
import slugify from 'slugify';

export function slugifyValue(value, fallback = 'user') {
  return slugify(String(value || ''), { lower: true, strict: true }) || fallback;
}

/**
 * Produce a slug that is not yet taken by another document of `Model`.
 * Falls back to `<base>-1`, `<base>-2`, ... on collisions.
 */
export async function generateUniqueSlug(Model, source, { fallback = 'user', excludeId = null } = {}) {
  const base = slugifyValue(source, fallback);
  let slug = base;
  let counter = 1;

  for (;;) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    // eslint-disable-next-line no-await-in-loop
    const existing = await Model.exists(query);
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export default slugifyValue;
