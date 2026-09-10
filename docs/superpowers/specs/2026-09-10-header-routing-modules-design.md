# Header routing & modules — design

Date: 2026-09-10  
Scope: `src/components/UI/header/` (refactor of current `header.tsx`)  
Supersedes in spirit: `2026-09-09-header-architecture-refactor-design.md` (in-file split + `window`-based active). This design replaces that active-href approach.

## Goal

Fix Header architecture for Next.js App Router:

1. **Critical** — active nav from `usePathname`, no `window` / hash / popstate
2. **Maintainability** — single nav/auth config and one `AuthActions` for desktop + mobile
3. **Structure** — light `header/` module split as a consequence of (1)–(2), not for its own sake

## Non-goals

- Visual redesign or `globals.css` / `site-header*` class changes
- Mobile a11y upgrades (Escape, focus trap, click-outside) beyond current behavior
- Real auth state / roles / profile menu
- App-wide folder architecture outside Header

## Approach

Approach 2 from brainstorming: pathname-based active state + shared config/components, then split along natural seams into `components/UI/header/`.

## File structure

```
src/components/UI/header/
  index.ts            # re-export default Header
  header.tsx          # shell: brand, desktop nav, auth, burger, mobile menu
  nav-config.ts       # NAV_ITEMS, AUTH_ITEMS
  nav-link.tsx        # one link; variant: desktop | mobile
  desktop-nav.tsx     # map NAV_ITEMS → NavLink
  mobile-menu.tsx     # panel + nav + AuthActions; closes on link click
  auth-actions.tsx    # Войти / Регистрация; variant: bar | menu
  brand-mark.tsx      # SVG mark
```

- Replace monolithic `src/components/UI/header.tsx` with the `header/` directory (no leftover sibling `header.tsx`).
- `layout.tsx` imports `@/components/UI/header` via `index.ts`.
- Preserve existing class names (`site-header`, `site-header__glow`, `site-header__mark`, `site-header__link`, `site-header__cta`, etc.).

## Config (`nav-config.ts`)

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

No `isActive` on config items. Auth items are placeholders until real auth; they do not participate in active state.

## Active state

Remove `useActiveHref` entirely (no `window`, `hashchange`, or `popstate`).

```ts
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- `Header` calls `usePathname()` once and passes `pathname` into `DesktopNav` and `MobileMenu`.
- Brand `/` is not in `NAV_ITEMS` today; the `/` branch is for correctness if it is added later and to avoid marking every route active.
- Auth links never set `aria-current`.
- Put `isNavActive` in `nav-config.ts` next to the item types (pure helper, no React).

## Routing / links

- Internal nav and brand: `next/link` with the existing Tailwind classes (HeroUI v3 `Link` is not used for App Router routes in this refactor).
- Auth `#login` / `#signup`: native `<a href="...">` without active styling; still close the mobile menu on click when rendered inside it.

## Components & state

| Unit | Responsibility |
|------|----------------|
| `Header` | `isOpen`, `useId` for `aria-controls`, body `overflow` lock, `usePathname`; composes brand, `DesktopNav`, `AuthActions variant="bar"`, burger, `MobileMenu` |
| `DesktopNav` / `MobileMenu` | Receive `pathname`; map `NAV_ITEMS` → `NavLink` via `isNavActive` |
| `NavLink` | Presentational: `href`, `label`, `isActive`, `variant`, optional `onClick`; `aria-current="page"` when active |
| `AuthActions` | Single implementation for bar + menu from `AUTH_ITEMS`; menu variant accepts `onClose` |
| `BrandMark` | SVG only |

Mobile menu close-on-nav and overflow restore stay as today.

## Testing / verification

Manual:

1. `/` → no NAV item active
2. `/recipes` and `/recipes/anything` → «Рецепты» active (desktop + mobile)
3. `/favorites`, `/about` → matching items active
4. Nav clicks → client navigation; active updates without full reload
5. Open mobile menu → click link → menu closes; body overflow restored
6. Visual spot-check: brand, CTA, sticky header unchanged at `md` and below

## Success criteria

- No `window` / hash / popstate usage in Header
- Active driven by `usePathname` + `isNavActive`
- Shared `NAV_ITEMS` / `AUTH_ITEMS` and one `AuthActions`
- Modules under `components/UI/header/` as above
- No intentional visual/CSS changes; no a11y/auth-state expansion in this change
