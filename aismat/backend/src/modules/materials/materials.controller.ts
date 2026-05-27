import type { Request, Response } from 'express';

import { UnauthorizedError, ValidationError } from '../../utils/errors.js';
import { logMaterialEvent } from '../events/events.service.js';
import { notifyStudentsOnNewMaterial } from '../notifications/notifications.service.js';
import {
  createMaterialBodySchema,
  createVersionBodySchema,
  idParamSchema,
  listMaterialsQuerySchema,
  updateMaterialBodySchema,
  versionParamSchema,
} from './materials.schemas.js';
import * as service from './materials.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const query = listMaterialsQuerySchema.parse(req.query);
  const result = await service.listMaterials(query);
  res.json(result);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const data = await service.getMaterial(id);
  logMaterialEvent('view', id, req.user?.userId ?? null);
  res.json({ data });
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  if (!req.file) throw new ValidationError('Файл обов’язковий');
  const body = createMaterialBodySchema.parse(req.body);
  const data = await service.createMaterial(req.user.userId, body, {
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  // Fire-and-forget: оповіщення студентів про новий матеріал
  notifyStudentsOnNewMaterial(data).catch(() => {
    /* помилка вже залогована всередині notifyUsers */
  });

  res.status(201).json({ data });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { id } = idParamSchema.parse(req.params);
  const body = updateMaterialBodySchema.parse(req.body);
  const data = await service.updateMaterial(id, req.user.userId, req.user.role, body);
  res.json({ data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const { id } = idParamSchema.parse(req.params);
  await service.deleteMaterial(id, req.user.userId, req.user.role);
  res.status(204).send();
}

export async function streamFile(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const file = await service.getMaterialFileForStream(id);
  logMaterialEvent('download', id, req.user?.userId ?? null);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
  res.sendFile(file.absolutePath);
}

export async function listVersions(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const data = await service.listMaterialVersions(id);
  res.json({ data });
}

export async function createVersion(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  if (!req.file) throw new ValidationError('Файл обов’язковий');
  const { id } = idParamSchema.parse(req.params);
  const body = createVersionBodySchema.parse(req.body);
  const data = await service.createMaterialVersion(id, req.user.userId, req.user.role, body, {
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
  res.status(201).json({ data });
}

export async function streamVersionFile(req: Request, res: Response): Promise<void> {
  const { id, version } = versionParamSchema.parse(req.params);
  const file = await service.getVersionFileForStream(id, version);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
  res.sendFile(file.absolutePath);
}
