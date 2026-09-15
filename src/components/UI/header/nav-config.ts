export type NavItem = {
  href: string;
  label: string;
  /** Пункт только для авторизованных пользователей. */
  authRequired?: boolean;
};

export type AuthAction = "login" | "signup";

export type AuthItem = {
  action: AuthAction;
  label: string;
  kind: "ghost" | "cta";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Рецепты" },
  { href: "/ingredients", label: "Ингредиенты", authRequired: true },
  { href: "/about", label: "О проекте" },
];

export const AUTH_ITEMS: AuthItem[] = [
  { action: "login", label: "Войти", kind: "ghost" },
  { action: "signup", label: "Регистрация", kind: "cta" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function visibleNavItems(isAuthenticated: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.authRequired || isAuthenticated);
}
