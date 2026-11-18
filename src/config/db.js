import mongoose from 'mongoose';
import config from './env.js';

mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB. Throws on failure so callers can decide how to react.
 */
export async function connectDB() {
  const conn = await mongoose.connect(config.mongodbUri, {
    serverSelectionTimeoutMS: 10000,
  });
  return conn;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}

export default connectDB;
