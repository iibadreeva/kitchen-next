# Kitchen

Next.js-приложение «Русская кухня» с **HeroUI v3**, Tailwind CSS v4 и **Prisma**.

## Стек

- [Next.js](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [HeroUI v3](https://www.heroui.com/docs/react/getting-started/quick-start) (`@heroui/react`, `@heroui/styles`)
- [HeroUI old](https://v2.heroui.com/docs/components/navbar)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) — ORM для работы с базой данных

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
