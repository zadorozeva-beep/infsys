import { Router, type NextFunction, type Request, type Response } from 'express';

import { prisma } from '../../db/prisma.js';

export const programsRouter = Router();

async function listPrograms(_req: Request, res: Response): Promise<void> {
  const data = await prisma.program.findMany({ orderBy: { name: 'asc' } });
  res.json({ data, meta: { count: data.length } });
}

programsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  listPrograms(req, res).catch(next);
});
