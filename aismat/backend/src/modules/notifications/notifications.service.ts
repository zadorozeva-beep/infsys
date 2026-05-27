import type { NotificationType } from '@prisma/client';

import { prisma } from '../../db/prisma.js';
import { logger } from '../../utils/logger.js';
import { emitToUsers } from '../realtime/socket.js';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

export interface PublicNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

function serialize(n: {
  id: bigint;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}): PublicNotification {
  return {
    id: n.id.toString(),
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function listForUser(userId: number, limit = 30): Promise<PublicNotification[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(serialize);
}

export async function countUnread(userId: number): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markRead(userId: number, id: bigint): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: number): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

/**
 * Створює нотифікацію для багатьох користувачів (bulk) і одразу
 * шле realtime-подію 'notification:new' через socket.io.
 */
export async function notifyUsers(
  userIds: number[],
  payload: NotificationPayload,
): Promise<void> {
  if (userIds.length === 0) return;

  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        link: payload.link ?? null,
      })),
    });
  } catch (err) {
    logger.warn(`Failed to persist notifications: ${(err as Error).message}`);
    return;
  }

  // Real-time emit — без id (клієнт сам перезавантажить список або просто покаже toast)
  emitToUsers(userIds, 'notification:new', {
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
    link: payload.link ?? null,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Викликається при створенні нового матеріалу — оповіщає всіх студентів.
 * Анти-спам: автора матеріалу не оповіщаємо.
 */
export async function notifyStudentsOnNewMaterial(material: {
  id: number;
  title: string;
  authorId: number;
  discipline: { name: string };
  author: { fullName: string };
}): Promise<void> {
  const students = await prisma.user.findMany({
    where: {
      role: { name: 'student' },
      id: { not: material.authorId },
    },
    select: { id: true },
  });
  const userIds = students.map((s) => s.id);

  await notifyUsers(userIds, {
    type: 'new_material',
    title: `Новий матеріал: ${material.title}`,
    body: `${material.author.fullName} додав матеріал з дисципліни «${material.discipline.name}»`,
    link: `/materials/${material.id}`,
  });
}
