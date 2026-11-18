import asyncHandler from '../../utils/asyncHandler.js';
import * as userService from './user.service.js';

export const getProfileByUsername = asyncHandler(async (req, res) => {
  const data = await userService.getUserProfile(req.params.username);
  res.status(200).json({ success: true, data });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = await userService.updateUserProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data });
});
