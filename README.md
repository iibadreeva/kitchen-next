# Kitchen

Next.js-приложение «Русская кухня» с **HeroUI v3** и Tailwind CSS v4.

## Стек

- [Next.js](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [HeroUI v3](https://www.heroui.com/docs/react/getting-started/quick-start) (`@heroui/react`, `@heroui/styles`)
- [HeroUI old](https://v2.heroui.com/docs/components/navbar)
- [Tailwind CSS v4](https://tailwindcss.com/)

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
```

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
