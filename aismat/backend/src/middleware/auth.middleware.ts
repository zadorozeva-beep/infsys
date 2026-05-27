import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../utils/errors.js';
import { verifyToken } from '../utils/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { userId: number; role: string };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Відсутній або некоректний заголовок Authorization');
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new UnauthorizedError('Порожній токен');
  }
  const payload = verifyToken(token);
  req.user = payload;
  next();
}

/**
 * Заповнює req.user якщо є валідний токен, але не блокує запит при його відсутності
 * або невалідному форматі. Корисно для публічних endpoints, які хочуть знати userId.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    if (token) {
      try {
        req.user = verifyToken(token);
      } catch {
        // Тихо ігноруємо — це необов'язкова автентифікація
      }
    }
  }
  next();
}
