"use client";

import { buttonVariants, cn } from "@heroui/react";

import { useAuthStore } from "@/store/auth.store";
import { getUserDisplayName } from "@/utils/display-name";

import { AUTH_ITEMS, type AuthAction } from "./nav-config";

function ghostClass(variant: "bar" | "menu", desktopOnly = false) {
  if (variant === "menu") {
    return "cursor-pointer rounded-lg border-0 bg-transparent px-3 py-3 text-left text-[var(--kitchen-ink)]/80 disabled:opacity-60";
  }

  return cn(
    "cursor-pointer border-0 bg-transparent p-0 text-[0.95rem] text-[var(--kitchen-ink)]/75 transition-colors hover:text-[var(--kitchen-ink)] disabled:opacity-60",
    desktopOnly ? "hidden lg:inline" : "inline",
  );
}

function ctaClass(variant: "bar" | "menu") {
  return cn(
    buttonVariants({ variant: "primary" }),
    "site-header__cta",
    variant === "bar" ? "hidden sm:inline-flex" : "justify-center",
  );
}

export function AuthActions({
  variant,
  onAction,
}: {
  variant: "bar" | "menu";
  onAction?: (action: AuthAction) => void;
}) {
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const op = useAuthStore((s) => s.op);
  const logoutError = useAuthStore((s) => s.logoutError);
  const openModal = useAuthStore((s) => s.openModal);
  const logout = useAuthStore((s) => s.logout);
  const clearLogoutError = useAuthStore((s) => s.clearLogoutError);
  const isSigningOut = op === "logout";

  if (sessionStatus === "loading") {
    return (
      <div
        className={cn(
          "site-header__session pointer-events-none opacity-0",
          variant === "menu" && "site-header__session--menu",
        )}
        aria-hidden
      >
        <div className="site-header__user">
          <span className="site-header__user-label">за столом</span>
          <span className="site-header__username">…</span>
        </div>
        <span className="site-header__session-rule" />
        <span className="site-header__signout">Выйти</span>
      </div>
    );
  }

  if (sessionStatus === "authenticated" && sessionUser) {
    const label = getUserDisplayName(sessionUser);

    return (
      <div
        className={cn(
          "site-header__session",
          variant === "menu" && "site-header__session--menu",
        )}
      >
        {label ? (
          <div className="site-header__user" title={label}>
            <span className="site-header__user-label">за столом</span>
            <span className="site-header__username">{label}</span>
          </div>
        ) : null}
        {label ? <span className="site-header__session-rule" aria-hidden /> : null}
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            className="site-header__signout"
            disabled={isSigningOut}
            onClick={async () => {
              if (isSigningOut) return;
              clearLogoutError();
              await logout();
            }}
          >
            {isSigningOut ? "Выход…" : "Выйти"}
          </button>
          {logoutError && !isSigningOut ? (
            <p
              className="max-w-[12rem] text-right text-xs text-[var(--kitchen-beet)]"
              role="alert"
            >
              {logoutError}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <>
      {AUTH_ITEMS.map((item) => {
        const isCta = item.kind === "cta";

        return (
          <button
            key={item.action}
            type="button"
            className={
              isCta ? ctaClass(variant) : ghostClass(variant, variant === "bar")
            }
            onClick={() => {
              if (onAction) {
                onAction(item.action);
                return;
              }
              openModal(item.action);
            }}
          >
            {item.label}
          </button>
        );
      })}
    </>
  );
}
