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

  const someMaterial = await prisma.material.findFirst({ select: { id: true } });
  const link = someMaterial ? `/materials/${someMaterial.id}` : '/';

  // 2 непрочитаних + 1 прочитана для кожного студента
  for (const s of students) {
    await prisma.notification.createMany({
      data: [
        {
          userId: s.id,
          type: 'new_material',
          title: 'Новий матеріал: Лекція 7. Нормалізація БД',
          body: 'Трощій Юлія Георгіївна додала матеріал з дисципліни «Бази даних»',
          link,
        },
        {
          userId: s.id,
          type: 'new_material',
          title: 'Новий матеріал: Hooks та контекст у React',
          body: 'Мацак Тетяна Іванівна додала матеріал з дисципліни «Веб-технології»',
          link,
        },
        {
          userId: s.id,
          type: 'comment_on_material',
          title: 'Новий коментар до вашого матеріалу',
          body: 'Студент Іваненко прокоментував лабораторну роботу',
          link,
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
