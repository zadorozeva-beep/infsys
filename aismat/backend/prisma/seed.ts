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
  { name: 'Docker', slug: 'docker' },
  { name: 'Git', slug: 'git' },
  { name: 'Testing', slug: 'testing' },
  { name: 'Security', slug: 'security' },
  { name: 'Node.js', slug: 'nodejs' },
  { name: 'Networking', slug: 'networking' },
  { name: 'CI/CD', slug: 'ci-cd' },
  { name: 'Design Patterns', slug: 'design-patterns' },
  { name: 'Cryptography', slug: 'cryptography' },
  { name: 'Accessibility', slug: 'accessibility' },
  { name: 'Cloud', slug: 'cloud' },
  { name: 'Computer Graphics', slug: 'graphics' },
  { name: 'Mathematics', slug: 'math' },
  { name: 'UML', slug: 'uml' },
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
  {
    login: 'savchenko',
    fullName: 'Савченко Ірина Володимирівна',
    email: 'savchenko@example.com',
    phone: '+380504445566',
  },
  {
    login: 'maksymenko',
    fullName: 'Максименко Юрій Вікторович',
    email: 'maksymenko@example.com',
    phone: '+380505556677',
  },
  {
    login: 'kucher',
    fullName: 'Кучер Тетяна Василівна',
    email: 'kucher@example.com',
    phone: '+380506667788',
  },
  {
    login: 'boyko',
    fullName: 'Бойко Едуард Олександрович',
    email: 'boyko@example.com',
    phone: '+380507778899',
  },
  {
    login: 'chudnikova',
    fullName: 'Чуднікова Юлія Володимирівна',
    email: 'chudnikova@example.com',
    phone: '+380508889900',
  },
  {
    login: 'kukharskyi',
    fullName: 'Кухарський Богдан Віталійович',
    email: 'kukharskyi@example.com',
    phone: '+380509990011',
  },
  {
    login: 'kudria',
    fullName: 'Кудря Олександр Миколайович',
    email: 'kudria@example.com',
    phone: '+380501010102',
  },
];

