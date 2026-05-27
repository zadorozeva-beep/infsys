import type { Request, Response } from 'express';

import { UnauthorizedError } from '../../utils/errors.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const result = await authService.registerStudent(input);
  res.status(201).json({ data: result });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.status(200).json({ data: result });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError();
  const user = await authService.getMe(req.user.userId);
  res.status(200).json({ data: user });
}
