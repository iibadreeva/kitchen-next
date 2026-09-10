import { cn } from "@heroui/react";

import { AuthActions } from "./auth-actions";
import { NAV_ITEMS, isNavActive } from "./nav-config";
import { NavLink } from "./nav-link";

export function MobileMenu({
  id,
  isOpen,
  pathname,
  onClose,
}: {
  id: string;
  isOpen: boolean;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div
      id={id}
      className={cn(
        "overflow-hidden border-[var(--kitchen-ink)]/8 bg-[var(--kitchen-porcelain)]/95 backdrop-blur-xl md:hidden",
        "transition-[max-height,opacity,border-color] duration-300 ease-out",
        isOpen
          ? "max-h-96 border-t opacity-100"
          : "pointer-events-none max-h-0 border-t-0 opacity-0",
      )}
    >
      <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <NavLink
              href={item.href}
              label={item.label}
              isActive={isNavActive(pathname, item.href)}
              variant="mobile"
              onClick={onClose}
            />
          </li>
        ))}
        <li className="mt-2 grid gap-2 border-t border-[var(--kitchen-ink)]/8 pt-4">
          <AuthActions variant="menu" onClose={onClose} />
        </li>
      </ul>
    </div>
  );
}
