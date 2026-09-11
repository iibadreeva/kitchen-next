import Link from "next/link";
import { buttonVariants, cn } from "@heroui/react";

function EmptyPlate({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden>
      <circle
        cx="100"
        cy="100"
        r="92"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.28"
      />
      <circle
        cx="100"
        cy="100"
        r="72"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.45"
      />
      <circle
        cx="100"
        cy="100"
        r="48"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 7"
        opacity="0.35"
      />
      <path
        d="M68 108c8-14 22-22 32-22s24 8 32 22"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="not-found relative px-4 py-16 sm:px-6">
      <div className="not-found__glow" aria-hidden />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <p className="not-found__eyebrow mb-6 text-[0.7rem] font-medium tracking-[0.22em] text-[var(--kitchen-sage)] uppercase">
          Пустая тарелка
        </p>

        <div className="not-found__mark relative mb-8 flex h-40 w-40 shrink-0 items-center justify-center sm:h-48 sm:w-48">
          <EmptyPlate className="not-found__plate pointer-events-none absolute inset-0 h-full w-full text-[var(--kitchen-beet)]" />
          <span className="relative z-10 font-[family-name:var(--font-display)] text-[3.75rem] leading-none font-semibold tracking-[-0.06em] text-[var(--kitchen-beet)] sm:text-[4.5rem]">
            404
          </span>
        </div>

        <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-semibold tracking-[-0.03em] text-[var(--kitchen-ink)] sm:text-[2.1rem]">
          Страница не найдена
        </h1>
        <p className="mt-3 max-w-md text-[0.98rem] leading-relaxed text-[var(--kitchen-ink)]/65">
          Этот адрес не ведёт к рецепту. Вернитесь на кухню — там снова найдёте
          блюда.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "primary" }),
              "site-header__cta not-found__cta",
            )}
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
