import asyncHandler from '../../utils/asyncHandler.js';
import * as chatService from './chat.service.js';

const ownerIdOf = (req) => req.tenant?.ownerId ?? null;

export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const ownerId = ownerIdOf(req);
  const result = await chatService.processChatMessage({ message, ownerId });
  res.status(200).json({ success: true, data: result });
});
