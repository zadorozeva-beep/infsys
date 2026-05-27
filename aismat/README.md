# АІС навчальних матеріалів

Автоматизована інформаційна система для зберігання та пошуку навчальних матеріалів закладу освіти (фаховий молодший бакалавр, спеціальність 121 «Інженерія програмного забезпечення»). Викладачі завантажують лекції, презентації, методички та тести; студенти шукають їх за дисципліною, типом, тегами або повнотекстовим пошуком; адміністратор керує користувачами й довідниками.

Проєкт побудовано у вигляді SPA-додатка з REST-бекендом: React + TypeScript на фронтенді, Express + Prisma + PostgreSQL на бекенді. JWT-автентифікація, рольова авторизація (admin / teacher / student), повнотекстовий пошук українською мовою через `tsvector` + `unaccent` із ранжуванням `ts_rank`.

Це фінальний курсовий проєкт, тому акцент зроблено на типобезпеці (TypeScript strict), валідації входу (Zod на обох рівнях), безпеці (bcrypt, helmet, CORS-allowlist, rate limiting, фільтрація MIME-типів, захист від path traversal) та структурованому логуванні (winston).

---

## Стек технологій

**Backend:**
- Node.js 20+ LTS
- TypeScript 5.4 (strict)
- Express.js 4
- Prisma 5 (ORM)
- PostgreSQL 16+ (тестовано на 18)
- Zod (валідація)
- bcrypt (12 rounds)
- jsonwebtoken (HS256, 24h)
- Multer (завантаження файлів, max 50 MB)
- helmet, cors, express-rate-limit
- winston
- tsx (запуск TS)

**Frontend:**
- React 18 + TypeScript
- Vite 5
- React Router 6
- TanStack Query 5
- Axios (з JWT-інтерсептором)
- Tailwind CSS 3
- React Hook Form + Zod
- lucide-react

---

## Передумови

Перед запуском переконайтеся, що встановлено:

- **Node.js 20+** — https://nodejs.org/uk
- **npm 10+** (постачається з Node)
- **PostgreSQL 16+** — https://www.postgresql.org/download/windows/

Перевірити версії:
```powershell
node --version
npm --version
psql --version   # потребує C:\Program Files\PostgreSQL\<версія>\bin у PATH
```

---

## Підготовка PostgreSQL

Цей крок ви виконуєте **один раз вручну**. Є три варіанти — оберіть зручніший.

### Варіант A (найпростіший) — через pgAdmin

1. Відкрийте **pgAdmin 4** (встановлюється разом із PostgreSQL).
2. Підключіться до сервера `PostgreSQL 18` своїм паролем суперюзера `postgres`.
3. ПКМ на `Databases` → **Create → Database…**
4. Поле `Database` = `aismat_db`. Owner = `postgres`. → Save.

### Варіант B — через `psql`

```powershell
# Додайте psql у PATH (одноразово, для поточного сеансу PowerShell):
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# Перевірте підключення:
psql -U postgres -h localhost -c "SELECT version();"

# Створіть БД:
psql -U postgres -h localhost -c "CREATE DATABASE aismat_db;"
```

### Варіант C — окремий користувач для проєкту (рекомендовано для безпеки)

```sql
-- У psql під postgres:
CREATE USER aismat_user WITH PASSWORD 'Admin123!';
CREATE DATABASE aismat_db OWNER aismat_user;
GRANT ALL PRIVILEGES ON DATABASE aismat_db TO aismat_user;
```

Потім у `backend/.env` замініть `postgres:ВАШ_ПАРОЛЬ` на `aismat_user:Admin123!`.

> **Розширення `unaccent` і `pg_trgm`** встановлюються автоматично під час першого запуску seed-скрипта (`npm run seed`) — окрема дія не потрібна.

---

## Швидкий старт

```powershell
# 1. Перейти у папку проєкту
cd c:\Users\Incognitus\Desktop\infsys\aismat

# 2. Налаштувати backend
cd backend
copy .env.example .env
# Відредагуйте backend/.env — вкажіть свій пароль у DATABASE_URL.
# За замовчуванням стоїть: postgres:Admin123!@localhost:5432/aismat_db
npm install
npm run migrate              # створить таблиці у aismat_db
npm run seed                 # додасть ролі, користувачів, дисципліни, 20 матеріалів,
                             # активує unaccent/pg_trgm, створить FTS-тригер та GIN-індекс
npm run dev                  # → http://localhost:3000

# 3. У ДРУГОМУ терміналі — frontend
cd c:\Users\Incognitus\Desktop\infsys\aismat\frontend
npm install
npm run dev                  # → http://localhost:5173
```

