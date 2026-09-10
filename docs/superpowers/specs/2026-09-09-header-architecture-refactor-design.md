# Header architecture refactor — design

Date: 2026-09-09  
Scope: `src/components/UI/header.tsx` only (light in-file refactor)

## Goal

Improve the Header component’s code structure without changing visuals or UX behavior. Remove hardcoded `isActive`, derive the active nav item from `pathname` / `hash`, and reduce desktop/mobile link markup duplication.

## Non-goals

- Visual redesign or CSS/`globals.css` changes
- Accessibility upgrades (Escape, focus trap, click-outside) beyond what already exists
- Auth state for «Войти» / «Регистрация»
- Splitting into a `header/` folder or multiple files
- Changing HeroUI usage patterns

## Approach

Keep everything in a single file. Extract local presentational pieces and a small active-href hook. Prefer a shared `NavLink` with a `variant` over a heavy shared `NavList`.

## File structure (top to bottom)

1. **`NAV_ITEMS`** — `{ href: string; label: string }[]` only (no `isActive`)
2. **`useActiveHref(items)`** — returns the current active `href` or `null`
3. **`BrandMark`** — existing SVG mark (unchanged markup/classes)
4. **`NavLink`** — one link; props: `href`, `label`, `isActive`, `variant: "desktop" | "mobile"`, optional `onClick`
5. **`DesktopNav`** — maps `NAV_ITEMS` → `NavLink variant="desktop"`
6. **`AuthActions`** — desktop «Войти» + «Регистрация» (existing markup)
7. **`MobileMenu`** — drawer panel; nav via `NavLink variant="mobile"` + auth links; closes on link click
8. **`Header`** — sticky shell, brand, desktop nav, auth, burger, mobile menu; owns `isOpen` / `menuId` / body overflow lock

Preserve existing class names (`site-header`, `site-header__glow`, `site-header__mark`, `site-header__link`, `site-header__cta`, etc.) so styling stays intact.

## Active href (`useActiveHref`)

Resolution order on each sync:

1. If `window.location.hash` is non-empty and matches an item `href` → that href
2. Else if `window.location.pathname` matches an item `href` → that href
3. Else → `null` (no highlight)

Listeners: `hashchange` and `popstate`. Initial client sync in `useEffect` (SSR-safe: start as `null`, never read `window` during render). Matching is exact string equality (e.g. `#favorites`).

Remove hardcoded `isActive: true` from «Избранное».

## Desktop / mobile link dedup

`NavLink` owns the two visual variants that already exist:

- **desktop** — underline scale indicator, muted/active text colors
- **mobile** — block padding, beet-tinted active background

Both set `aria-current="page"` when active. Mobile passes `onClick` to close the menu.

Do not introduce a single `NavList` with large conditional trees; keep thin wrappers (`DesktopNav`, `MobileMenu`).

## State ownership

- `Header` keeps `isOpen` and `useId()` for `aria-controls`
- Existing `useEffect` body `overflow` lock stays as-is
- `useActiveHref` is independent of the mobile menu state

## Testing / verification

Manual:

1. Load `/` with no hash → no nav item active
2. Navigate to `#favorites` (or set hash) → «Избранное» active on desktop and mobile
3. Change hash to `#recipes` / `#about` → active underline/background moves
4. Open mobile menu, click a link → menu closes; overflow restored
5. Visual spot-check: brand, CTA, sticky header look unchanged at `md` and below

## Success criteria

- Single-file refactor only
- No intentional visual/CSS changes
- Active state driven by hash/pathname, not hardcoded flags
- Nav link markup shared via `NavLink` variants
