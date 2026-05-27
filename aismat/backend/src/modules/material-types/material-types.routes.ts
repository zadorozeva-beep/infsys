import { Router, type NextFunction, type Request, type Response } from 'express';

import { prisma } from '../../db/prisma.js';

export const materialTypesRouter = Router();

async function listTypes(_req: Request, res: Response): Promise<void> {
  const data = await prisma.materialType.findMany({ orderBy: { name: 'asc' } });
  res.json({ data, meta: { count: data.length } });
}

materialTypesRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  listTypes(req, res).catch(next);
});
