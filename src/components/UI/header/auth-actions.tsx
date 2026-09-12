"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { buttonVariants, cn } from "@heroui/react";

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
  onAction: (action: AuthAction) => void;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (status === "loading") {
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

  if (status === "authenticated" && session?.user) {
    const label = getUserDisplayName(session.user);

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
        <button
          type="button"
          className="site-header__signout"
          disabled={isSigningOut}
          onClick={async () => {
            if (isSigningOut) return;
            setIsSigningOut(true);
            try {
              await signOut({ redirect: false });
              router.refresh();
            } catch (error) {
              console.error("Ошибка выхода:", error);
            } finally {
              setIsSigningOut(false);
            }
          }}
        >
          {isSigningOut ? "Выход…" : "Выйти"}
        </button>
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
            onClick={() => onAction(item.action)}
          >
            {item.label}
          </button>
        );
      })}
    </>
  );
}
