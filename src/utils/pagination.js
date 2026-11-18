const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

/**
 * Parse page/limit query values into safe numbers plus a mongoose `skip`.
 */
export function getPagination(query = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const rawLimit = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build the pagination meta block returned alongside list responses.
 */
export function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    pages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

/**
 * Parse a sort query string into a mongoose sort object.
 * Supports: `-field` (desc), `field:asc` / `field:desc`, or `field`.
 */
export function parseSort(sortStr, fallback = { createdAt: -1 }) {
  if (!sortStr || typeof sortStr !== 'string') return fallback;

  const sort = {};
  for (const part of sortStr.split(',')) {
    const token = part.trim();
    if (!token) continue;

    if (token.startsWith('-')) {
      const field = token.slice(1).trim();
      if (field) sort[field] = -1;
    } else if (token.includes(':')) {
      const [field, direction] = token.split(':');
      const key = field.trim();
      if (key) sort[key] = String(direction).trim().toLowerCase() === 'desc' ? -1 : 1;
    } else {
      sort[token] = 1;
    }
  }

  return Object.keys(sort).length ? sort : fallback;
}
