import type { MaterialEventType } from '@prisma/client';

import { prisma } from '../../db/prisma.js';
import { logger } from '../../utils/logger.js';

/**
 * Логує подію матеріалу (view/download/save/unsave). Fire-and-forget — не блокує запит.
 * userId = null для анонімних користувачів (наприклад, перегляд без логіну).
 */
export function logMaterialEvent(
  eventType: MaterialEventType,
  materialId: number,
  userId: number | null,
): void {
  prisma.materialEvent
    .create({ data: { eventType, materialId, userId } })
    .catch((err: unknown) => {
      logger.warn(
        `materialEvent log failed (${eventType} #${materialId}): ${(err as Error).message}`,
      );
    });
}
