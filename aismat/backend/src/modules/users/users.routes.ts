import { Router, type NextFunction, type Request, type Response } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { idParamSchema, updateRoleSchema } from './users.schemas.js';
import * as service from './users.service.js';

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

async function list(_req: Request, res: Response): Promise<void> {
  const data = await service.listUsers();
  res.json({ data, meta: { count: data.length } });
}

async function updateRole(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const { role } = updateRoleSchema.parse(req.body);
  const data = await service.updateRole(id, role);
  res.json({ data });
}

async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { id } = idParamSchema.parse(req.params);
  await service.deleteUser(id, req.user.userId);
  res.status(204).send();
}

export const usersRouter = Router();

usersRouter.use(authenticate, requireRole('admin'));
usersRouter.get('/', wrap(list));
usersRouter.patch('/:id/role', wrap(updateRole));
usersRouter.delete('/:id', wrap(remove));
