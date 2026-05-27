import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { commentsRouter, materialCommentsRouter } from './modules/comments/comments.routes.js';
import { disciplinesRouter } from './modules/disciplines/disciplines.routes.js';
import { materialTypesRouter } from './modules/material-types/material-types.routes.js';
import { materialsRouter } from './modules/materials/materials.routes.js';
import { meRouter } from './modules/me/me.routes.js';
import { planRouter } from './modules/plan/plan.routes.js';
import { programsRouter } from './modules/programs/programs.routes.js';
import { tagsRouter } from './modules/tags/tags.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { logger } from './utils/logger.js';

const GLOBAL_RATE_LIMIT_MAX = 300;
const GLOBAL_RATE_LIMIT_WINDOW_MIN = 15;

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Мінімальне HTTP-логування — без тіл, без токенів.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms` +
          (req.user ? ` user=${req.user.userId}` : ''),
      );
    });
    next();
  });

  app.use(
    rateLimit({
      windowMs: GLOBAL_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
      max: GLOBAL_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: { code: 'TOO_MANY_REQUESTS', message: 'Забагато запитів, спробуйте пізніше' },
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({ data: { status: 'ok', uptime: process.uptime() } });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/me/plan', planRouter);
  app.use('/api/me', meRouter);
  app.use('/api/admin/analytics', analyticsRouter);
  app.use('/api/materials/:materialId/comments', materialCommentsRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/materials', materialsRouter);
  app.use('/api/disciplines', disciplinesRouter);
  app.use('/api/tags', tagsRouter);
  app.use('/api/material-types', materialTypesRouter);
  app.use('/api/programs', programsRouter);
  app.use('/api/users', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
