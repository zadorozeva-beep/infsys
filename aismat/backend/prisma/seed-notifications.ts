/**
 * Створює тестові нотифікації для всіх студентів,
 * щоб одразу побачити дзвіночок з лічильником у navbar.
 *
 * Запуск:  npm run seed:notifications
 */
import { prisma } from '../src/db/prisma.js';

async function main(): Promise<void> {
  const students = await prisma.user.findMany({
    where: { role: { name: 'student' } },
    select: { id: true },
  });

  if (students.length === 0) {
    // eslint-disable-next-line no-console
    console.error('✗ Немає студентів. Спершу запустіть npm run seed.');
    process.exit(1);
  }

  // Беремо кілька реальних матеріалів, щоб сповіщення вели на різні сторінки
  const materials = await prisma.material.findMany({
    select: { id: true, title: true },
    orderBy: { id: 'asc' },
    take: 10,
  });
  const linkFor = (i: number): string =>
    materials.length > 0 ? `/materials/${materials[i % materials.length]!.id}` : '/';

  // Кілька непрочитаних + 1 прочитана для кожного студента.
  // Теми охоплюють як старі, так і нові дисципліни (мережі, безпека, Docker, тестування).
  for (const s of students) {
    await prisma.notification.createMany({
      data: [
        {
          userId: s.id,
          type: 'new_material',
          title: 'Новий матеріал: Нормалізація реляційних баз даних',
          body: 'Трощій Юлія Георгіївна додала матеріал з дисципліни «Бази даних»',
          link: linkFor(0),
        },
        {
          userId: s.id,
          type: 'new_material',
          title: 'Новий матеріал: Контейнеризація застосунків із Docker',
          body: 'Савченко Ірина Володимирівна додала матеріал з дисципліни «Операційні системи»',
          link: linkFor(1),
        },
        {
          userId: s.id,
          type: 'new_material',
          title: 'Новий матеріал: Найпоширеніші вразливості веб-застосунків (OWASP Top 10)',
          body: 'Кудінович Дмитро Петрович додав матеріал з дисципліни «Безпека програмного забезпечення»',
          link: linkFor(2),
        },
        {
          userId: s.id,
          type: 'new_material',
          title: 'Новий матеріал: Модель OSI та стек протоколів TCP/IP',
          body: 'Савченко Ірина Володимирівна додала матеріал з дисципліни «Комп’ютерні мережі»',
          link: linkFor(3),
        },
        {
          userId: s.id,
          type: 'comment_on_material',
          title: 'Новий коментар до вашого матеріалу',
          body: 'Студент Ткаченко прокоментував лабораторну роботу з тестування на Vitest',
          link: linkFor(4),
          readAt: new Date(),
        },
      ],
    });
  }

  const total = await prisma.notification.count();
  // eslint-disable-next-line no-console
  console.log(`✓ Згенеровано нотифікації для ${students.length} студентів. Всього у БД: ${total}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('✗ Помилка:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
