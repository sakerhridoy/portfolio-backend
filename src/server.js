import { setServers } from 'node:dns/promises';
setServers(['1.1.1.1', '8.8.8.8']);
import http from 'node:http';
import mongoose from 'mongoose';
import app from './app.js';
import config from './config/env.js';
import { connectDB } from './config/db.js';

async function bootstrap() {
  try {
    await connectDB();
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed: ' + error.message);
  }

  const server = http.createServer(app);

  server.listen(config.port, () => {
    console.log('Listening on port ' + config.port + ' (' + config.env + ')');
  });

  const shutdown = signal => {
    console.log('Received ' + signal + ', shutting down gracefully...');
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
