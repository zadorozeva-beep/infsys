import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export type Role = 'admin' | 'teacher' | 'student';

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!allowed.includes(req.user.role as Role)) {
      throw new ForbiddenError('Дія доступна лише для ролей: ' + allowed.join(', '));
    }
    next();
  };
}
