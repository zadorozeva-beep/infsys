import { Router, type NextFunction, type Request, type Response } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import * as controller from './disciplines.controller.js';

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export const disciplinesRouter = Router();

disciplinesRouter.get('/', wrap(controller.list));
disciplinesRouter.get('/:id', wrap(controller.getOne));
disciplinesRouter.post('/', authenticate, requireRole('admin'), wrap(controller.create));
disciplinesRouter.patch('/:id', authenticate, requireRole('admin'), wrap(controller.update));
disciplinesRouter.delete('/:id', authenticate, requireRole('admin'), wrap(controller.remove));
