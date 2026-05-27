import { Router, type NextFunction, type Request, type Response } from 'express';

import { prisma } from '../../db/prisma.js';

export const tagsRouter = Router();

async function listTags(_req: Request, res: Response): Promise<void> {
  const data = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
  res.json({ data, meta: { count: data.length } });
}

tagsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  listTags(req, res).catch(next);
});
