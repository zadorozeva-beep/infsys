import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

import { authenticate } from '../../middleware/auth.middleware.js';
import { UnauthorizedError, ValidationError } from '../../utils/errors.js';
import { logMaterialEvent } from '../events/events.service.js';
import * as notifyService from '../notifications/notifications.service.js';
import * as service from './me.service.js';

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const materialIdParam = z.object({
  materialId: z.coerce.number().int().positive(),
});
const saveBody = z.object({
  materialId: z.coerce.number().int().positive(),
});
const updateProfileBody = z.object({
  fullName: z.string().min(3, 'Мінімум 3 символи').max(255).optional(),
  email: z.string().email('Невалідний email').max(255).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,32}$/, 'Невалідний номер')
    .max(32)
    .nullable()
    .optional(),
});
const changePasswordBody = z.object({
  currentPassword: z.string().min(1, 'Введіть поточний пароль'),
  newPassword: z.string().min(8, 'Мінімум 8 символів').max(128),
});

async function listSaved(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await service.listSavedMaterials(req.user.userId);
  res.json({ data, meta: { count: data.length } });
}

async function listSavedIds(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const ids = await service.listSavedIds(req.user.userId);
  res.json({ data: ids });
}

async function save(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = saveBody.safeParse(req.body);
  if (!parsed.success) throw new ValidationError('Невалідний materialId');
  await service.saveMaterial(req.user.userId, parsed.data.materialId);
  logMaterialEvent('save', parsed.data.materialId, req.user.userId);
  res.status(201).json({ data: { materialId: parsed.data.materialId, saved: true } });
}

async function unsave(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = materialIdParam.safeParse(req.params);
  if (!parsed.success) throw new ValidationError('Невалідний materialId');
  await service.unsaveMaterial(req.user.userId, parsed.data.materialId);
  logMaterialEvent('unsave', parsed.data.materialId, req.user.userId);
  res.status(204).send();
}

async function listOwn(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await service.listOwnMaterials(req.user.userId);
  res.json({ data, meta: { count: data.length } });
}

async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = updateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Невалідні дані');
  }
  const data = await service.updateProfile(req.user.userId, parsed.data);
  res.json({ data });
}

async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const parsed = changePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Невалідні дані');
  }
  await service.changePassword(
    req.user.userId,
    parsed.data.currentPassword,
    parsed.data.newPassword,
  );
  res.status(204).send();
}

async function getStats(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const data = await service.getStats(req.user.userId);
  res.json({ data });
}

async function listNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const [list, unread] = await Promise.all([
    notifyService.listForUser(req.user.userId, 30),
    notifyService.countUnread(req.user.userId),
  ]);
  res.json({ data: list, meta: { count: list.length, unread } });
}

async function markNotificationRead(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const idStr = req.params.id;
  if (typeof idStr !== 'string' || !/^\d+$/.test(idStr)) throw new ValidationError('Невалідний id');
  await notifyService.markRead(req.user.userId, BigInt(idStr));
  res.status(204).send();
}

async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  await notifyService.markAllRead(req.user.userId);
  res.status(204).send();
}

export const meRouter = Router();

meRouter.use(authenticate);
meRouter.get('/stats', wrap(getStats));
meRouter.get('/saved', wrap(listSaved));
meRouter.get('/saved/ids', wrap(listSavedIds));
meRouter.post('/saved', wrap(save));
meRouter.delete('/saved/:materialId', wrap(unsave));
meRouter.get('/materials', wrap(listOwn));
meRouter.patch('/', wrap(updateProfile));
meRouter.patch('/password', wrap(changePassword));
meRouter.get('/notifications', wrap(listNotifications));
meRouter.patch('/notifications/read-all', wrap(markAllNotificationsRead));
meRouter.patch('/notifications/:id/read', wrap(markNotificationRead));
