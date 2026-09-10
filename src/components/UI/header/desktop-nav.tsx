import { NAV_ITEMS, isNavActive } from "./nav-config";
import { NavLink } from "./nav-link";

export function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
      {NAV_ITEMS.map((item) => (
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
