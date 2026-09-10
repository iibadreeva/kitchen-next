"use client";

import { useEffect, useId, useState } from "react";
import { Link, buttonVariants, cn } from "@heroui/react";

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/recipes", label: "Рецепты" },
  { href: "/favorites", label: "Избранное" },
  { href: "/about", label: "О проекте" },
];

function useActiveHref(items: NavItem[]) {
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const hrefKey = items.map((item) => item.href).join("\0");

  useEffect(() => {
    const hrefs = new Set(hrefKey.split("\0").filter(Boolean));

    const sync = () => {
      const { hash, pathname } = window.location;

      if (hash && hrefs.has(hash)) {
        setActiveHref(hash);
        return;
      }

      if (hrefs.has(pathname)) {
        setActiveHref(pathname);
        return;
      }

      setActiveHref(null);
    };

    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);

    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [hrefKey]);

  return activeHref;
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle
        cx="20"
        cy="20"
        r="19"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.35"
      />
      <path
        d="M12 16.5c0-2.2 2.6-4 5.8-4h4.4c3.2 0 5.8 1.8 5.8 4v1.2c0 .7-.4 1.3-1 1.6l-1.2.6v6.1c0 1.7-1.8 3-4.1 3h-4.4c-2.3 0-4.1-1.3-4.1-3v-6.1l-1.2-.6c-.6-.3-1-.9-1-1.6V16.5Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M16 14.2c.8-1.4 2.4-2.3 4-2.3s3.2.9 4 2.3"
        stroke="var(--kitchen-porcelain)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="20" cy="11" r="1.35" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function NavLink({
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

function DesktopNav({ activeHref }: { activeHref: string | null }) {
  return (
    <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
      {NAV_ITEMS.map((item) => (
        <li key={item.href}>
          <NavLink
            href={item.href}
            label={item.label}
            isActive={activeHref === item.href}
            variant="desktop"
          />
        </li>
      ))}
    </ul>
  );
}

function AuthActions() {
  return (
    <>
      <Link
        href="#login"
        className="hidden text-[0.95rem] text-[var(--kitchen-ink)]/75 no-underline transition-colors hover:text-[var(--kitchen-ink)] lg:inline"
      >
        Войти
      </Link>
      <Link
        href="#signup"
        className={cn(
          buttonVariants({ variant: "primary" }),
          "site-header__cta hidden sm:inline-flex",
        )}
      >
        Регистрация
      </Link>
    </>
  );
}

function MobileMenu({
  id,
  isOpen,
  activeHref,
  onClose,
}: {
  id: string;
  isOpen: boolean;
  activeHref: string | null;
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
              isActive={activeHref === item.href}
              variant="mobile"
              onClick={onClose}
            />
          </li>
        ))}
        <li className="mt-2 grid gap-2 border-t border-[var(--kitchen-ink)]/8 pt-4">
          <Link
            href="#login"
            className="rounded-lg px-3 py-3 text-[var(--kitchen-ink)]/80 no-underline"
            onClick={onClose}
          >
            Войти
          </Link>
          <Link
            href="#signup"
            className={cn(
              buttonVariants({ variant: "primary" }),
              "site-header__cta justify-center",
            )}
            onClick={onClose}
          >
            Регистрация
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const activeHref = useActiveHref(NAV_ITEMS);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav className="site-header sticky top-0 z-40 w-full">
      <div className="site-header__glow" aria-hidden />
      <header className="relative mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group relative z-10 flex items-center gap-3 text-[var(--kitchen-ink)] no-underline outline-none"
        >
          <span className="site-header__mark text-[var(--kitchen-beet)] transition-transform duration-300 group-hover:-rotate-6">
            <BrandMark className="h-10 w-10" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold tracking-[-0.03em] sm:text-[1.35rem]">
              Русская кухня
            </span>
            <span className="mt-1 text-[0.68rem] font-medium tracking-[0.18em] text-[var(--kitchen-sage)] uppercase">
              домашние рецепты
            </span>
          </span>
        </Link>

        <DesktopNav activeHref={activeHref} />

        <div className="relative z-10 flex items-center gap-2 sm:gap-3">
          <AuthActions />

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--kitchen-ink)]/10 bg-[var(--kitchen-porcelain)] text-[var(--kitchen-ink)] shadow-[0_1px_0_rgba(23,32,40,0.04)] transition hover:border-[var(--kitchen-beet)]/30 hover:text-[var(--kitchen-beet)] md:hidden"
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setIsOpen((open) => !open)}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeWidth="1.8"
                  d="M6 6l12 12M18 6L6 18"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeWidth="1.8"
                  d="M4 7h16M4 12h16M4 17h10"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      <MobileMenu
        id={menuId}
        isOpen={isOpen}
        activeHref={activeHref}
        onClose={() => setIsOpen(false)}
      />
    </nav>
  );
}
