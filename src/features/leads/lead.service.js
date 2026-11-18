import mongoose from 'mongoose';
import ApiError from '../../utils/ApiError.js';
import { getPagination, buildMeta, parseSort } from '../../utils/pagination.js';
import { Lead } from './lead.model.js';

const WRITABLE_FIELDS = ['name', 'email', 'message', 'budget', 'projectType', 'source'];
const LEAD_STATUSES = ['new', 'read', 'replied', 'archived'];
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scopedIdQuery(id, ownerId) {
  if (!OBJECT_ID_RE.test(String(id))) throw new ApiError(404, 'Lead not found');
  return { _id: id, owner: ownerId };
}

import { getMailerForTenant } from '../../utils/mailer.js';

export async function createLead(payload, ip, ownerId = null, tenantSlug = 'saker') {
  const data = {};
  for (const field of WRITABLE_FIELDS) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }
  data.ip = ip || '';
  data.owner = ownerId;

  const lead = await Lead.create(data);

  // Send single inquiry notification to owner
  try {
    const mailer = getMailerForTenant(tenantSlug);
    await mailer.sendInquiry(lead);
  } catch (err) {
    console.error('Inquiry email notification failed', err);
  }

  return lead;
}

export async function listLeads(query = {}, ownerId = null) {
  const { page, limit, skip } = getPagination(query);
  const filter = { owner: ownerId };

  if (query.status) {
    if (!LEAD_STATUSES.includes(query.status)) {
      throw new ApiError(400, `status must be one of: ${LEAD_STATUSES.join(', ')}`);
    }
    filter.status = query.status;
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: search }, { email: search }, { message: search }];
  }

  const sort = parseSort(query.sort, { createdAt: -1 });

  const [items, total] = await Promise.all([
    Lead.find(filter).sort(sort).skip(skip).limit(limit),
    Lead.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getLeadById(id, ownerId = null) {
  const lead = await Lead.findOne(scopedIdQuery(id, ownerId));
  if (!lead) throw new ApiError(404, 'Lead not found');
  return lead;
}

export async function updateLeadStatus(id, status, ownerId = null) {
  if (!LEAD_STATUSES.includes(status)) {
    throw new ApiError(400, `status must be one of: ${LEAD_STATUSES.join(', ')}`);
  }

  const lead = await Lead.findOneAndUpdate(
    scopedIdQuery(id, ownerId),
    { status },
    { new: true, runValidators: true }
  );
  if (!lead) throw new ApiError(404, 'Lead not found');
  return lead;
}

export async function deleteLead(id, ownerId = null) {
  const lead = await Lead.findOneAndDelete(scopedIdQuery(id, ownerId));
  if (!lead) throw new ApiError(404, 'Lead not found');
  return lead;
}

export async function getStatsSummary(ownerId = null) {
  // Aggregations bypass mongoose casting, so build the owner ObjectId explicitly.
  const results = await Lead.aggregate([
    { $match: { owner: ownerId ? new mongoose.Types.ObjectId(String(ownerId)) : null } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const summary = { new: 0, read: 0, replied: 0, archived: 0, total: 0 };
  for (const row of results) {
    if (row._id in summary) summary[row._id] = row.count;
    summary.total += row.count;
  }
  return summary;
}
