import asyncHandler from '../../utils/asyncHandler.js';
import * as resumeService from './resume.service.js';

const ownerIdOf = (req) => req.tenant?.ownerId ?? null;

export const get = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResume(ownerIdOf(req));
  res.status(200).json({ success: true, data: resume });
});

export const update = asyncHandler(async (req, res) => {
  const resume = await resumeService.updateResume(req.body, ownerIdOf(req));
  res.status(200).json({ success: true, data: resume });
});
