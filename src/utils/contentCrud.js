import { Router } from 'express';
import { body } from 'express-validator';
import asyncHandler from './asyncHandler.js';
import ApiError from './ApiError.js';
import { getPagination, buildMeta, parseSort } from './pagination.js';
import { protect, requireStaff, optionalAuth } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickWritableFields(payload = {}, fields = []) {
  const data = {};
  for (const field of fields) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }
  return data;
}

/**
 * Build a query that is scoped to a single item owned by the active tenant.
 */
function scopedIdQuery(id, ownerId) {
  if (!OBJECT_ID_RE.test(String(id))) throw new ApiError(404, 'Item not found');
  return { _id: id, owner: ownerId };
}

/**
 * Build the list filter shared by every content collection.
 * Every collection is tenant scoped via `owner`; public callers only ever see
 * published items while admins may request `status=all`.
 */
function buildFilter(query, { isAdmin, ownerId, searchFields }) {
  const filter = { owner: ownerId };
  const requestedStatus = query.status;

  if (requestedStatus === 'all') {
    if (!isAdmin) throw new ApiError(403, 'Admin access required to list all items');
  } else if (!isAdmin) {
    filter.status = 'published';
  } else if (requestedStatus) {
    filter.status = requestedStatus;
  }

  if (query.search && searchFields.length) {
    const search = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = searchFields.map((field) => ({ [field]: search }));
  }

  return filter;
}

/**
 * Create a full CRUD feature (service + controller + router) for an ordered
 * content collection. Keeps the per-feature files to just a schema and a route
 * definition instead of repeating the same service/controller seven times.
 */
export function createContentCrud({
  model,
  writableFields,
  searchFields = [],
  defaultSort = { order: 1, createdAt: -1 },
  validators = [],
}) {
  if (!model) throw new Error('createContentCrud requires a mongoose model');

  const service = {
    async list(query = {}, { isAdmin = false, ownerId = null } = {}) {
      const { page, limit, skip } = getPagination(query);
      const filter = buildFilter(query, { isAdmin, ownerId, searchFields });
      const sort = parseSort(query.sort, defaultSort);

      const [items, total] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(limit),
        model.countDocuments(filter),
      ]);

      return { items, meta: buildMeta({ page, limit, total }) };
    },

    async getById(id, { isAdmin = false, ownerId = null } = {}) {
      const item = await model.findOne(scopedIdQuery(id, ownerId));
      if (!item || (!isAdmin && item.status !== 'published')) {
        throw new ApiError(404, 'Item not found');
      }
      return item;
    },

    async create(payload, ownerId = null) {
      const item = await model.create({
        ...pickWritableFields(payload, writableFields),
        owner: ownerId,
      });
      return item;
    },

    async update(id, payload, ownerId = null) {
      const item = await model.findOne(scopedIdQuery(id, ownerId));
      if (!item) throw new ApiError(404, 'Item not found');

      Object.assign(item, pickWritableFields(payload, writableFields));
      await item.save();
      return item;
    },

    async remove(id, ownerId = null) {
      const item = await model.findOneAndDelete(scopedIdQuery(id, ownerId));
      if (!item) throw new ApiError(404, 'Item not found');
      return item;
    },

    async reorder(items, ownerId = null) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new ApiError(400, 'items must be a non-empty array of { id, order }');
      }

      const operations = items.map((item) => ({
        updateOne: {
          filter: { _id: item.id, owner: ownerId },
          update: { $set: { order: Number(item.order) || 0 } },
        },
      }));

      const result = await model.bulkWrite(operations);
      return { message: `Updated order for ${result.modifiedCount} item(s)` };
    },
  };

  const controller = {
    list: asyncHandler(async (req, res) => {
      const isAdmin = ['admin', 'editor'].includes(req.user?.role);
      const { items, meta } = await service.list(req.query, { isAdmin, ownerId: req.tenant?.ownerId ?? null });
      res.status(200).json({ success: true, data: items, meta });
    }),

    getOne: asyncHandler(async (req, res) => {
      const isAdmin = ['admin', 'editor'].includes(req.user?.role);
      const item = await service.getById(req.params.id, { isAdmin, ownerId: req.tenant?.ownerId ?? null });
      res.status(200).json({ success: true, data: item });
    }),

    create: asyncHandler(async (req, res) => {
      const item = await service.create(req.body, req.tenant?.ownerId ?? null);
      res.status(201).json({ success: true, data: item });
    }),

    update: asyncHandler(async (req, res) => {
      const item = await service.update(req.params.id, req.body, req.tenant?.ownerId ?? null);
      res.status(200).json({ success: true, data: item });
    }),

    remove: asyncHandler(async (req, res) => {
      const item = await service.remove(req.params.id, req.tenant?.ownerId ?? null);
      res.status(200).json({ success: true, data: item });
    }),

    reorder: asyncHandler(async (req, res) => {
      const data = await service.reorder(req.body.items, req.tenant?.ownerId ?? null);
      res.status(200).json({ success: true, data });
    }),
  };

  const router = Router();

  router.get('/', optionalAuth, resolveTenant, controller.list);
  router.get('/:id', optionalAuth, resolveTenant, controller.getOne);

  router.patch(
    '/reorder',
    protect,
    resolveTenant,
    requireStaff,
    validate([
      body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
      body('items.*.id').notEmpty().withMessage('Each item must have an id'),
      body('items.*.order').isNumeric().withMessage('Each item must have a numeric order'),
    ]),
    controller.reorder
  );

  router.post('/', protect, resolveTenant, requireStaff, validate(validators), controller.create);
  router.put('/:id', protect, resolveTenant, requireStaff, validate(validators), controller.update);
  router.delete('/:id', protect, resolveTenant, requireStaff, controller.remove);

  return { service, controller, router };
}

export default createContentCrud;
