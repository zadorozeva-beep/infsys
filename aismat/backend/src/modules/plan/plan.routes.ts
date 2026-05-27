import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

import { authenticate } from '../../middleware/auth.middleware.js';
import { UnauthorizedError, ValidationError } from '../../utils/errors.js';
import * as service from './plan.service.js';

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const statusEnum = z.enum(['todo', 'in_progress', 'done']);

const addBody = z.object({
  materialId: z.coerce.number().int().positive(),
  status: statusEnum.optional(),
});

const reorderBody = z.object({
  columns: z.array(
    z.object({
      status: statusEnum,
      orderedMaterialIds: z.array(z.number().int().positive()),
    }),
  ),
});

const materialIdParam = z.object({ materialId: z.coerce.number().int().positive() });

async function listPlan(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const items = await service.listPlan(req.user.userId);
  res.json({ data: items, meta: { count: items.length } });
}

async function addItem(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = addBody.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Невалідні дані');
  }
  const data = await service.addItem(
    req.user.userId,
    parsed.data.materialId,
    parsed.data.status,
  );
  res.status(201).json({ data });
}

async function reorder(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = reorderBody.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Невалідні дані');
  }
  await service.reorderPlan(req.user.userId, parsed.data.columns);
  res.status(204).send();
}

async function removeItem(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = materialIdParam.safeParse(req.params);
  if (!parsed.success) throw new ValidationError('Невалідний materialId');
  await service.removeItem(req.user.userId, parsed.data.materialId);
  res.status(204).send();
}

async function progress(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await service.getProgressByDiscipline(req.user.userId);
  res.json({ data });
}

async function badges(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await service.listBadges(req.user.userId);
  const earned = data.filter((b) => b.earned).length;
  res.json({ data, meta: { earned, total: data.length } });
}

export const planRouter = Router();

planRouter.use(authenticate);
planRouter.get('/', wrap(listPlan));
planRouter.post('/', wrap(addItem));
planRouter.patch('/reorder', wrap(reorder));
planRouter.delete('/:materialId', wrap(removeItem));
planRouter.get('/progress', wrap(progress));
planRouter.get('/badges', wrap(badges));
