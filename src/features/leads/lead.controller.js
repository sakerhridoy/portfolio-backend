import asyncHandler from '../../utils/asyncHandler.js';
import * as leadService from './lead.service.js';

const ownerIdOf = (req) => req.tenant?.ownerId ?? null;

export const create = asyncHandler(async (req, res) => {
  const tenantSlug = req.tenant?.slug || 'saker';
  const lead = await leadService.createLead(req.body, req.ip, ownerIdOf(req), tenantSlug);
  res.status(201).json({ success: true, data: lead });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await leadService.listLeads(req.query, ownerIdOf(req));
  res.status(200).json({ success: true, data: items, meta });
});

export const getOne = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, ownerIdOf(req));
  res.status(200).json({ success: true, data: lead });
});

export const update = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadStatus(req.params.id, req.body.status, ownerIdOf(req));
  res.status(200).json({ success: true, data: lead });
});

export const remove = asyncHandler(async (req, res) => {
  const lead = await leadService.deleteLead(req.params.id, ownerIdOf(req));
  res.status(200).json({ success: true, data: lead });
});

export const stats = asyncHandler(async (req, res) => {
  const data = await leadService.getStatsSummary(ownerIdOf(req));
  res.status(200).json({ success: true, data });
});
