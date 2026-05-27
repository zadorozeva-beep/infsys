import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

import { authenticate } from '../../middleware/auth.middleware.js';
import { UnauthorizedError, ValidationError } from '../../utils/errors.js';
import { emitToMaterial } from '../realtime/socket.js';
import * as service from './comments.service.js';

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const materialIdParam = z.object({ materialId: z.coerce.number().int().positive() });
const idParam = z.object({ id: z.coerce.number().int().positive() });
const createBody = z.object({
  content: z.string().trim().min(1, 'Коментар не може бути порожнім').max(2000, 'Максимум 2000 символів'),
});

async function list(req: Request, res: Response): Promise<void> {
  const { materialId } = materialIdParam.parse(req.params);
  const data = await service.listComments(materialId);
  res.json({ data, meta: { count: data.length } });
}

async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { materialId } = materialIdParam.parse(req.params);
  const parsed = createBody.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Невалідний коментар');
  }
  const comment = await service.createComment(materialId, req.user.userId, parsed.data.content);

  // Broadcast у кімнату матеріалу — всі підписані клієнти отримають подію
  emitToMaterial(materialId, 'comment:new', comment);

  res.status(201).json({ data: comment });
}

async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { id } = idParam.parse(req.params);
  const { materialId } = await service.deleteComment(id, req.user.userId, req.user.role);

  emitToMaterial(materialId, 'comment:delete', { id, materialId });

  res.status(204).send();
}

// Маршрутизатор для /api/materials/:materialId/comments
export const materialCommentsRouter = Router({ mergeParams: true });
materialCommentsRouter.get('/', wrap(list));
materialCommentsRouter.post('/', authenticate, wrap(create));

// Маршрутизатор для /api/comments/:id (видалення)
export const commentsRouter = Router();
commentsRouter.delete('/:id', authenticate, wrap(remove));
