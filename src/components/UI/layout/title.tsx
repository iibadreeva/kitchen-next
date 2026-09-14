"use client";

import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/UI/header/nav-config";
import { siteConfig } from "@/config/site.config";

const Title = () => {
  const pathname = usePathname();

  const currentNavItem = NAV_ITEMS.find((item) => item.href === pathname);

  const pageTitle = currentNavItem ? currentNavItem.label : siteConfig.title;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="border-l-[3px] border-[var(--kitchen-beet)] py-6 pl-4 sm:py-7 sm:pl-5">
        <p className="mb-1.5 text-[0.68rem] font-medium tracking-[0.18em] text-[var(--kitchen-sage)] uppercase">
          Раздел
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-semibold tracking-[-0.03em] text-[var(--kitchen-ink)] sm:text-[2.1rem]">
          {pageTitle}
        </h1>
      </div>
    </div>
  );
};

export default Title;
