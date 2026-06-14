# Розгортання у хмарі (Neon + Render + Vercel)

Безкоштовний стек: **Neon** (PostgreSQL) → **Render** (backend) → **Vercel** (frontend).
Код уже підготовлено: конфіги `render.yaml`, `aismat/frontend/vercel.json`, абсолютні URL через `VITE_API_BASE_URL`.

---

## 0. GitHub
Код уже в репозиторії `github.com/zadorozeva-beep/infsys` (гілка `main`). Усі сервіси деплоять звідти.

---

## 1. База даних — Neon
1. Зайти на **neon.tech** → зареєструватись (через GitHub) → **Create project**.
2. Регіон обрати найближчий (Europe).
3. Після створення відкрити **Connection string** → скопіювати рядок виду
   `postgresql://USER:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   (бери **Pooled connection**). Це майбутній `DATABASE_URL`.

---

## 2. Backend — Render
1. Зайти на **render.com** → зареєструватись (через GitHub).
2. **New → Blueprint** → обрати репозиторій `infsys`. Render підхопить `render.yaml` і створить сервіс `aismat-backend`.
3. У налаштуваннях сервісу → **Environment** задати змінні (ті, що `sync: false`):
   - `DATABASE_URL` = рядок із Neon (крок 1);
   - `JWT_SECRET` = будь-який рядок ≥32 символів;
   - `CORS_ORIGIN` = **тимчасово** `*` (оновимо після кроку 3, коли буде домен Vercel).
4. **Create / Deploy**. Білд: `npm install && prisma generate && build`; старт: `prisma migrate deploy && node dist/server.js`.
   Міграції застосуються автоматично.
5. Коли сервіс «Live» — скопіювати його URL, напр. `https://aismat-backend.onrender.com`.
6. **Наповнити БД** (один раз): у сервісі Render → вкладка **Shell** → виконати:
   ```
   npm run seed
   ```
   (за бажанням: `npm run seed:events`, `seed:plan`, `seed:notifications`, `seed:versions`).

> Health-check: відкрий `https://<backend>.onrender.com/health` — має повернути `{"data":{"status":"ok"...}}`.
> Free-план «засинає» — перший запит після паузи вантажиться ~30–50 с.

---

## 3. Frontend — Vercel
1. Зайти на **vercel.com** → зареєструватись (через GitHub) → **Add New → Project** → імпортувати `infsys`.
2. **Root Directory** → вказати `aismat/frontend`. Framework — Vite (визначиться сам).
3. **Environment Variables** → додати:
   - `VITE_API_BASE_URL` = `https://<backend>.onrender.com/api` (URL із кроку 2.5, **з `/api` в кінці**).
4. **Deploy**. Отримаєш домен, напр. `https://aismat.vercel.app`.

---

## 4. Зв'язати CORS
1. Повернутись у **Render → Environment** → змінити `CORS_ORIGIN` на домен Vercel:
   `https://aismat.vercel.app` (без слешу в кінці) → зберегти (сервіс перезапуститься).

Готово. Відкрий домен Vercel → вхід `admin / Admin123!`.

---

## Примітки
- **Завантажені файли** на Render free — тимчасові (зникають при перезапуску). Демо-дані з `seed` працюють завжди. Для постійного сховища потрібен S3/Cloudflare R2 (окреме налаштування).
- **WebSocket/сповіщення**: socket.io-client сам обере websocket або polling — працює на Render.
- Будь-який `git push` у `main` автоматично передеплоїть і Render, і Vercel.
