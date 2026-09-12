# Kitchen

Next.js-приложение «Русская кухня» с **HeroUI v3**, Tailwind CSS v4 и **Prisma**.

## Стек

- [Next.js](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [HeroUI v3](https://www.heroui.com/docs/react/getting-started/quick-start) (`@heroui/react`, `@heroui/styles`)
- [HeroUI old](https://v2.heroui.com/docs/components/navbar)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) — ORM для работы с базой данных
- [Auth.js](https://authjs.dev/) — аутентификация (Credentials + JWT)

> Документация **v2** (`HeroUIProvider`, `@heroui/theme`, framer-motion) не подходит — используйте [HeroUI v3](https://www.heroui.com/docs/react/getting-started/quick-start).

## Требования

- Node.js 20+
- React 19+
- Tailwind CSS v4

## Установка

```bash
npm install
```

Основные пакеты HeroUI:

```bash
npm i @heroui/react @heroui/styles
```

## Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Другие команды:

```bash
npm run build        # production-сборка
npm run start        # запуск production-сервера
npm run lint         # ESLint
npm run format       # Prettier
npm run format:check # проверка форматирования
npm run prisma:generate # генерация Prisma Client
npm run prisma:push     # применить schema.prisma к БД (без миграций)
npm run prisma:migrate  # миграции БД (история изменений)
npm run prisma:studio   # GUI для данных
```

## Prisma

В проекте используется [Prisma ORM 6.19.2](https://www.prisma.io/) для доступа к PostgreSQL. Версия зафиксирована: Prisma 7+ меняет формат схемы (`prisma.config.ts`, другой generator) и несовместима с текущими файлами без миграции.

- Схема: `prisma/schema.prisma`
- Клиент: `src/lib/prisma.ts` (singleton для Next.js)
- Строка подключения: `DATABASE_URL` в `.env` (пример — `.env.example`)

### Схема и синхронизация с БД

1. Описываем модели в `prisma/schema.prisma` (поля, связи, `@@map` / `@map` для имён таблиц и колонок).
2. Указываем реальный `DATABASE_URL` в `.env`.
3. Пушим схему в PostgreSQL:

```bash
npm run prisma:push
```

`prisma db push` применяет текущую схему к базе напрямую и перегенерирует Prisma Client. Подходит для локальной разработки, пока не нужна история миграций. Когда понадобится версионирование схемы в команде/проде — используйте `npm run prisma:migrate`.

После чистого `npm install` (если схему в БД ещё не пушили):

```bash
# укажите реальный DATABASE_URL в .env
npm run prisma:generate
npm run prisma:push
```

Не используйте `npx prisma@latest` / `init --db` — `latest` может поставить Prisma 7/8, а `--db` относится к managed Prisma Postgres.

## Auth.js

Для входа и сессий используется [Auth.js](https://authjs.dev/) (`next-auth` **v5 beta**). Credentials + JWT; `PrismaAdapter` — задел под OAuth.

> **Beta:** API `next-auth@5` ещё может меняться. Перед обновлением пакета прогоняйте login/register и смотрите [changelog Auth.js](https://authjs.dev/). Не обновляйте мажорно без регрессии форм входа.

В `.env` обязательны `AUTH_SECRET` и в production — `AUTH_URL` (см. `.env.example`). Правила пароля при регистрации общие: `src/lib/zod.ts` (сервер и форма). Email нормализуется (`trim` + lower case).

`trustHost` включён в development; в production — только при `AUTH_TRUST_HOST=true` (доверенный прокси). Иначе полагайтесь на `AUTH_URL`.

Сессия JWT: `maxAge` = 7 суток. Для UI подтягивается на клиенте через `SessionProvider` (без `auth()` в root layout), чтобы публичные страницы не становились полностью динамическими.

### Миграции Prisma (Auth-модели)

Миграция `20250912215000_auth_models` — **greenfield** (`CREATE TABLE`), не `ALTER` поверх старой схемы `users` (uuid / обязательный password / `create_at`).

| Ситуация | Действие |
|----------|----------|
| Пустая БД | `npm run prisma:migrate` (или `prisma migrate deploy`) |
| Таблицы уже созданы через `db push` и совпадают со схемой | Baseline: `npx prisma migrate resolve --applied 20250912215000_auth_models` |
| Есть данные со **старой** схемой | Нужен отдельный ALTER (переименование колонок, `password` → optional, uuid→cuid и т.д.) — этот SQL не применяйте «в лоб» |

Старые пользователи с plaintext-паролями не смогут войти — нужна повторная регистрация или ручной перехеш.

### Rate limit

- Login: атомарный **reserve** (`consume`) до проверки пароля; при успехе — **refund** (ошибки store не ломают вход), при неудаче слот остаётся (закрывает TOCTOU от параллельных попыток).
- Register: каждая попытка расходует лимит; при блоке по IP email-бакет откатывается. При неожиданной ошибке БД слот **refund**; при `P2002` (email занят) — нет (анти-абьюз).
- Bypass после регистрации: один успешный login без reserve; `has`/`peek` не снимают ключ, `take` — только после успешного пароля. Исчерпанный лимит всё равно режется через `peek` (окно bypass ≠ неограниченный brute-force).
- Store: in-memory в development; при `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — общий Upstash с атомарным `consume` / `take` / `refund` (Lua).
- IP-лимит только при `TRUST_PROXY=true` (не путать с `AUTH_TRUST_HOST`). Без известного IP — только per-email (общий soft-cap убран: он давал DoS на всех пользователей).
- Сбой store при login/register → `auth_unavailable` (не «неверный пароль»), bcrypt без лимита не выполняется.
- **Production:** Upstash обязателен. Исключение — один инстанс с явным `ALLOW_IN_MEMORY_RATE_LIMIT=true`. За прокси включайте `TRUST_PROXY=true` для IP-лимитов.

Документация: [authjs.dev](https://authjs.dev/), установка для Next.js: [Getting started](https://authjs.dev/getting-started/installation?framework=Next.js).

> Если в git когда-либо попадал реальный `DATABASE_URL` / API-токен (в т.ч. в `.env.example`) — ротируйте секрет в провайдере БД, даже после замены на placeholder.

### Чеклист деплоя Auth

1. `AUTH_SECRET`, `AUTH_URL` (prod), при необходимости `AUTH_TRUST_HOST`.
2. Миграции: пустая БД → `prisma migrate deploy`; уже после `db push` → `prisma migrate resolve --applied 20250912215000_auth_models` (не гоняйте greenfield SQL повторно).
3. `TRUST_PROXY=true` только за прокси, который перезаписывает `x-forwarded-for` / `x-real-ip`.
4. Upstash в production (или `ALLOW_IN_MEMORY_RATE_LIMIT=true` на одном процессе).
5. Смоук: регистрация → авто-вход, неверный пароль, rate-limit UI (`rate_limited:<sec>`), `auth_unavailable` при сбое store, дубликат email.

## Настройка HeroUI

### Стили

В `src/app/globals.css` порядок импортов важен — сначала Tailwind, затем HeroUI:

```css
@import "tailwindcss";
@import "@heroui/styles";
```

PostCSS уже настроен в `postcss.config.mjs` через `@tailwindcss/postcss`.

### Провайдер

В HeroUI **v3** корневой `HeroUIProvider` не нужен. Для локали React Aria (даты, календари и т.п.) используется `I18nProvider` в `src/providers/providers.tsx` с `locale="ru-RU"`.

### Использование компонентов

```tsx
import { Button } from "@heroui/react";

export default function Example() {
  return <Button>Сохранить</Button>;
}
```

Компоненты часто составные, например `Card.Header`, `Card.Content`. Для интерактивных элементов предпочтителен `onPress` вместо `onClick`.

## Полезные ссылки

- [Quick Start](https://www.heroui.com/docs/react/getting-started/quick-start)
- [Next.js / Frameworks](https://www.heroui.com/docs/react/getting-started/frameworks)
- [Компоненты](https://www.heroui.com/docs/react/components)
- [Темы](https://www.heroui.com/docs/react/getting-started/theming)
- [Миграция со v2](https://www.heroui.com/docs/react/migration)
- [Prisma](https://www.prisma.io/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Auth.js](https://authjs.dev/)
- [Auth.js + Next.js](https://authjs.dev/getting-started/installation?framework=Next.js)
