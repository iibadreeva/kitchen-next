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

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
