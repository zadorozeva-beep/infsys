import fs from 'node:fs';
import path from 'node:path';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma } from './db/prisma.js';
import { initSocketServer } from './modules/realtime/socket.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`АІС backend слухає на http://localhost:${env.PORT} (env=${env.NODE_ENV})`);
  });
  initSocketServer(server);

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Отримано ${signal}, завершую роботу...`);
    server.close(() => logger.info('HTTP-сервер закрито'));
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
  });
}

bootstrap().catch((err) => {
  logger.error('Помилка старту сервера', err);
  process.exit(1);
});