Відкрийте http://localhost:5173 — увійдіть як `admin` / `Admin123!`.

---

## Тестові акаунти (seed)

| Логін      | Пароль        | Роль    | ПІБ                              |
|------------|---------------|---------|----------------------------------|
| `admin`    | `Admin123!`   | admin   | Адміністратор Системи            |
| `troschiy` | `Teacher123!` | teacher | Трощій Юлія Георгіївна           |
| `matsak`   | `Teacher123!` | teacher | Мацак Тетяна Іванівна            |
| `kudinovych` | `Teacher123!` | teacher | Кудінович Дмитро Петрович      |
| `student1` | `Student123!` | student | Бондаренко Анна Сергіївна        |
| `student2` | `Student123!` | student | Коваленко Олег Петрович          |
| `student3` | `Student123!` | student | Шевченко Марія Іванівна          |
| `student4` | `Student123!` | student | Іваненко Денис Андрійович        |
| `student5` | `Student123!` | student | Петренко Софія Олександрівна     |

---

## Структура проєкту

```
aismat/
├── .gitignore
├── README.md                          ← ви читаєте
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .env                           ← створюється з .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/                ← створюється автоматично
│   │   ├── seed.ts                    ← seed-скрипт
│   │   └── sql/
│   │       └── add_search_vector.sql  ← FTS: extensions, trigger, GIN-індекс
│   ├── src/
│   │   ├── app.ts                     ← збирання Express-додатка
│   │   ├── server.ts                  ← bootstrap HTTP-сервера
│   │   ├── config/env.ts              ← Zod-валідація process.env
│   │   ├── db/prisma.ts               ← Prisma client singleton
│   │   ├── middleware/                ← auth, role, error, upload (multer)
│   │   ├── modules/
│   │   │   ├── auth/                  ← /api/auth/*
│   │   │   ├── users/                 ← /api/users/*  (admin)
│   │   │   ├── disciplines/           ← /api/disciplines/*
│   │   │   ├── tags/                  ← /api/tags
│   │   │   ├── material-types/        ← /api/material-types
│   │   │   ├── programs/              ← /api/programs
│   │   │   └── materials/             ← /api/materials/* — FTS, файли
│   │   └── utils/                     ← logger, jwt, errors
│   └── uploads/                       ← завантажені файли (у .gitignore)
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts                 ← проксі /api → :3000
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx                    ← роутинг + QueryClient + AuthContext
        ├── index.css                  ← Tailwind directives
        ├── api/                       ← axios.ts + endpoint-обгортки
        ├── components/                ← Layout, Navbar, ProtectedRoute, MaterialCard...
        ├── pages/                     ← Login, Register, MaterialsList, Detail, Upload, Admin
        ├── hooks/                     ← useAuth, useDebounce
        ├── store/auth.store.ts        ← JWT у localStorage + React Context
        └── types/index.ts             ← спільні TS-типи
```

---

## API-маршрути

| Метод   | Шлях                          | Опис                                 | Роль          |
|---------|-------------------------------|--------------------------------------|---------------|
| GET     | `/health`                     | Перевірка живості                    | публічно      |
| POST    | `/api/auth/register`          | Реєстрація студента                  | публічно      |
| POST    | `/api/auth/login`             | Логін → `{ token, user }`            | публічно      |
| GET     | `/api/auth/me`                | Поточний користувач                  | будь-який     |
| GET     | `/api/materials`              | Пошук + фільтри (`q`, `disciplineId`, `typeId`, `tags`, `limit`, `offset`) | публічно |
| GET     | `/api/materials/:id`          | Деталі матеріалу                     | публічно      |
| POST    | `/api/materials`              | Завантаження (multipart, поле `file`)| teacher, admin|
| PATCH   | `/api/materials/:id`          | Редагування                          | автор / admin |
| DELETE  | `/api/materials/:id`          | Видалення                            | автор / admin |
| GET     | `/api/materials/:id/file`     | Стрімінг файлу + інкремент лічильника| публічно      |
| GET     | `/api/disciplines`            | Перелік дисциплін                    | публічно      |
| POST    | `/api/disciplines`            | Створення                            | admin         |
| PATCH   | `/api/disciplines/:id`        | Редагування                          | admin         |
| DELETE  | `/api/disciplines/:id`        | Видалення                            | admin         |
| GET     | `/api/tags`                   | Перелік тегів                        | публічно      |
| GET     | `/api/material-types`         | Довідник типів                       | публічно      |
| GET     | `/api/programs`               | Перелік програм                      | публічно      |
| GET     | `/api/users`                  | Перелік користувачів                 | admin         |
| PATCH   | `/api/users/:id/role`         | Зміна ролі                           | admin         |
| DELETE  | `/api/users/:id`              | Видалення користувача                | admin         |

