import type { Server as HTTPServer } from 'node:http';

import { Server, type Socket } from 'socket.io';

import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { verifyToken } from '../../utils/jwt.js';

interface AuthedSocket extends Socket {
  data: {
    userId: number;
    role: string;
  };
}

let io: Server | null = null;

export function initSocketServer(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  // JWT-handshake middleware
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);
    if (!token) {
      next(new Error('No auth token'));
      return;
    }
    try {
      const payload = verifyToken(token);
      (socket as AuthedSocket).data.userId = payload.userId;
      (socket as AuthedSocket).data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthedSocket;
    const { userId, role } = socket.data;
    logger.info(`WS connect user=${userId} role=${role} socketId=${socket.id}`);

    // Особиста кімната — для нотифікацій
    socket.join(`user:${userId}`);

    // Приєднатись до кімнати матеріалу (для коментарів)
    socket.on('material:join', (materialId: unknown) => {
      const id = Number(materialId);
      if (Number.isFinite(id) && id > 0) {
        socket.join(`material:${id}`);
      }
    });

    socket.on('material:leave', (materialId: unknown) => {
      const id = Number(materialId);
      if (Number.isFinite(id) && id > 0) {
        socket.leave(`material:${id}`);
      }
    });

    // Індикатор «друкує...» — broadcast у кімнату матеріалу (не зберігається)
    socket.on('comment:typing', (materialId: unknown, fullName: unknown) => {
      const id = Number(materialId);
      if (!Number.isFinite(id) || id <= 0) return;
      socket.to(`material:${id}`).emit('comment:typing', {
        userId,
        fullName: typeof fullName === 'string' ? fullName : '',
      });
    });

    socket.on('disconnect', () => {
      logger.info(`WS disconnect user=${userId} socketId=${socket.id}`);
    });
  });

  logger.info('Socket.IO сервер ініціалізовано на /socket.io');
  return io;
}

export function getIo(): Server {
  if (!io) throw new Error('Socket.IO не ініціалізовано. Викличте initSocketServer() першим.');
  return io;
}

// Утилітарні методи для emit з REST-handlers

export function emitToMaterial(materialId: number, event: string, payload: unknown): void {
  io?.to(`material:${materialId}`).emit(event, payload);
}

export function emitToUser(userId: number, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToUsers(userIds: number[], event: string, payload: unknown): void {
  if (!io || userIds.length === 0) return;
  const rooms = userIds.map((id) => `user:${id}`);
  io.to(rooms).emit(event, payload);
}
