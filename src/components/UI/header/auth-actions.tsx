import { buttonVariants, cn } from "@heroui/react";

import { AUTH_ITEMS } from "./nav-config";

export function AuthActions({
  variant,
  onClose,
}: {
  variant: "bar" | "menu";
  onClose?: () => void;
}) {
  return (
    <>
      {AUTH_ITEMS.map((item) => {
        const isCta = item.kind === "cta";

        if (variant === "bar") {
          return (
            <a
              key={item.href}
              href={item.href}
              className={
                isCta
                  ? cn(
                      buttonVariants({ variant: "primary" }),
                      "site-header__cta hidden sm:inline-flex",
                    )
                  : "hidden text-[0.95rem] text-[var(--kitchen-ink)]/75 no-underline transition-colors hover:text-[var(--kitchen-ink)] lg:inline"
              }
            >
              {item.label}
            </a>
          );
        }

        return (
          <a
            key={item.href}
            href={item.href}
            className={
              isCta
                ? cn(
                    buttonVariants({ variant: "primary" }),
                    "site-header__cta justify-center",
                  )
                : "rounded-lg px-3 py-3 text-[var(--kitchen-ink)]/80 no-underline"
            }
            onClick={onClose}
          >
            {item.label}
          </a>
        );
      })}
    </>
  );
}
