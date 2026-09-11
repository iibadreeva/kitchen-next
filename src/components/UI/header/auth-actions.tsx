import { buttonVariants, cn } from "@heroui/react";

import { AUTH_ITEMS, type AuthAction } from "./nav-config";

export function AuthActions({
  variant,
  onAction,
}: {
  variant: "bar" | "menu";
  onAction: (action: AuthAction) => void;
}) {
  return (
    <>
      {AUTH_ITEMS.map((item) => {
        const isCta = item.kind === "cta";

        if (variant === "bar") {
          return (
            <button
              key={item.action}
              type="button"
              className={
                isCta
                  ? cn(
                      buttonVariants({ variant: "primary" }),
                      "site-header__cta hidden sm:inline-flex",
                    )
                  : "hidden cursor-pointer border-0 bg-transparent p-0 text-[0.95rem] text-[var(--kitchen-ink)]/75 transition-colors hover:text-[var(--kitchen-ink)] lg:inline"
              }
              onClick={() => onAction(item.action)}
            >
              {item.label}
            </button>
          );
        }

        return (
          <button
            key={item.action}
            type="button"
            className={
              isCta
                ? cn(
                    buttonVariants({ variant: "primary" }),
                    "site-header__cta justify-center",
                  )
                : "cursor-pointer rounded-lg border-0 bg-transparent px-3 py-3 text-left text-[var(--kitchen-ink)]/80"
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