const STUDENTS = [
  { login: 'student1', fullName: 'Бондаренко Анна Сергіївна', email: 'a.bondarenko@example.com' },
  { login: 'student2', fullName: 'Коваленко Олег Петрович', email: 'o.kovalenko@example.com' },
  { login: 'student3', fullName: 'Шевченко Марія Іванівна', email: 'm.shevchenko@example.com' },
  { login: 'student4', fullName: 'Іваненко Денис Андрійович', email: 'd.ivanenko@example.com' },
  { login: 'student5', fullName: 'Петренко Софія Олександрівна', email: 's.petrenko@example.com' },
  { login: 'student6', fullName: 'Ткаченко Артем Вікторович', email: 'a.tkachenko@example.com' },
  { login: 'student7', fullName: 'Мельник Вікторія Романівна', email: 'v.melnyk@example.com' },
  { login: 'student8', fullName: 'Гриценко Назар Олегович', email: 'n.grytsenko@example.com' },
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
  { name: 'Операційні системи', code: 'OS-303', credits: 5, semester: 5 },
  { name: 'Комп’ютерні мережі', code: 'NET-304', credits: 5, semester: 5 },
  { name: 'Безпека програмного забезпечення', code: 'SEC-402', credits: 4.5, semester: 6 },
  { name: 'Іноземна мова (за професійним спрямуванням)', code: 'ENG-101', credits: 4, semester: 1 },
  { name: 'Історія України та української культури', code: 'HIST-101', credits: 3, semester: 1 },
  { name: 'Вища математика', code: 'MATH-102', credits: 5, semester: 1 },
  { name: 'Вступ до спеціальності', code: 'INTRO-100', credits: 3, semester: 1 },
  { name: 'Фізична культура', code: 'PE-100', credits: 3, semester: 1 },
  { name: 'Економічна теорія', code: 'ECON-105', credits: 4, semester: 2 },
  { name: 'Основи екології', code: 'ECO-104', credits: 3, semester: 2 },
  { name: 'Основи правознавства', code: 'LAW-103', credits: 3, semester: 2 },
  { name: 'Дискретна математика', code: 'DM-106', credits: 4, semester: 2 },
  { name: 'Групова динаміка і комунікації', code: 'SOFT-107', credits: 3, semester: 2 },
  { name: 'Диференціальні рівняння', code: 'MATH-203', credits: 4, semester: 3 },
  { name: 'Системи керування базами даних', code: 'DBMS-302', credits: 5, semester: 4 },
  { name: 'Комп’ютерна графіка', code: 'CG-306', credits: 4, semester: 4 },
  { name: 'Хмарні технології', code: 'CLOUD-305', credits: 4, semester: 5 },
  { name: 'Конструювання програмного забезпечення', code: 'CSE-401', credits: 5, semester: 6 },
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
  {
    title: 'Контейнеризація застосунків із Docker',
    description:
      'Лекція про образи та контейнери Docker, написання Dockerfile, docker-compose для багатосервісних застосунків (Node.js + PostgreSQL).',
    disciplineCode: 'OS-303',
    typeName: 'Лекція',
    tagSlugs: ['docker', 'nodejs', 'postgresql'],
  },
  {
    title: 'Процеси, потоки та планування в ОС',
    description:
      'Лекція про моделі процесів і потоків, стани процесу, алгоритми планування (FCFS, SJF, Round Robin) та контекстне перемикання.',
    disciplineCode: 'OS-303',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Лабораторна робота №4: налаштування Docker-середовища',
    description:
      'Завдання передбачає контейнеризацію backend-застосунку, опис docker-compose та підключення бази даних PostgreSQL у контейнері.',
    disciplineCode: 'OS-303',
    typeName: 'Лабораторна робота',
    tagSlugs: ['docker', 'nodejs'],
  },
  {
    title: 'Модель OSI та стек протоколів TCP/IP',
    description:
      'Лекція про сім рівнів моделі OSI, відповідність стеку TCP/IP, інкапсуляцію даних та призначення ключових протоколів.',
    disciplineCode: 'NET-304',
    typeName: 'Лекція',
    tagSlugs: ['networking'],
  },
  {
    title: 'Презентація: протокол HTTP/HTTPS та TLS-рукостискання',
    description:
      'Презентація з розбором структури HTTP-запитів і відповідей, методів, кодів статусу та механізму TLS-рукостискання для HTTPS.',
    disciplineCode: 'NET-304',
    typeName: 'Презентація',
    tagSlugs: ['networking', 'rest-api', 'security'],
  },
  {
    title: 'Тест із комп’ютерних мереж: адресація та маршрутизація',
    description:
      'Контрольний тест на знання IP-адресації, масок підмережі, основ маршрутизації та різниці між TCP і UDP.',
    disciplineCode: 'NET-304',
    typeName: 'Тест',
    tagSlugs: ['networking'],
  },
  {
    title: 'Найпоширеніші вразливості веб-застосунків (OWASP Top 10)',
    description:
      'Лекція з оглядом OWASP Top 10: SQL-ін’єкції, XSS, CSRF, небезпечна автентифікація та практики захисту від них.',
    disciplineCode: 'SEC-402',
    typeName: 'Лекція',
    tagSlugs: ['security', 'rest-api'],
  },
  {
    title: 'Автентифікація та авторизація: JWT, OAuth 2.0, сесії',
    description:
      'Методичка з порівнянням підходів до автентифікації, структури JWT, потоків OAuth 2.0 та безпечного зберігання токенів.',
    disciplineCode: 'SEC-402',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['security', 'rest-api', 'nodejs'],
  },
  {
    title: 'Юніт- та інтеграційне тестування на Vitest',
    description:
      'Лекція про піраміду тестування, написання юніт-тестів на Vitest, моки, фікстури та інтеграційне тестування API.',
    disciplineCode: 'SE-101',
    typeName: 'Лекція',
    tagSlugs: ['testing', 'typescript', 'nodejs'],
  },
  {
    title: 'Лабораторна робота №5: покриття коду тестами',
    description:
      'Завдання з написання набору тестів для сервісного шару застосунку та досягнення заданого рівня покриття коду.',
    disciplineCode: 'SE-101',
    typeName: 'Лабораторна робота',
    tagSlugs: ['testing', 'typescript'],
  },
  {
    title: 'CI/CD пайплайни на GitHub Actions',
    description:
      'Лекція про автоматизацію складання, тестування й розгортання: workflow, jobs, кеш залежностей, секрети та матричні збірки.',
    disciplineCode: 'SE-101',
    typeName: 'Лекція',
    tagSlugs: ['ci-cd', 'git', 'docker'],
  },
  {
    title: 'Code review та статичний аналіз коду',
    description:
      'Методичка про культуру код-рев’ю, типові зауваження, налаштування ESLint/Prettier і ворота якості в пайплайні.',
    disciplineCode: 'SE-101',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['testing', 'git', 'typescript'],
  },
  {
    title: 'Індекси та оптимізація запитів у PostgreSQL',
    description:
      'Лекція про B-tree/GIN/GiST індекси, читання EXPLAIN ANALYZE, типові причини повільних запитів та їх усунення.',
    disciplineCode: 'DB-201',
    typeName: 'Лекція',
    tagSlugs: ['postgresql', 'sql'],
  },
  {
    title: 'Резервне копіювання та відновлення бази даних',
    description:
      'Методичка з pg_dump/pg_restore, стратегій бекапу (повний, інкрементальний), PITR та перевірки цілісності відновлення.',
    disciplineCode: 'DB-201',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['postgresql', 'sql'],
  },
  {
    title: 'Керування станом застосунку з TanStack Query',
    description:
      'Лекція про кешування серверного стану, інвалідацію, оптимістичні оновлення та різницю між клієнтським і серверним станом.',
    disciplineCode: 'WEB-301',
    typeName: 'Лекція',
    tagSlugs: ['react', 'typescript', 'rest-api'],
  },
  {
    title: 'Доступність (a11y) у веб-інтерфейсах',
    description:
      'Методичка про семантичний HTML, ARIA-атрибути, навігацію з клавіатури, контраст кольорів і тестування доступності.',
    disciplineCode: 'WEB-301',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['accessibility', 'html', 'css'],
  },
  {
    title: 'Хеш-таблиці: геш-функції та розв’язання колізій',
    description:
      'Лекція про принцип роботи хеш-таблиць, методи ланцюжків і відкритої адресації, амортизовану складність операцій.',
    disciplineCode: 'ALG-202',
    typeName: 'Лекція',
    tagSlugs: ['algorithms', 'typescript'],
  },
  {
    title: 'Жадібні алгоритми та задачі оптимізації',
    description:
      'Презентація з класичними жадібними задачами (розмін монет, інтервальне планування, код Гаффмана) та межами їх застосовності.',
    disciplineCode: 'ALG-202',
    typeName: 'Презентація',
    tagSlugs: ['algorithms'],
  },
  {
    title: 'Патерни проєктування GoF: породжувальні та структурні',
    description:
      'Лекція з оглядом патернів Factory, Builder, Singleton, Adapter, Decorator з прикладами реалізації на TypeScript.',
    disciplineCode: 'OOP-202',
    typeName: 'Лекція',
    tagSlugs: ['design-patterns', 'oop', 'typescript'],
  },
  {
    title: 'Керування пам’яттю та віртуальна пам’ять в ОС',
    description:
      'Лекція про сторінкову організацію пам’яті, таблиці сторінок, заміщення сторінок та механізм swap.',
    disciplineCode: 'OS-303',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'DNS, DHCP та маршрутизація в локальних мережах',
    description:
      'Методичка з розбором роботи DNS-резолвінгу, видачі адрес через DHCP та базового налаштування маршрутизації.',
    disciplineCode: 'NET-304',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['networking'],
  },
  {
    title: 'Криптографія: симетричне й асиметричне шифрування',
    description:
      'Лекція про AES, RSA, гешування (SHA-2), цифрові підписи та сценарії застосування в захисті даних і HTTPS.',
    disciplineCode: 'SEC-402',
    typeName: 'Лекція',
    tagSlugs: ['cryptography', 'security'],
  },

  // ── Дисципліни групи ПЗ-222 (загальноосвітні та фахові) ──────────────
  {
    title: 'Professional English: IT-лексика та читання документації',
    description:
      'Лекція з фахової англійської: технічна термінологія, читання документації та опис програмних рішень англійською.',
    disciplineCode: 'ENG-101',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Українська державність: ключові етапи становлення',
    description:
      'Лекція про основні періоди історії України та формування національної культурної ідентичності.',
    disciplineCode: 'HIST-101',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Границі, похідні та інтеграли: основи аналізу',
    description:
      'Лекція з вищої математики: поняття границі, диференціювання та інтегрування функцій однієї змінної.',
    disciplineCode: 'MATH-102',
    typeName: 'Лекція',
    tagSlugs: ['math'],
  },
  {
    title: 'Професія інженера-програміста: ролі та траєкторії розвитку',
    description:
      'Вступна лекція про спеціальність 121, ролі в IT-командах, технологічний стек і кар’єрні траєкторії.',
    disciplineCode: 'INTRO-100',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Загальна фізична підготовка: методичні вказівки',
    description:
      'Методичні рекомендації щодо самостійних занять, комплексів вправ та контролю фізичного навантаження.',
    disciplineCode: 'PE-100',
    typeName: 'Методичні рекомендації',
    tagSlugs: [],
  },
  {
    title: 'Попит, пропозиція та ринкова рівновага',
    description:
      'Лекція з мікроекономіки: закони попиту й пропозиції, еластичність та формування ринкової ціни.',
    disciplineCode: 'ECON-105',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Основи екології та сталий розвиток',
    description:
      'Лекція про екосистеми, антропогенний вплив, принципи сталого розвитку та екологічну відповідальність.',
    disciplineCode: 'ECO-104',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Основи конституційного права України',
    description:
      'Лекція про систему права, Конституцію України, права та обов’язки громадянина.',
    disciplineCode: 'LAW-103',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Множини, відношення та комбінаторика',
    description:
      'Лекція з дискретної математики: операції над множинами, бінарні відношення, основи комбінаторики.',
    disciplineCode: 'DM-106',
    typeName: 'Лекція',
    tagSlugs: ['math', 'algorithms'],
  },
  {
    title: 'Командна робота та комунікація в IT-проєктах',
    description:
      'Лекція про ролі в команді, ефективну комунікацію, розв’язання конфліктів і зворотний зв’язок.',
    disciplineCode: 'SOFT-107',
    typeName: 'Лекція',
    tagSlugs: [],
  },
  {
    title: 'Диференціальні рівняння першого порядку',
    description:
      'Лекція з методів розв’язання ДР першого порядку: з відокремлюваними змінними, лінійні, однорідні.',
    disciplineCode: 'MATH-203',
    typeName: 'Лекція',
    tagSlugs: ['math'],
  },
  {
    title: 'Архітектура СКБД та транзакційна обробка',
    description:
      'Лекція про компоненти системи керування базами даних, планувальник запитів, журналювання й ACID.',
    disciplineCode: 'DBMS-302',
    typeName: 'Лекція',
    tagSlugs: ['postgresql', 'sql'],
  },
  {
    title: 'Лабораторна робота: проєктування схеми БД та SQL-запити',
    description:
      'Завдання з побудови ER-моделі, створення таблиць, обмежень і написання вибірок із кількома з’єднаннями.',
    disciplineCode: 'DBMS-302',
    typeName: 'Лабораторна робота',
    tagSlugs: ['sql', 'postgresql'],
  },
  {
    title: 'Растрова та векторна графіка: основи',
    description:
      'Лекція про моделі кольору, формати зображень, відмінності растру й вектора та сфери застосування.',
    disciplineCode: 'CG-306',
    typeName: 'Лекція',
    tagSlugs: ['graphics'],
  },
  {
    title: 'Презентація: 2D/3D-перетворення та проєкції',
    description:
      'Презентація про афінні перетворення, матриці трансформацій та види проєкцій у комп’ютерній графіці.',
    disciplineCode: 'CG-306',
    typeName: 'Презентація',
    tagSlugs: ['graphics'],
  },
  {
    title: 'Моделі хмарних сервісів: IaaS, PaaS, SaaS',
    description:
      'Лекція про моделі надання хмарних послуг, провайдерів, переваги й ризики переходу в хмару.',
    disciplineCode: 'CLOUD-305',
    typeName: 'Лекція',
    tagSlugs: ['cloud', 'docker'],
  },
  {
    title: 'Лабораторна робота: розгортання застосунку в хмарі',
    description:
      'Завдання з контейнеризації та розгортання Node.js-застосунку в хмарному середовищі з налаштуванням оточення.',
    disciplineCode: 'CLOUD-305',
    typeName: 'Лабораторна робота',
    tagSlugs: ['cloud', 'docker', 'nodejs'],
  },
  {
    title: 'UML-діаграми у проєктуванні програмного забезпечення',
    description:
      'Лекція про діаграми класів, послідовності та прецедентів як інструмент проєктування й документування ПЗ.',
    disciplineCode: 'CSE-401',
    typeName: 'Лекція',
    tagSlugs: ['uml', 'design-patterns'],
  },
  {
    title: 'Методичка: специфікація вимог та архітектура застосунку',
    description:
      'Методичні рекомендації зі збору й специфікації вимог, вибору архітектурного стилю та оформлення документації.',
    disciplineCode: 'CSE-401',
    typeName: 'Методичні рекомендації',
    tagSlugs: ['uml', 'design-patterns'],
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
