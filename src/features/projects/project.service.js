import slugify from 'slugify';
import ApiError from '../../utils/ApiError.js';
import { getPagination, buildMeta, parseSort } from '../../utils/pagination.js';
import { Project } from './project.model.js';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const WRITABLE_FIELDS = [
  'title',
  'description',
  'category',
  'techStack',
  'images',
  'video',
  'videoUrl',
  'liveUrl',
  'repoUrl',
  'githubLink',
  'liveLink',
  'youtubeLink',
  'facebookLink',
  'customLinks',
  'featured',
  'order',
  'status',
];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickWritableFields(payload = {}) {
  const data = {};
  for (const field of WRITABLE_FIELDS) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }
  return data;
}

async function generateUniqueSlug(title, excludeId = null) {
  const base = slugify(String(title), { lower: true, strict: true }) || 'project';
  let slug = base;
  let counter = 1;

  for (;;) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    // eslint-disable-next-line no-await-in-loop
    const existing = await Project.exists(query);
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export async function listProjects(query = {}, { isAdmin = false, ownerId = null } = {}) {
  const { page, limit, skip } = getPagination(query);
  const filter = { owner: ownerId };

  const requestedStatus = query.status;
  if (requestedStatus === 'all') {
    if (!isAdmin) throw new ApiError(403, 'Admin access required to list all projects');
  } else if (!isAdmin) {
    filter.status = 'published';
  } else if (requestedStatus) {
    filter.status = requestedStatus;
  }

  if (query.category) {
    filter.category = new RegExp(`^${escapeRegex(query.category)}$`, 'i');
  }

  if (query.featured !== undefined && query.featured !== '') {
    filter.featured = query.featured === true || query.featured === 'true';
  }

  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: search }, { description: search }, { techStack: search }];
  }

  const sort = parseSort(query.sort, { order: 1, createdAt: -1 });

  const [items, total] = await Promise.all([
    Project.find(filter).sort(sort).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getProjectByIdOrSlug(idOrSlug, { isAdmin = false, ownerId = null } = {}) {
  const query = OBJECT_ID_RE.test(idOrSlug)
    ? { owner: ownerId, $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }
    : { owner: ownerId, slug: idOrSlug };

  const project = await Project.findOne(query);
  // Drafts are visible only to authenticated admins.
  if (!project || (!isAdmin && project.status !== 'published')) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
}

export async function createProject(payload, ownerId = null) {
  const data = pickWritableFields(payload);
  data.slug = await generateUniqueSlug(payload.title);
  data.owner = ownerId;

  const project = await Project.create(data);
  return project;
}

export async function updateProject(id, payload, ownerId = null) {
  if (!OBJECT_ID_RE.test(String(id))) throw new ApiError(404, 'Project not found');
  const project = await Project.findOne({ _id: id, owner: ownerId });
  if (!project) throw new ApiError(404, 'Project not found');

  const data = pickWritableFields(payload);

  if (payload.title && payload.title !== project.title) {
    data.slug = await generateUniqueSlug(payload.title, project.id);
  }

  Object.assign(project, data);
  await project.save();
  return project;
}

export async function deleteProject(id, ownerId = null) {
  if (!OBJECT_ID_RE.test(String(id))) throw new ApiError(404, 'Project not found');
  const project = await Project.findOneAndDelete({ _id: id, owner: ownerId });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
}

export async function reorderProjects(items, ownerId = null) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'items must be a non-empty array of { id, order }');
  }

  const operations = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id, owner: ownerId },
      update: { $set: { order: Number(item.order) || 0 } },
    },
  }));

  const result = await Project.bulkWrite(operations);
  return { message: `Updated order for ${result.modifiedCount} project(s)` };
}
