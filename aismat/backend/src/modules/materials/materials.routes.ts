import { Router, type NextFunction, type Request, type Response } from 'express';

import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { uploadMaterialFile } from '../../middleware/upload.middleware.js';
import * as controller from './materials.controller.js';

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export const materialsRouter = Router();

materialsRouter.get('/', wrap(controller.list));
materialsRouter.get('/:id', optionalAuth, wrap(controller.getOne));
materialsRouter.get('/:id/file', optionalAuth, wrap(controller.streamFile));

materialsRouter.get('/:id/versions', wrap(controller.listVersions));
materialsRouter.get('/:id/versions/:version/file', wrap(controller.streamVersionFile));
materialsRouter.post(
  '/:id/versions',
  authenticate,
  requireRole('teacher', 'admin'),
  uploadMaterialFile.single('file'),
  wrap(controller.createVersion),
);

materialsRouter.post(
  '/',
  authenticate,
  requireRole('teacher', 'admin'),
  uploadMaterialFile.single('file'),
  wrap(controller.create),
);

materialsRouter.patch('/:id', authenticate, wrap(controller.update));
materialsRouter.delete('/:id', authenticate, wrap(controller.remove));
