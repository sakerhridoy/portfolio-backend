import asyncHandler from '../../utils/asyncHandler.js';
import * as settingService from './setting.service.js';

const ownerIdOf = (req) => req.tenant?.ownerId ?? null;

export const get = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings(ownerIdOf(req));
  res.status(200).json({ success: true, data: settings });
});

export const update = asyncHandler(async (req, res) => {
  const settings = await settingService.updateSettings(req.body, ownerIdOf(req));
  res.status(200).json({ success: true, data: settings });
});
