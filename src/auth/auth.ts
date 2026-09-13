import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authorizeCredentials } from "@/auth/authorize-credentials";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js (next-auth v5 beta).
 *
 * Сейчас используется Credentials + JWT:
 * - credentials-сессии не пишутся в таблицу sessions;
 * - Session-модель и PrismaAdapter оставлены для совместимости с Auth.js
 *   и будущих OAuth/database-session сценариев.
 *
 * trustHost включайте в production только за доверенным прокси,
 * который перезаписывает proxy-заголовки.
 */
export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost:
    process.env.NODE_ENV !== "production" ||
    process.env.AUTH_TRUST_HOST === "true",
  session: {
    strategy: "jwt",
    // Auth.js: maxAge в секундах. 7 суток — баланс UX и риска украденной cookie.
    maxAge: 7 * 24 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (user) {
        token.name = user.name ?? null;
        token.email = user.email ?? token.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const id = token.id ?? token.sub;

        if (typeof id === "string" && id.length > 0) {
          session.user.id = id;
        } else if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }

        session.user.name = typeof token.name === "string" ? token.name : null;

        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }

      return session;
    },
  },
});
