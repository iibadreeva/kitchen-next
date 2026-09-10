import Link from "next/link";
import { cn } from "@heroui/react";

export function NavLink({
  href,
  label,
  isActive,
  variant,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  variant: "desktop" | "mobile";
  onClick?: () => void;
}) {
  if (variant === "desktop") {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group site-header__link relative rounded-md px-3.5 py-2 text-[0.95rem] text-[var(--kitchen-ink)]/70 no-underline transition-colors duration-200",
          "hover:text-[var(--kitchen-ink)]",
          isActive && "text-[var(--kitchen-ink)]",
        )}
      >
        {label}
        <span
          className={cn(
            "absolute inset-x-3 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-[var(--kitchen-beet)] transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100",
            isActive && "scale-x-100",
          )}
          aria-hidden
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "block rounded-lg px-3 py-3 text-base no-underline transition-colors",
        isActive
          ? "bg-[var(--kitchen-beet)]/8 font-medium text-[var(--kitchen-beet)]"
          : "text-[var(--kitchen-ink)]/80 hover:bg-[var(--kitchen-ink)]/4 hover:text-[var(--kitchen-ink)]",
      )}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}
