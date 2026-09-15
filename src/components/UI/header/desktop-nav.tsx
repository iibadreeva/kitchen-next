"use client";

import { useAuthStore } from "@/store/auth.store";

import { isNavActive, visibleNavItems } from "./nav-config";
import { NavLink } from "./nav-link";

export function DesktopNav({ pathname }: { pathname: string }) {
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const isAuthenticated =
    sessionStatus === "authenticated" && sessionUser != null;
  const items = visibleNavItems(isAuthenticated);

  return (
    <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
      {items.map((item) => (
        <li key={item.href}>
          <NavLink
            href={item.href}
            label={item.label}
            isActive={isNavActive(pathname, item.href)}
            variant="desktop"
          />
        </li>
      ))}
    </ul>
  );
}