**Формат відповіді:**
- Успіх: `{ "data": ..., "meta": { count, total, limit, offset }? }`
- Помилка: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }`

---

## Команди npm

### Backend (`backend/`)
| Команда                  | Що робить                                       |
|--------------------------|--------------------------------------------------|
| `npm run dev`            | Запуск у dev-режимі з hot reload (`tsx watch`)   |
| `npm run build`          | Компіляція TS у `dist/`                         |
| `npm start`              | Запуск зібраного `dist/server.js`               |
| `npm run migrate`        | `prisma migrate dev` — застосувати міграції     |
| `npm run migrate:deploy` | `prisma migrate deploy` — для прод-середовища   |
| `npm run generate`       | `prisma generate` — перегенерувати клієнт       |
| `npm run seed`           | Заповнити БД тестовими даними + bootstrap FTS    |
| `npm run lint`           | ESLint                                           |
| `npm run format`         | Prettier                                         |

### Frontend (`frontend/`)
| Команда           | Що робить                       |
|-------------------|----------------------------------|
| `npm run dev`     | Dev-сервер Vite на :5173         |
| `npm run build`   | Виробничий білд у `dist/`        |
| `npm run preview` | Локальний перегляд продукт-білду |
| `npm run lint`    | ESLint                           |

---

## Перевірка роботи

Перевірка живості:
```powershell
curl http://localhost:3000/health
# {"data":{"status":"ok","uptime":12.34}}
```

Логін:
```powershell
curl -X POST http://localhost:3000/api/auth/login `
     -H "Content-Type: application/json" `
     -d '{\"login\":\"admin\",\"password\":\"Admin123!\"}'
```

Пошук матеріалів (повнотекстовий, із ранжуванням):
```powershell
curl "http://localhost:3000/api/materials?q=react&limit=5"
```

---

## Troubleshooting

**`password authentication failed for user "postgres"`**
→ Невірний пароль у `DATABASE_URL`. Перевірте `backend/.env`, рядок `DATABASE_URL`. Пароль має точно збігатися з тим, який ви вводили при встановленні PostgreSQL.

**`port 3000 already in use` / `EADDRINUSE`**
→ Або змініть `PORT` у `backend/.env`, або зупиніть процес, що тримає :3000:
```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Stop-Process -Id <PID>
```

**`Cannot find module '@prisma/client'`**
→ Запустіть `npm run generate` у `backend/`.

**`relation "..." does not exist`**
→ Міграції не застосовані. Запустіть `npm run migrate` у `backend/`.

**`function unaccent(text) does not exist`**
→ Розширення не встановлено. Запустіть `npm run seed` — він автоматично виконує `CREATE EXTENSION IF NOT EXISTS unaccent;`. Якщо seed не може створити розширення (потрібні superuser-права), виконайте вручну:
```sql
psql -U postgres -d aismat_db -c "CREATE EXTENSION IF NOT EXISTS unaccent; CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

**`CORS error` у браузері**
→ Перевірте, що `CORS_ORIGIN` у `backend/.env` дорівнює `http://localhost:5173`.

**`psql: command not found`**
→ Додайте до PATH: `C:\Program Files\PostgreSQL\<версія>\bin`. У PowerShell для поточного сеансу:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
```

**`Network error` / `ECONNREFUSED` у фронтенді**
→ Бекенд не запущено. Запустіть `npm run dev` у `backend/`. Vite-конфіг проксує `/api` на `:3000`.

**Файли більше 50 MB не завантажуються**
→ Це навмисне обмеження. Збільшіть `MAX_FILE_SIZE_MB` у `backend/.env` за потреби.

---

## Безпека (короткий чек-лист)

- Паролі — bcrypt, 12 rounds. `passwordHash` ніколи не повертається у JSON.
- JWT HS256, секрет ≥32 символи (валідація при старті через Zod).
- Усі raw SQL через `prisma.$queryRaw` із параметризацією (жодного `$queryRawUnsafe` із конкатенацією).
- CORS — суворий allowlist (`CORS_ORIGIN`).
- Rate limiting: 300 req / 15 хв глобально + 10 / 5 хв на `/api/auth/login`.
- Helmet з налаштуваннями за замовчуванням.
- Multer: whitelist MIME-типів, унікальні імена через `crypto.randomUUID()`, обмеження 50 MB.
- Захист від path traversal у `/api/materials/:id/file` — шлях нормалізується через `path.resolve` і перевіряється, що він усередині `UPLOAD_DIR`.
- HTTP-лог не пише тіла запитів, паролі чи токени — лише `userId`, метод, URL, статус, тривалість.
