/**
 * Створює тестову історію версій для перших декількох матеріалів —
 * щоб у /materials/:id/versions одразу можна було показати реальну історію змін.
 *
 * Запуск:  npm run seed:versions
 */
import { prisma } from '../src/db/prisma.js';

const VERSION_NOTES = [
  'Виправлено опечатки на слайдах 7–10',
  'Оновлено приклади під TypeScript 5.4',
  'Додано розділ про edge-cases',
  'Розширено опис, додано посилання на джерела',
];

async function main(): Promise<void> {
  const materials = await prisma.material.findMany({
    where: { deletedAt: null },
    orderBy: { id: 'asc' },
    take: 5,
    select: { id: true, title: true, description: true, fileUrl: true, fileSize: true, mimeType: true, authorId: true, currentVersion: true },
  });

  if (materials.length === 0) {
    // eslint-disable-next-line no-console
    console.error('✗ Немає матеріалів. Запустіть npm run seed.');
    process.exit(1);
  }

  let created = 0;
  for (const m of materials) {
    // Створимо 1-2 додаткові версії для кожного з перших 5 матеріалів
    const extraVersions = 1 + Math.floor(Math.random() * 2);

    for (let i = 0; i < extraVersions; i++) {
      const nextVersion = m.currentVersion + 1;
      const note = VERSION_NOTES[Math.floor(Math.random() * VERSION_NOTES.length)] ?? null;
      const newSize = BigInt(Math.max(100, Number(m.fileSize) + Math.floor(Math.random() * 5000) - 2000));

      const newTitle =
        i === 0 && Math.random() < 0.4
          ? `${m.title} (оновлено)`
          : m.title;

      await prisma.$transaction([
        prisma.materialVersion.create({
          data: {
            materialId: m.id,
            version: nextVersion,
            title: newTitle,
            description: m.description,
            fileUrl: m.fileUrl,
            fileSize: newSize,
            mimeType: m.mimeType,
            uploadedBy: m.authorId,
            changeNote: note,
            createdAt: new Date(Date.now() - i * 86_400_000),
          },
        }),
        prisma.material.update({
          where: { id: m.id },
          data: {
            title: newTitle,
            fileSize: newSize,
            currentVersion: nextVersion,
          },
        }),
      ]);

      // Оновимо локальний стан для наступної ітерації
      m.currentVersion = nextVersion;
      m.title = newTitle;
      m.fileSize = newSize;
      created++;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Створено ${created} додаткових версій для ${materials.length} матеріалів`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('✗ Помилка:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
