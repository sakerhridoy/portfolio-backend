import asyncHandler from '../../utils/asyncHandler.js';
import * as projectService from './project.service.js';

const ownerIdOf = (req) => req.tenant?.ownerId ?? null;

export const list = asyncHandler(async (req, res) => {
  const isAdmin = ['admin', 'editor'].includes(req.user?.role);
  const { items, meta } = await projectService.listProjects(req.query, { isAdmin, ownerId: ownerIdOf(req) });
  res.status(200).json({ success: true, data: items, meta });
});

export const getOne = asyncHandler(async (req, res) => {
  const isAdmin = ['admin', 'editor'].includes(req.user?.role);
  const project = await projectService.getProjectByIdOrSlug(req.params.idOrSlug, {
    isAdmin,
    ownerId: ownerIdOf(req),
  });
  res.status(200).json({ success: true, data: project });
});

export const create = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, ownerIdOf(req));
  res.status(201).json({ success: true, data: project });
});

export const update = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body, ownerIdOf(req));
  res.status(200).json({ success: true, data: project });
});

export const remove = asyncHandler(async (req, res) => {
  const project = await projectService.deleteProject(req.params.id, ownerIdOf(req));
  res.status(200).json({ success: true, data: project });
});

export const reorder = asyncHandler(async (req, res) => {
  const data = await projectService.reorderProjects(req.body.items, ownerIdOf(req));
  res.status(200).json({ success: true, data });
});
