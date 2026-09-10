# Header: роутинг и модули — дизайн

Дата: 2026-09-10  
Область: `src/components/UI/header/` (рефакторинг текущего `header.tsx`)  
По смыслу заменяет: `2026-09-09-header-architecture-refactor-design.md` (in-file split + active через `window`). Этот дизайн убирает подход с `useActiveHref`.

## Цель

Исправить архитектуру Header под Next.js App Router:

1. **Критично** — active nav через `usePathname`, без `window` / hash / popstate
2. **Поддержка** — единый конфиг nav/auth и один `AuthActions` для desktop + mobile
3. **Структура** — лёгкий split в `header/` как следствие пунктов (1)–(2), не ради самого пиления

## Вне scope

- Визуальный редизайн или правки `globals.css` / классов `site-header*`
- A11y мобильного меню (Escape, focus trap, click-outside) сверх текущего поведения
- Реальный auth-state / роли / меню профиля
- Архитектура всего `src/` за пределами Header

## Подход

Вариант 2 из brainstorming: active по pathname + общий конфиг/компоненты, затем разбиение по естественным швам в `components/UI/header/`.

## Структура файлов

```
src/components/UI/header/
  index.ts            # re-export default Header
  header.tsx          # оболочка: brand, desktop nav, auth, burger, mobile menu
  nav-config.ts       # NAV_ITEMS, AUTH_ITEMS, isNavActive
  nav-link.tsx        # одна ссылка; variant: desktop | mobile
  desktop-nav.tsx     # map NAV_ITEMS → NavLink
  mobile-menu.tsx     # панель + nav + AuthActions; закрытие по клику
  auth-actions.tsx    # Войти / Регистрация; variant: bar | menu
  brand-mark.tsx      # SVG-марка
```

- Заменить монолитный `src/components/UI/header.tsx` на каталог `header/` (без соседнего `header.tsx`).
- `layout.tsx` импортирует `@/components/UI/header` через `index.ts`.
- Сохранить существующие классы (`site-header`, `site-header__glow`, `site-header__mark`, `site-header__link`, `site-header__cta` и т.д.).

## Конфиг (`nav-config.ts`)

```ts
export type NavItem = { href: string; label: string };
export type AuthItem = {
  href: string;
  label: string;
  kind: "ghost" | "cta";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/recipes", label: "Рецепты" },
  { href: "/favorites", label: "Избранное" },
  { href: "/about", label: "О проекте" },
];

export const AUTH_ITEMS: AuthItem[] = [
  { href: "#login", label: "Войти", kind: "ghost" },
  { href: "#signup", label: "Регистрация", kind: "cta" },
];
```

В конфиге нет `isActive`. Auth-пункты — плейсхолдеры до реального auth; в active state не участвуют.

## Active state

Полностью удалить `useActiveHref` (без `window`, `hashchange`, `popstate`).

```ts
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- `Header` один раз вызывает `usePathname()` и передаёт `pathname` в `DesktopNav` и `MobileMenu`.
- Brand `/` сейчас не в `NAV_ITEMS`; ветка для `/` нужна на будущее и чтобы не помечать все маршруты active.
- Auth-ссылки никогда не ставят `aria-current`.
- `isNavActive` лежит в `nav-config.ts` рядом с типами (чистый хелпер, без React).

## Роутинг / ссылки

- Внутренний nav и brand: `next/link` с текущими Tailwind-классами (HeroUI v3 `Link` в этом рефакторе для App Router-маршрутов не используем).
- Auth `#login` / `#signup`: нативный `<a href="...">` без active-стилей; в mobile-меню по клику по-прежнему закрывают меню.

## Компоненты и состояние

| Юнит | Ответственность |
|------|-----------------|
| `Header` | `isOpen`, `useId` для `aria-controls`, lock `overflow` у body, `usePathname`; собирает brand, `DesktopNav`, `AuthActions variant="bar"`, burger, `MobileMenu` |
| `DesktopNav` / `MobileMenu` | Принимают `pathname`; мапят `NAV_ITEMS` → `NavLink` через `isNavActive` |
| `NavLink` | Только UI: `href`, `label`, `isActive`, `variant`, опциональный `onClick`; `aria-current="page"` при active |
| `AuthActions` | Одна реализация для bar и menu из `AUTH_ITEMS`; у menu-варианта — `onClose` |
| `BrandMark` | Только SVG |

Закрытие mobile-меню по клику на ссылку и восстановление overflow — как сейчас.

## Проверка

Вручную:

1. `/` — ни один пункт NAV не active
2. `/recipes` и `/recipes/anything` — «Рецепты» active (desktop + mobile)
3. `/favorites`, `/about` — соответствующие пункты active
4. Клики по nav — client navigation; active обновляется без полного reload
5. Открыть mobile-меню → клик по ссылке → меню закрывается; overflow у body восстанавливается
6. Визуально: brand, CTA, sticky header без намеренных изменений на `md` и ниже

## Критерии успеха

- В Header нет `window` / hash / popstate
- Active через `usePathname` + `isNavActive`
- Общие `NAV_ITEMS` / `AUTH_ITEMS` и один `AuthActions`
- Модули в `components/UI/header/` как выше
- Без намеренных визуальных/CSS-изменений; без расширения a11y/auth-state в этом изменении
