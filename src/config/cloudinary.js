import { v2 as cloudinary } from 'cloudinary';
import config from './env.js';

export const getCloudinary = ownerSlug => {
  const isSumaiya = String(ownerSlug).toLowerCase() === 'sumaiya';
  const cfg = isSumaiya ? config.cloudinary.sumaiya : config.cloudinary.saker;

  // Configure global Cloudinary v2 instance with tenant-specific credentials
  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
    secure: true,
  });

  return cloudinary;
};

export const getFolder = ownerSlug => {
  const isSumaiya = String(ownerSlug).toLowerCase() === 'sumaiya';
  return isSumaiya ? 'sumaiya_portfolio' : 'saker_portfolio';
};

export const isCloudinaryConfigured = ownerSlug => {
  const isSumaiya = String(ownerSlug).toLowerCase() === 'sumaiya';
  const cfg = isSumaiya ? config.cloudinary.sumaiya : config.cloudinary.saker;
  return Boolean(cfg.cloudName && cfg.apiKey && cfg.apiSecret);
};
