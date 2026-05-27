import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BCRYPT_ROUNDS = 12;
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');
const PLACEHOLDER_FILENAME = 'seed-placeholder.pdf';

// Мінімальний валідний PDF (~1 KB) — використовується як заглушка для seed-матеріалів.
const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 100 700 Td (AISMAT seed placeholder) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000095 00000 n
0000000175 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
260
%%EOF
`;

async function ensurePlaceholderFile(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const target = path.join(UPLOAD_DIR, PLACEHOLDER_FILENAME);
  try {
    await fs.access(target);
  } catch {
    await fs.writeFile(target, MINIMAL_PDF, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`  Створено заглушку файлу: ${target}`);
  }
}

async function applySearchVectorSql(): Promise<void> {
  const sqlPath = path.resolve(__dirname, 'sql', 'add_search_vector.sql');
  const raw = await fs.readFile(sqlPath, 'utf8');
  // Прибрати рядкові коментарі -- (не торкаючись вмісту $$...$$).
  const stripped = raw
    .split('\n')
    .map((line) => line.replace(/^\s*--.*$/, ''))
    .join('\n');
  // Розбиваємо на statement-и по ';', враховуючи dollar-quoted блоки.
  const statements: string[] = [];
  let buf = '';
  let inDollar = false;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === '$' && stripped[i + 1] === '$') {
      inDollar = !inDollar;
      buf += '$$';
      i++;
      continue;
    }
    if (ch === ';' && !inDollar) {
      const stmt = buf.trim();
      if (stmt) statements.push(stmt);
      buf = '';
      continue;
    }
    buf += ch;
  }
  const tail = buf.trim();
  if (tail) statements.push(tail);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
}

const ROLES = [
  { name: 'admin', description: 'Адміністратор системи' },
  { name: 'teacher', description: 'Викладач' },
  { name: 'student', description: 'Студент' },
];

const MATERIAL_TYPES = [
  { name: 'Лекція', icon: 'book-open' },
  { name: 'Методичні рекомендації', icon: 'file-text' },
  { name: 'Лабораторна робота', icon: 'flask-conical' },
  { name: 'Презентація', icon: 'presentation' },
  { name: 'Тест', icon: 'clipboard-check' },
];

const TAGS = [
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'PostgreSQL', slug: 'postgresql' },
  { name: 'React', slug: 'react' },
  { name: 'SQL', slug: 'sql' },
  { name: 'Normalization', slug: 'normalization' },
  { name: 'REST API', slug: 'rest-api' },
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'HTML', slug: 'html' },
  { name: 'CSS', slug: 'css' },
  { name: 'OOP', slug: 'oop' },
  { name: 'Algorithms', slug: 'algorithms' },
  { name: 'Prisma', slug: 'prisma' },
];

const TEACHERS = [
  {
    login: 'troschiy',
    fullName: 'Трощій Юлія Георгіївна',
    email: 'troschiy@example.com',
    phone: '+380501112233',
  },
  {
    login: 'matsak',
    fullName: 'Мацак Тетяна Іванівна',
    email: 'matsak@example.com',
    phone: '+380502223344',
  },
  {
    login: 'kudinovych',
    fullName: 'Кудінович Дмитро Петрович',
    email: 'kudinovych@example.com',
    phone: '+380503334455',
  },
];

const STUDENTS = [
  { login: 'student1', fullName: 'Бондаренко Анна Сергіївна', email: 'a.bondarenko@example.com' },
  { login: 'student2', fullName: 'Коваленко Олег Петрович', email: 'o.kovalenko@example.com' },
  { login: 'student3', fullName: 'Шевченко Марія Іванівна', email: 'm.shevchenko@example.com' },
  { login: 'student4', fullName: 'Іваненко Денис Андрійович', email: 'd.ivanenko@example.com' },
  { login: 'student5', fullName: 'Петренко Софія Олександрівна', email: 's.petrenko@example.com' },
];

const PROGRAM = {
  name: 'Інженерія програмного забезпечення',
  code: '121',
  qualificationLevel: 'Фаховий молодший бакалавр',
  durationYears: 3.5,
};

const DISCIPLINES = [
  { name: 'Основи програмної інженерії', code: 'SE-101', credits: 5, semester: 1 },
  { name: 'Бази даних', code: 'DB-201', credits: 6, semester: 3 },
  { name: 'Веб-технології', code: 'WEB-301', credits: 5.5, semester: 4 },
  { name: 'Алгоритми та структури даних', code: 'ALG-202', credits: 6, semester: 2 },
  { name: 'Об’єктно-орієнтоване програмування', code: 'OOP-202', credits: 6, semester: 2 },
];

const MATERIAL_SEEDS: Array<{
  title: string;
  description: string;
  disciplineCode: string;
  typeName: string;
  tagSlugs: string[];
}> = [
  {
    title: 'Вступ до TypeScript: типи та інтерфейси',
    description:
      'Лекція охоплює базові концепції TypeScript: примітивні типи, інтерфейси, generics та практичні приклади їх використання у фронтенд-розробці.',
    disciplineCode: 'WEB-301',
    typeName: 'Лекція',
    tagSlugs: ['typescript', 'javascript'],
  },
  {
    title: 'Робота з PostgreSQL через Prisma ORM',
    description:
      'Практичний посібник з підключення PostgreSQL до Node.js застосунку за допомогою Prisma: schema, migrate, queryRaw.',
    disciplineCode: 'DB-201',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['postgresql', 'prisma', 'sql'],
  },
  {
    title: 'Нормалізація реляційних баз даних',
    description:
      'Огляд нормальних форм 1НФ–5НФ, приклади декомпозиції відношень, типові помилки проєктування.',
    disciplineCode: 'DB-201',
    typeName: 'Лекція',
    tagSlugs: ['sql', 'normalization', 'postgresql'],
  },
  {
    title: 'React Hooks: useState, useEffect, useMemo',
    description:
      'Презентація з прикладами використання React Hooks для керування станом і побічними ефектами компонентів.',
    disciplineCode: 'WEB-301',
    typeName: 'Презентація',
    tagSlugs: ['react', 'javascript'],
  },
  {
    title: 'Лабораторна робота №1: створення REST API на Express',
    description:
      'Завдання передбачає створення CRUD-API для управління користувачами з використанням Express, Zod-валідації та JWT-автентифікації.',
    disciplineCode: 'WEB-301',
    typeName: 'Лабораторна робота',
    tagSlugs: ['rest-api', 'javascript', 'typescript'],
  },
  {
    title: 'Сортування масивів: швидке, злиттям, купою',
    description:
      'Аналіз асимптотичної складності та реалізації трьох ключових алгоритмів сортування на TypeScript.',
    disciplineCode: 'ALG-202',
    typeName: 'Лекція',
    tagSlugs: ['algorithms', 'typescript'],
  },
  {
    title: 'Тест із основ OOP: інкапсуляція, спадковість, поліморфізм',
    description:
      'Контрольний тест із 20 запитань для перевірки розуміння базових принципів об’єктно-орієнтованого програмування.',
    disciplineCode: 'OOP-202',
    typeName: 'Тест',
    tagSlugs: ['oop', 'javascript'],
  },
  {
    title: 'Адаптивна верстка з Tailwind CSS',
    description:
      'Методичка з прикладами адаптивної верстки за допомогою utility-first підходу Tailwind CSS та responsive-модифікаторів.',
    disciplineCode: 'WEB-301',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['css', 'html', 'react'],
  },
  {
    title: 'Принципи SOLID на прикладах TypeScript',
    description:
      'Розбір п’яти принципів SOLID із демонстрацією рефакторингу типових антипатернів у код, що відповідає принципам.',
    disciplineCode: 'OOP-202',
    typeName: 'Лекція',
    tagSlugs: ['oop', 'typescript'],
  },
  {
    title: 'Графи: BFS, DFS та найкоротші шляхи',
    description:
      'Презентація з візуалізацією алгоритмів обходу графів та пошуку найкоротших шляхів (Дейкстра, Беллман–Форд).',
    disciplineCode: 'ALG-202',
    typeName: 'Презентація',
    tagSlugs: ['algorithms'],
  },
  {
    title: 'Лабораторна робота №2: SQL-запити з JOIN та агрегацією',
    description:
      'Практичне завдання з написання SQL-запитів із використанням INNER JOIN, LEFT JOIN, GROUP BY та віконних функцій.',
    disciplineCode: 'DB-201',
    typeName: 'Лабораторна робота',
    tagSlugs: ['sql', 'postgresql'],
  },
  {
    title: 'Основи методології Scrum у програмній інженерії',
    description:
      'Лекція про роль Scrum-команди, події та артефакти спринту, типові помилки при впровадженні методології.',
    disciplineCode: 'SE-101',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Контроль версій із Git: гілки, merge, rebase',
    description:
      'Методичка з типовими сценаріями роботи з Git: створення гілок, злиття, розв’язання конфліктів, інтерактивний rebase.',
    disciplineCode: 'SE-101',
    typeName: 'Методичні рекомендації',
    tagSlugs: [],
  },
  {
    title: 'Тест із Web-технологій: HTML, CSS, DOM',
    description:
      'Контрольний тест для перевірки знань структури HTML-документа, селекторів CSS та маніпуляцій DOM через JavaScript.',
    disciplineCode: 'WEB-301',
    typeName: 'Тест',
    tagSlugs: ['html', 'css', 'javascript'],
  },
  {
    title: 'Зв’язок один-до-багатьох і багато-до-багатьох у Prisma',
    description:
      'Огляд моделювання реляційних зв’язків у Prisma schema з прикладами user-posts та tags-posts через проміжну таблицю.',
    disciplineCode: 'DB-201',
    typeName: 'Лекція',
    tagSlugs: ['prisma', 'postgresql', 'typescript'],
  },
  {
    title: 'Динамічне програмування: класичні задачі',
    description:
      'Лекція з аналізом задач рюкзака, найдовшої спільної підпослідовності та оптимального шляху на сітці.',
    disciplineCode: 'ALG-202',
    typeName: 'Лекція',
    tagSlugs: ['algorithms', 'typescript'],
  },
  {
    title: 'Презентація: дизайн REST API за принципами Richardson Maturity Model',
    description:
      'Презентація з прикладами проєктування ресурсо-орієнтованого REST API, рівнів зрілості та коректного використання HTTP-методів.',
    disciplineCode: 'WEB-301',
    typeName: 'Презентація',
    tagSlugs: ['rest-api'],
  },
  {
    title: 'Лабораторна робота №3: React-компоненти з типобезпекою',
    description:
      'Завдання передбачає створення набору React-компонентів із суворою типізацією props через TypeScript та використання TanStack Query.',
    disciplineCode: 'WEB-301',
    typeName: 'Лабораторна робота',
    tagSlugs: ['react', 'typescript'],
  },
  {
    title: 'Транзакції та рівні ізоляції у PostgreSQL',
    description:
      'Лекція про ACID-властивості, рівні ізоляції READ COMMITTED / REPEATABLE READ / SERIALIZABLE та типові аномалії.',
    disciplineCode: 'DB-201',
    typeName: 'Лекція',
    tagSlugs: ['postgresql', 'sql'],
  },
  {
    title: 'Інкапсуляція та модифікатори доступу',
    description:
      'Методичка з прикладами public/protected/private у TypeScript-класах, гетери та сетери, readonly-поля.',
    disciplineCode: 'OOP-202',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['oop', 'typescript'],
  },
];

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('▶ Старт seed...');

  await ensurePlaceholderFile();

  // 0. FTS-bootstrap (extensions + trigger + index). Ідемпотентно.
  // eslint-disable-next-line no-console
  console.log('▶ Налаштовую повнотекстовий пошук (unaccent, pg_trgm, trigger, GIN-індекс)...');
  await applySearchVectorSql();

  // 1. Ролі
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }

  // 2. Типи матеріалів
  for (const t of MATERIAL_TYPES) {
    await prisma.materialType.upsert({
      where: { name: t.name },
      update: { icon: t.icon },
      create: t,
    });
  }

  // 3. Теги
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
  }

  // 4. Адмін
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
  const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: 'teacher' } });
  const studentRole = await prisma.role.findUniqueOrThrow({ where: { name: 'student' } });

  const adminPasswordHash = await bcrypt.hash('Admin123!', BCRYPT_ROUNDS);
  await prisma.user.upsert({
    where: { login: 'admin' },
    update: {
      fullName: 'Адміністратор Системи',
      email: 'admin@example.com',
      roleId: adminRole.id,
    },
    create: {
      login: 'admin',
      passwordHash: adminPasswordHash,
      fullName: 'Адміністратор Системи',
      email: 'admin@example.com',
      roleId: adminRole.id,
    },
  });

  // 5. Викладачі
  const teacherPasswordHash = await bcrypt.hash('Teacher123!', BCRYPT_ROUNDS);
  const teachers = [];
  for (const t of TEACHERS) {
    const teacher = await prisma.user.upsert({
      where: { login: t.login },
      update: { fullName: t.fullName, email: t.email, phone: t.phone, roleId: teacherRole.id },
      create: {
        login: t.login,
        passwordHash: teacherPasswordHash,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone,
        roleId: teacherRole.id,
      },
    });
    teachers.push(teacher);
  }

  // 6. Студенти
  const studentPasswordHash = await bcrypt.hash('Student123!', BCRYPT_ROUNDS);
  for (const s of STUDENTS) {
    await prisma.user.upsert({
      where: { login: s.login },
      update: { fullName: s.fullName, email: s.email, roleId: studentRole.id },
      create: {
        login: s.login,
        passwordHash: studentPasswordHash,
        fullName: s.fullName,
        email: s.email,
        roleId: studentRole.id,
      },
    });
  }

  // 7. Програма
  const program = await prisma.program.upsert({
    where: { code: PROGRAM.code },
    update: {
      name: PROGRAM.name,
      qualificationLevel: PROGRAM.qualificationLevel,
      durationYears: PROGRAM.durationYears,
    },
    create: PROGRAM,
  });

  // 8. Дисципліни + зв'язки з програмою
  const disciplinesByCode = new Map<string, { id: number }>();
  for (const d of DISCIPLINES) {
    const discipline = await prisma.discipline.upsert({
      where: { code: d.code },
      update: { name: d.name, credits: d.credits },
      create: { name: d.name, code: d.code, credits: d.credits },
    });
    disciplinesByCode.set(d.code, discipline);

    await prisma.disciplineProgram.upsert({
      where: {
        disciplineId_programId: { disciplineId: discipline.id, programId: program.id },
      },
      update: { semester: d.semester },
      create: { disciplineId: discipline.id, programId: program.id, semester: d.semester },
    });
  }

  // 9. Матеріали — використовуємо стабільний ключ (title) для ідемпотентності.
  const materialTypeByName = new Map<string, { id: number }>();
  for (const t of MATERIAL_TYPES) {
    const found = await prisma.materialType.findUniqueOrThrow({ where: { name: t.name } });
    materialTypeByName.set(t.name, found);
  }

  const tagBySlug = new Map<string, { id: number }>();
  for (const t of TAGS) {
    const found = await prisma.tag.findUniqueOrThrow({ where: { slug: t.slug } });
    tagBySlug.set(t.slug, found);
  }

  for (let i = 0; i < MATERIAL_SEEDS.length; i++) {
    const m = MATERIAL_SEEDS[i]!;
    const author = teachers[i % teachers.length]!;
    const discipline = disciplinesByCode.get(m.disciplineCode);
    const matType = materialTypeByName.get(m.typeName);
    if (!discipline || !matType) {
      throw new Error(`Не знайдено дисципліну або тип для матеріалу: ${m.title}`);
    }

    const existing = await prisma.material.findFirst({ where: { title: m.title } });
    const tagIds = m.tagSlugs.map((s) => tagBySlug.get(s)?.id).filter((id): id is number => !!id);

    if (existing) {
      await prisma.material.update({
        where: { id: existing.id },
        data: {
          description: m.description,
          disciplineId: discipline.id,
          materialTypeId: matType.id,
        },
      });
      await prisma.materialTag.deleteMany({ where: { materialId: existing.id } });
      if (tagIds.length > 0) {
        await prisma.materialTag.createMany({
          data: tagIds.map((tagId) => ({ materialId: existing.id, tagId })),
        });
      }
    } else {
      const created = await prisma.material.create({
        data: {
          title: m.title,
          description: m.description,
          fileUrl: `/uploads/${PLACEHOLDER_FILENAME}`,
          fileSize: BigInt(MINIMAL_PDF.length),
          mimeType: 'application/pdf',
          authorId: author.id,
          disciplineId: discipline.id,
          materialTypeId: matType.id,
        },
      });
      if (tagIds.length > 0) {
        await prisma.materialTag.createMany({
          data: tagIds.map((tagId) => ({ materialId: created.id, tagId })),
        });
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log('✓ Seed завершено успішно.');
  // eslint-disable-next-line no-console
  console.log('  Тестові акаунти:');
  // eslint-disable-next-line no-console
  console.log('    admin    / Admin123!');
  // eslint-disable-next-line no-console
  console.log('    troschiy / Teacher123!');
  // eslint-disable-next-line no-console
  console.log('    student1 / Student123!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('✗ Seed помилка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
