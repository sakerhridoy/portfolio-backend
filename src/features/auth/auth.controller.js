import asyncHandler from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const data = await authService.authenticate(req.body);
  res.status(200).json({ success: true, data });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: user });
});

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: user });
});

export const getUserBySlug = asyncHandler(async (req, res) => {
  const user = await authService.getUserBySlug(req.params.slug);
  res.status(200).json({ success: true, data: user });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user, req.body);
  res.status(200).json({ success: true, data });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await authService.listUsers(req.query);
  res.status(200).json({ success: true, data: items, meta });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await authService.updateUser(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const data = await authService.deleteUser(req.params.id, req.user.id);
  res.status(200).json({ success: true, data });
});
