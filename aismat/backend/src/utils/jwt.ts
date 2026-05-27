import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env.js';
import { UnauthorizedError } from './errors.js';

export interface JwtPayload {
  userId: number;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !decoded) {
      throw new UnauthorizedError('Невалідний токен');
    }
    const payload = decoded as jwt.JwtPayload;
    if (typeof payload.userId !== 'number' || typeof payload.role !== 'string') {
      throw new UnauthorizedError('Невалідний токен');
    }
    return { userId: payload.userId, role: payload.role };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Невалідний або прострочений токен');
  }
}
