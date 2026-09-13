"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import LoginModal from "@/components/UI/modals/login.modal";
import RegistrationModal from "@/components/UI/modals/registration.modal";
import { layoutConfig } from "@/config/layout.config";
import { siteConfig } from "@/config/site.config";
import { useAuthStore } from "@/store/auth.store";

import { AuthActions } from "./auth-actions";
import { BrandMark } from "./brand-mark";
import { DesktopNav } from "./desktop-nav";
import { MobileMenu } from "./mobile-menu";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const modal = useAuthStore((s) => s.modal);
  const openModal = useAuthStore((s) => s.openModal);
  const closeModal = useAuthStore((s) => s.closeModal);

  const menuId = useId();
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav
      className={`site-header h-[${layoutConfig.headerHeight}] sticky top-0 z-40 w-full`}
    >
      <div className="site-header__glow" aria-hidden />
      <header className="relative mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          title={siteConfig.title}
          href="/"
          className="group relative z-10 flex items-center gap-3 text-[var(--kitchen-ink)] no-underline outline-none"
        >
          <span className="site-header__mark text-[var(--kitchen-beet)] transition-transform duration-300 group-hover:-rotate-6">
            <BrandMark className="h-10 w-10" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-[family-name:var(--font-display)] text-[1.15rem] font-semibold tracking-[-0.03em] sm:text-[1.35rem]">
              {siteConfig.title}
            </span>
            <span className="mt-1 text-[0.68rem] font-medium tracking-[0.18em] text-[var(--kitchen-sage)] uppercase">
              домашние рецепты
            </span>
          </span>
        </Link>

        <DesktopNav pathname={pathname} />

        <div className="relative z-10 flex items-center gap-2 sm:gap-3">
          <AuthActions variant="bar" />

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
        pathname={pathname}
        onClose={() => setIsOpen(false)}
        onAuthAction={(action) => {
          setIsOpen(false);
          openModal(action);
        }}
      />

      <LoginModal isOpen={modal === "login"} onClose={closeModal} />
      <RegistrationModal isOpen={modal === "signup"} onClose={closeModal} />
    </nav>
  );
}
