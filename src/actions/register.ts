"use server";

import { Prisma } from "@prisma/client";

import { FormDataType } from "@/types/form-data";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/zod";
import {
  authUnavailableMessage,
  rateLimitedMessage,
} from "@/utils/auth-messages";
import { callAuthRateLimitStore } from "@/utils/auth-store";
import { getClientIp } from "@/utils/client-ip";
import {
  consumeAuthRateLimits,
  grantLoginRateLimitBypassSafe,
  refundAuthRateLimits,
} from "@/utils/auth-rate-limit";
import { saltAndHashPassword } from "@/utils/password";

/** Нейтральное сообщение — не раскрывает, занят ли email. */
const REGISTER_FAILED =
  "Не удалось зарегистрироваться. Если у вас уже есть аккаунт — войдите.";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export async function registerUser(formData: FormDataType) {
  const parsed = registerSchema.safeParse(formData);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Некорректные данные" };
  }

  const { email, password } = parsed.data;

  const ip = await getClientIp();
  const rateInput = {
    action: "register" as const,
    ip,
    email,
    limit: REGISTER_LIMIT,
    windowMs: REGISTER_WINDOW_MS,
  };

  let rate;
  try {
    rate = await callAuthRateLimitStore(() => consumeAuthRateLimits(rateInput));
  } catch {
    return { error: authUnavailableMessage() };
  }

  if (!rate.ok) {
    return {
      error: rateLimitedMessage(rate.retryAfterSec),
      retryAfterSec: rate.retryAfterSec,
    };
  }

  try {
    const pwHash = await saltAndHashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: pwHash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    await grantLoginRateLimitBypassSafe(email);

    return { ok: true as const, user };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Дубликат email — слот остаётся (анти-абьюз перебора).
      return { error: REGISTER_FAILED };
    }

    try {
      await refundAuthRateLimits(rateInput);
    } catch (refundError) {
      console.error(
        "Не удалось откатить register rate-limit после ошибки:",
        refundError,
      );
    }
    console.error("Ошибка регистрации:", error);
    return { error: "Ошибка при регистрации" };
  }
}
