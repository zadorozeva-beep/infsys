/**
 * Standalone-скрипт генерації демо-подій для admin-аналітики.
 * Створює правдоподібний журнал переглядів/завантажень/збережень
 * за останні 60 днів з реалістичним розподілом по днях тижня та годинах.
 *
 * Запуск:  npm run seed:events
 */
import type { MaterialEventType } from '@prisma/client';

import { prisma } from '../src/db/prisma.js';

const DAYS = 60;
const EVENTS_PER_DAY_MIN = 50;
const EVENTS_PER_DAY_MAX = 250;

// Розподіл типів подій (приблизна "воронка")
const EVENT_DISTRIBUTION: { type: MaterialEventType; weight: number }[] = [
  { type: 'view', weight: 70 },
  { type: 'download', weight: 20 },
  { type: 'save', weight: 8 },
  { type: 'unsave', weight: 2 },
];

// Ваги активності за днем тижня (0=пн, 6=нд) — будні активніше за вихідні
const DOW_WEIGHTS = [1.1, 1.2, 1.3, 1.2, 1.0, 0.4, 0.3];

// Ваги активності за годиною (0–23) — піки навчального дня
const HOUR_WEIGHTS = [
  0.1, 0.05, 0.05, 0.05, 0.05, 0.1, 0.3, 0.6, 1.0, 1.3, 1.5, 1.4, 1.0, 1.3, 1.5, 1.4, 1.3, 1.1, 0.9,
  0.7, 0.5, 0.4, 0.3, 0.2,
];

function pickWeighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[0]!.value;
}

function pickHour(): number {
  return pickWeighted(HOUR_WEIGHTS.map((w, i) => ({ value: i, weight: w })));
}

function pickEventType(): MaterialEventType {
  return pickWeighted(EVENT_DISTRIBUTION.map((e) => ({ value: e.type, weight: e.weight })));
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('▶ Генерація демо-подій для аналітики...');

  const users = await prisma.user.findMany({ select: { id: true } });
  const materials = await prisma.material.findMany({ select: { id: true } });

  if (users.length === 0 || materials.length === 0) {
    // eslint-disable-next-line no-console
    console.error('✗ Немає користувачів або матеріалів. Спершу запустіть npm run seed.');
    process.exit(1);
  }

  // Прибираємо попередні згенеровані події (повторний запуск — чисто)
  const deleted = await prisma.materialEvent.deleteMany();
  // eslint-disable-next-line no-console
  console.log(`  Видалено старих подій: ${deleted.count}`);

  const events: Array<{
    userId: number | null;
    materialId: number;
    eventType: MaterialEventType;
    createdAt: Date;
  }> = [];

  const now = new Date();

  for (let d = DAYS - 1; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const dow = (day.getDay() + 6) % 7; // 0 = понеділок
    const dowWeight = DOW_WEIGHTS[dow] ?? 1;
    const dayEventCount = Math.round(
      (EVENTS_PER_DAY_MIN + Math.random() * (EVENTS_PER_DAY_MAX - EVENTS_PER_DAY_MIN)) * dowWeight,
    );

    for (let i = 0; i < dayEventCount; i++) {
      const hour = pickHour();
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      const ts = new Date(day);
      ts.setHours(hour, minute, second, 0);

      const eventType = pickEventType();
      const material = materials[Math.floor(Math.random() * materials.length)]!;
      // 80% подій — від залогінених, 20% — анонімні view
      const anonymous = eventType === 'view' && Math.random() < 0.2;
      const userId = anonymous ? null : users[Math.floor(Math.random() * users.length)]!.id;

      events.push({
        userId,
        materialId: material.id,
        eventType,
        createdAt: ts,
      });
    }
  }

  // Batch insert (Prisma createMany — швидко)
  const batchSize = 1000;
  for (let i = 0; i < events.length; i += batchSize) {
    await prisma.materialEvent.createMany({
      data: events.slice(i, i + batchSize),
      skipDuplicates: false,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Згенеровано подій: ${events.length} за ${DAYS} днів`);

  // Синхронізуємо download_count у materials з реальною кількістю download-подій
  await prisma.$executeRaw`
    UPDATE materials m SET download_count = COALESCE(s.cnt, 0)
    FROM (
      SELECT material_id, COUNT(*)::int AS cnt
      FROM material_events WHERE event_type = 'download'
      GROUP BY material_id
    ) s
    WHERE m.id = s.material_id
  `;
  // eslint-disable-next-line no-console
  console.log('✓ Синхронізовано materials.download_count з журналом подій');

  // Синхронізуємо saved_materials з останніми save-подіями (щоб збережені бачилися у профілі)
  // Беремо для кожного (user, material) ОСТАННЮ подію — save чи unsave — і вирішуємо
  await prisma.savedMaterial.deleteMany();
  await prisma.$executeRaw`
    INSERT INTO saved_materials (user_id, material_id, saved_at)
    SELECT DISTINCT ON (user_id, material_id) user_id, material_id, created_at
    FROM material_events
    WHERE event_type IN ('save', 'unsave') AND user_id IS NOT NULL
    ORDER BY user_id, material_id, created_at DESC
  `;
  // Видаляємо рядки, де остання дія була 'unsave'
  await prisma.$executeRaw`
    DELETE FROM saved_materials sm
    WHERE EXISTS (
      SELECT 1 FROM material_events e
      WHERE e.user_id = sm.user_id
        AND e.material_id = sm.material_id
        AND e.event_type = 'unsave'
        AND e.created_at = sm.saved_at
    )
  `;
  // eslint-disable-next-line no-console
  console.log('✓ Синхронізовано saved_materials з журналом подій');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('✗ Помилка:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
