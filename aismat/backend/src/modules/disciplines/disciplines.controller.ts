import type { Request, Response } from 'express';

import {
  createDisciplineSchema,
  idParamSchema,
  updateDisciplineSchema,
} from './disciplines.schemas.js';
import * as service from './disciplines.service.js';

export async function list(_req: Request, res: Response): Promise<void> {
  const data = await service.listDisciplines();
  res.json({ data, meta: { count: data.length } });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const data = await service.getDiscipline(id);
  res.json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createDisciplineSchema.parse(req.body);
  const data = await service.createDiscipline(input);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const input = updateDisciplineSchema.parse(req.body);
  const data = await service.updateDiscipline(id, input);
  res.json({ data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  await service.deleteDiscipline(id);
  res.status(204).send();
}
