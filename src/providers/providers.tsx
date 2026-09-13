"use client";

import { I18nProvider } from "@heroui/react";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { AuthSessionSync } from "@/providers/auth-session-sync";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSessionSync />
      <I18nProvider locale="ru-RU">{children}</I18nProvider>
    </SessionProvider>
  );
}
