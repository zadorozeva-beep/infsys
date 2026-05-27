import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import * as service from './analytics.service.js';

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const weeksQuery = z.object({ weeks: z.coerce.number().int().min(1).max(52).default(12) });
const daysQuery = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) });
const limitQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) });

async function overview(_req: Request, res: Response): Promise<void> {
  const data = await service.getOverview();
  res.json({ data });
}

async function weekly(req: Request, res: Response): Promise<void> {
  const { weeks } = weeksQuery.parse(req.query);
  const data = await service.getWeeklyDynamics(weeks);
  res.json({ data, meta: { weeks } });
}

async function heatmap(req: Request, res: Response): Promise<void> {
  const { days } = daysQuery.parse(req.query);
  const data = await service.getHeatmap(days);
  res.json({ data, meta: { days } });
}

async function top(req: Request, res: Response): Promise<void> {
  const { limit } = limitQuery.parse(req.query);
  const data = await service.getTopMaterials(limit);
  res.json({ data, meta: { limit } });
}

async function disciplines(_req: Request, res: Response): Promise<void> {
  const data = await service.getDisciplineDistribution();
  res.json({ data });
}

async function funnel(req: Request, res: Response): Promise<void> {
  const { days } = daysQuery.parse(req.query);
  const data = await service.getFunnel(days);
  res.json({ data, meta: { days } });
}

export const analyticsRouter = Router();

// Усі ендпойнти аналітики доступні лише admin
analyticsRouter.use(authenticate, requireRole('admin'));
analyticsRouter.get('/overview', wrap(overview));
analyticsRouter.get('/weekly', wrap(weekly));
analyticsRouter.get('/heatmap', wrap(heatmap));
analyticsRouter.get('/top-materials', wrap(top));
analyticsRouter.get('/disciplines', wrap(disciplines));
analyticsRouter.get('/funnel', wrap(funnel));
