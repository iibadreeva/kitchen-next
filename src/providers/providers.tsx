"use client";

import { I18nProvider } from "@heroui/react";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider locale="ru-RU">{children}</I18nProvider>
    </SessionProvider>
  );
}
