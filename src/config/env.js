import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

/**
 * Read an environment variable. In production the variable is mandatory.
 * Outside production a clearly-labelled insecure fallback is used so that
 * tooling (tests, smoke runs) can boot without a full environment.
 */
function readVar(key, fallback) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (isProd) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return fallback;
  }
  return value;
}

function parseOrigins(raw) {
  return String(raw)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = Object.freeze({
  env: NODE_ENV,
  isProd,
  isTest,
  port: Number(process.env.PORT) || 5000,
  mongodbUri: readVar('MONGODB_URI', 'mongodb://127.0.0.1:27017/sakerhridoy'),
  jwt: Object.freeze({
    secret: readVar('JWT_SECRET', 'insecure-development-secret-change-me'),
    expiresIn: readVar('JWT_EXPIRES_IN', '7d'),
  }),
  clientOrigins: parseOrigins(readVar('CLIENT_ORIGIN', 'http://localhost:5173')),
  admin: Object.freeze({
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
    name: process.env.ADMIN_NAME || 'Administrator',
  }),
  cloudinary: Object.freeze({
    saker: {
      cloudName: process.env.CLOUDINARY_SAKER_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_SAKER_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_SAKER_API_SECRET || '',
    },
    sumaiya: {
      cloudName: process.env.CLOUDINARY_SUMAIYA_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_SUMAIYA_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_SUMAIYA_API_SECRET || '',
    },
  }),
});

export default config;
