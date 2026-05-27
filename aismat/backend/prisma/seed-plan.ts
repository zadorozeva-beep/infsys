/**
 * Заповнює план навчання для тестових студентів — щоб одразу побачити
 * заповнений kanban-дошку та зароблені бейджі.
 *
 * Запуск:  npm run seed:plan
 */
import type { PlanStatus } from '@prisma/client';

import { prisma } from '../src/db/prisma.js';

async function main(): Promise<void> {
  const students = await prisma.user.findMany({
    where: { role: { name: 'student' } },
    select: { id: true, login: true },
    orderBy: { id: 'asc' },
  });

  const materials = await prisma.material.findMany({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  if (students.length === 0 || materials.length === 0) {
    // eslint-disable-next-line no-console
    console.error('✗ Немає студентів/матеріалів. Запустіть npm run seed.');
    process.exit(1);
  }

  // Очищаємо план для студентів
  await prisma.learningPlanItem.deleteMany({
    where: { userId: { in: students.map((s) => s.id) } },
  });

  const STATUSES: PlanStatus[] = ['todo', 'in_progress', 'done'];
  let total = 0;

  for (const student of students) {
    // Беремо випадкові 8-14 матеріалів і розкидаємо по колонках
    const shuffled = [...materials].sort(() => Math.random() - 0.5);
    const count = 8 + Math.floor(Math.random() * 7);
    const subset = shuffled.slice(0, Math.min(count, shuffled.length));

    // Позиції по колонках
    const positionCounters: Record<PlanStatus, number> = { todo: 0, in_progress: 0, done: 0 };

    for (const m of subset) {
      // Ваги: 40% todo, 25% in_progress, 35% done
      const r = Math.random();
      const status: PlanStatus = r < 0.4 ? 'todo' : r < 0.65 ? 'in_progress' : 'done';
      const pos = positionCounters[status]++;
      // Випадкова дата завершення в межах 30 днів
      const completedAt =
        status === 'done'
          ? new Date(Date.now() - Math.random() * 30 * 86_400_000)
          : null;
      await prisma.learningPlanItem.create({
        data: {
          userId: student.id,
          materialId: m.id,
          status,
          position: pos,
          completedAt,
        },
      });
      total++;
    }

    void STATUSES; // запобігаємо noUnusedLocals
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Створено ${total} елементів плану для ${students.length} студентів`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('✗ Помилка:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
